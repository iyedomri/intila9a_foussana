# Intila9a Foussana — architecture and authorization baseline

**Phase 1 status: complete.** This document is the implementation contract for the
next phases. The portal intentionally serves **elementary grades 1 through 6
only**. There is no generic grade entry point: `grades.level` has a database
constraint of `1..6`, and all grade selectors are populated from that table.

## Architecture decision

The application uses a single, modular **Next.js App Router** deployment rather
than a separate NestJS service. Route Handlers under `/api/v1` provide the public
HTTP API and Server Actions are used only by first-party authenticated forms.
Both call the same server-side services and authorization policies. This avoids
duplicating authentication and RBAC logic while keeping a clean boundary that can
be extracted to a separate service later if scale requires it.

```text
Browser (Next.js UI; no authorization decisions)
        │ HTTPS, secure cookie, CSRF token for mutations
        ▼
Next.js middleware ── security headers, origin/CSRF gate, session precheck
        ▼
Route Handler / Server Action  ── Zod parse + authenticated request context
        ▼
Authorization policy ── role, ownership, child/grade/class scope, deny by default
        ▼
Application service ── transaction, audit event, notification/outbox orchestration
        ▼
Repository (Prisma only; scoped query predicates are mandatory)
        ├─────────────► PostgreSQL (private network)
        ├─────────────► S3-compatible MinIO/S3 (private; signed URLs only)
        └─────────────► Email provider adapter (minimal notification data)
```

### Why these boundaries matter

- **The client never supplies authority.** User IDs, roles, child IDs and content
  scope are read from the authenticated server context and verified against the
  database. A client filter is only a convenience filter.
- **Services own transactions.** A mutation and its audit record are committed in
  one database transaction. Notification creation happens through an outbox-like
  service boundary so a failed email never rolls back published content.
- **Repositories return scoped data, not unrestricted records.** Detail queries
  take an `AccessScope`; they do not expose a `findById(id)` method to UI code.
- **Prisma is the only application database access layer.** No feature uses raw
  SQL. The initial migration has a few database triggers/checks as defense in
  depth for cross-row invariants that normal foreign keys cannot express.

## Planned source layout

```text
src/
├── app/
│   ├── (auth)/                         # login, reset, forced-password-change
│   ├── (portal)/                       # authenticated role-specific pages
│   ├── api/v1/                         # versioned HTTP Route Handlers
│   ├── layout.tsx
│   └── middleware.ts                   # request edge prechecks
├── components/
│   ├── ui/                             # shadcn primitives
│   ├── layout/                         # sidebar, topbar, language/theme controls
│   └── shared/                         # accessible domain-neutral components
├── features/
│   ├── auth/ users/ assignments/ posts/ events/
│   ├── calendar/ notifications/ moderation/ audit/
│   └── dashboard/                      # feature-local views and client schemas
├── server/
│   ├── auth/                           # session, password, TOTP, lockout
│   ├── authorization/                  # policies and AccessScope builders
│   ├── services/                       # use cases and transactions
│   ├── repositories/                   # Prisma-backed, scope-safe access
│   ├── validators/                     # shared server Zod schemas
│   ├── storage/ email/ audit/           # provider interfaces/adapters
│   ├── security/                       # rate limits, CSRF, headers, sanitization
│   └── openapi/                        # route contracts and OpenAPI document
├── lib/                                # framework-neutral helpers/config/i18n
├── messages/                           # fr (default), ar, en locale catalogs
└── types/                              # narrow shared TypeScript types
prisma/
├── schema.prisma
├── migrations/
│   └── 20261115000000_initial_school_portal/
└── seed.ts                             # added with the executable app foundation
tests/
├── unit/                               # services, policies, validators
├── integration/                        # repository and route authorization tests
└── e2e/                                # Playwright role journeys
```

No `any` is permitted. Server-only modules will be guarded with `server-only` so
that credential-bearing code cannot be bundled into the browser.

## Data model

`prisma/schema.prisma` and the checked-in initial PostgreSQL migration are the
source of truth. UUID primary keys, `TIMESTAMPTZ`, named foreign keys, indexes,
checks, and enum types are intentionally explicit.

| Domain | Models | Key design choices |
| --- | --- | --- |
| Identity | `User`, `Session`, `PasswordResetToken` | One active account per normalized lowercase email; optional normalized username; session/reset values are **SHA-256 hashes**, never raw bearer values. Accounts are deactivated, not deleted in normal administration. |
| School structure | `Grade`, `SchoolClass`, `Subject`, `TeacherAssignment` | Grade level is constrained to 1–6. A class belongs to exactly one grade. An assignment is grade-wide (`classId = null`) or class-specific. Partial unique indexes prevent duplicate assignments despite PostgreSQL null semantics. |
| Family structure | `StudentProfile`, `ParentStudent` | A student has one class; a parent can link to many students. Database triggers ensure only `STUDENT` accounts get profiles and only `PARENT → STUDENT` links exist. |
| Publishing | `Post`, `PostFile`, `Event` | Posts always have grade + subject and may target a class. Draft is the safe default. Events have an audience plus optional grade. Deleted items remain recoverable with actor, timestamp and reason. |
| Accountability | `Notification`, `AuditLog` | Notifications are per-recipient. Audit events have actor, entity, entity id, network metadata and minimal JSON metadata. The audit table must not receive passwords, reset/session tokens, TOTP secrets, or full request bodies. |

### Database invariants beyond simple relations

The initial migration adds these defense-in-depth controls:

1. Grade values are only 1–6; class/subject/title values cannot be blank.
2. A class-specific teacher assignment must name a class from its stated grade.
3. Assignment/profile/parent-link roles are checked against `users.role`.
4. A post's class must belong to its grade. A teacher author must hold a matching
   assignment for the post's grade, class (if any) and subject; a director may
   post without an assignment. A non-teacher/non-director cannot author a post.
5. Only a director may author events.
6. Soft deletion requires a timestamp, actor, and non-blank reason. Event time
   ranges and file scan-state pairs are valid by constraint.
7. Account roles are immutable after creation. This prevents a role edit from
   silently invalidating author, class or family authorization relationships;
   the Director creates a correctly scoped replacement account and deactivates
   the old one instead.
8. Narrow and partial indexes support the visibility, feed, calendar, unread
   notification, session and audit queries rather than relying on table scans.

These safeguards **do not replace** application authorization. Every request
still authenticates and applies its policy before it can read or mutate a row.

## Authorization model

### Shared rules

1. Start from **deny**. Resolve a live session and active account first.
2. Resolve the actor's current database role; never trust a cookie claim alone.
3. Validate input with a server Zod schema before a service call. Discard unknown
   keys (no mass assignment).
4. For a mutation, require same-origin/CSRF validation and then apply the
   role-specific policy below inside the service transaction.
5. For reads, apply the visibility predicate in the initial database query. A
   record that is not visible returns a generic `404`, not an existence-revealing
   `403`.
6. Inactive accounts, expired/revoked sessions, unpublished/deleted posts,
   rejected/pending files, and unlinked parent children are invisible by default.

### Role-permission matrix

| Capability | Director | Teacher | Student | Parent |
| --- | :---: | :---: | :---: | :---: |
| View own profile, active notifications | ✓ | ✓ | ✓ | ✓ |
| Read published post | All active/non-deleted posts | Only posts visible to one of the teacher's assignments | Own grade + own class or grade-wide | Linked child's grade + class or grade-wide, selected child only |
| Download a post file | Same as post | Same as post | Same as post | Same as post |
| Create/update post | Any scope | Own assigned subject/grade/class scope only | — | — |
| Delete/restore post | Any post; deletion reason required | Own post only; deletion reason required | — | — |
| View event | All non-deleted events | `TEACHERS` or `ALL` | `STUDENTS_AND_PARENTS` or `ALL`, own grade/all-grade | Same as student for each linked child |
| Create/update/delete event | ✓, audience + optional grade | — | — | — |
| Create/edit/deactivate users | ✓ | — | — | — |
| Manage assignments and parent-child links | ✓ | — | — | — |
| CSV import | ✓ | — | — | — |
| Moderate any content / restore content | ✓ | Own posts only | — | — |
| View dashboard/audit log | ✓ | Own limited dashboard (later) | — | — |

### Canonical visibility predicates

The repository layer builds these predicates; it does not accept client-supplied
scope values as an authority source.

- **Student:** `post.status = PUBLISHED AND post.deletedAt IS NULL AND
  post.gradeId = student.class.gradeId AND (post.classId IS NULL OR
  post.classId = student.classId)`.
- **Parent:** the same predicate joined through an existing `ParentStudent` link
  and the currently selected child. The selected child UUID is only a UI hint;
  the server requires it to be linked to the authenticated parent.
- **Teacher:** all published, non-deleted posts whose scope overlaps an active
  assignment for that teacher. A teacher's ability to *read* is limited to their
  assignments, even if they could guess another post ID.
- **Director:** all posts except that the ordinary feed excludes deleted drafts;
  the moderation view requests deleted items explicitly.
- **Student/parent event:** audience in `STUDENTS_AND_PARENTS, ALL`, and event
  grade is null or equals the viewer child/student grade. Teacher event audience
  is in `TEACHERS, ALL`, optionally filtered to a teacher assignment grade.

The test suite will include a negative IDOR case: a parent linked solely to a
second-grade child receives `404` for a fifth-grade post and never receives a
file URL for it.

## Explicit implementation assumptions

These safe defaults resolve product ambiguities without broadening access:

1. **Email is required and is the login identifier.** `username` is optional for
   a future local login experience, but both are normalized to lowercase. This
   minimizes matching ambiguity and supports password reset safely.
2. **Roles are immutable after account creation.** To prevent accidental scope
   escalation or broken family/class relationships, the Director creates a
   replacement account and deactivates the old account rather than changing its
   role in place.
3. **A teacher can make a grade-wide post only with a grade-wide assignment.** A
   teacher assigned just `3A` may create content only for `3A`, not for all third
   graders. A grade-wide assignment covers its classes.
4. **A post cannot target more than one class.** Teachers make one post per
   class; grade-wide posts are the safe way to address all sections. This keeps
   visibility checks simple and auditable.
5. **Events target an audience and optionally one grade, not a class.** This
   matches the requested event model. Class-specific notices are published as
   posts or separate grade-scoped events if approved later.
6. **Directors author school events.** Teachers may see teacher/all events but
   cannot publish them. Directors may publish exercises/exams/lesson notes in
   any valid scope.
7. **MFA uses TOTP and is mandatory for director/teacher accounts once the
   security feature is enabled.** Enrollment is completed before privileged
   access; secrets are encrypted at rest and never logged. Student/parent TOTP
   remains optional.
8. **Soft-delete is the normal removal path.** It always records a reason;
   restore is restricted to the director. A separate retention/export/deletion
   process will be documented before production rollout.
9. **Files remain private until authorized at download time.** Only virus-scanned
   `CLEAN` files can get a short-lived signed URL. The browser never sees S3/MinIO
   credentials or an object path that can be used as a public URL.

## API and error conventions

- Public endpoints live under `/api/v1`; internal actions use the same services.
- Mutations use precise Zod contracts and return a central RFC-7807-like error
  envelope without stack traces or account-existence clues.
- Pagination is cursor-based for feeds/audit logs. Filters are allowed only when
  they narrow an already-authorized scope.
- OpenAPI is generated from the versioned route contracts; it documents request
  and response shapes, never secrets or internal policy details.

## Phase plan

| Phase | Deliverable | State |
| --- | --- | --- |
| 1 | Architecture, schema/migration, source layout, RBAC contract | **Complete** |
| 2 | Auth, sessions, security foundations, shared RBAC enforcement | In progress — local demo adapter and shared policy foundation added |
| 3 | Director users/assignments/events/moderation/dashboard/audit | Pending |
| 4 | Teacher post lifecycle and private file uploads | Pending |
| 5 | Student/parent feeds, calendar, filters, notifications | Pending |
| 6 | Design system, i18n/RTL, accessibility polish | Pending |
| 7 | Tests, CI, containers, seed, deployment/security documentation | Pending |
