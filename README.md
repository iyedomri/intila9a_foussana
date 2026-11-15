# Intila9a Foussana

A private, security-first portal for an elementary school serving **grades 1 to
6 only**. Teachers publish class-scoped learning materials; students and linked
parents can safely view them; the Director manages accounts, events, content,
and audit activity.

> **Project status:** Phase 1 — architecture, data model, and authorization
> baseline is complete. Product features are delivered in the subsequent phases
> listed below; this repository is not yet a runnable portal.

## Technology decisions

- **Application:** Next.js App Router + strict TypeScript, Route Handlers, and
  Server Actions sharing one service/authorization layer.
- **UI:** Tailwind CSS and shadcn/ui, planned with a mobile-first, accessible
  design system and French default / Arabic RTL / English translations.
- **Data:** PostgreSQL + Prisma, with an explicit initial migration.
- **Security baseline:** server-enforced RBAC and object scope, private
  S3-compatible storage, short-lived signed downloads, Argon2id passwords,
  secure rotating sessions, TOTP for privileged roles, CSRF, rate limiting and
  audit trails (implemented in the security phase).
- **Quality/operations:** Vitest, Playwright, Docker Compose, GitHub Actions and
  OpenAPI contracts are introduced in the implementation phases.

The full architecture, planned source tree, role matrix, database invariants,
visibility predicates, and safe product assumptions are in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Schema and migration

- Prisma schema: [`prisma/schema.prisma`](prisma/schema.prisma)
- Initial PostgreSQL migration:
  [`prisma/migrations/20261115000000_initial_school_portal/migration.sql`](prisma/migrations/20261115000000_initial_school_portal/migration.sql)

The migration includes UUID primary keys, foreign keys, constraints, partial
indexes, and narrowly scoped triggers that protect key cross-record invariants.
The service layer will still authorize every request; database constraints are
an additional safety net, not an authorization substitute.

## Delivery phases

1. **Complete** — architecture, folder layout, Prisma model/migration, role and
   permission matrix.
2. Authentication, session security, password reset/forced change, TOTP and
   RBAC middleware.
3. Director account, assignment, event, moderation, dashboard, import and audit
   features.
4. Teacher post/editor and secure file upload/download features.
5. Student and parent scoped feeds, filters, calendar and notifications.
6. Responsive design polish, i18n/RTL, dark mode and accessibility.
7. Tests, sample seed data, CI, Docker, deployment documents and security
   review.

## Safe defaults recorded for this project

- An account uses a normalized lowercase email as its required login identifier;
  a username is optional.
- Grades are constrained at database level to 1–6. A class belongs to one grade.
- Roles are immutable once an account is created; role correction uses a new,
  correctly scoped account and deactivates the former account.
- A teacher assigned only to `3A` cannot publish to all third graders; a
  grade-wide assignment is required for grade-wide content.
- A parent must have a live parent-child link for every selected child; guessed
  content or file URLs outside that child’s class/grade scope return no data.
- Directors, not teachers, publish school events. Events may target all grades
  or one grade, but not a class.
- Removal is a reversible soft delete that always records its reason and actor.
- File objects are never public; only authorized, scanned files can receive a
  short-lived download URL.

## Planned local development (after Phase 2)

The runnable setup, full environment variable reference, Docker Compose commands,
seed credentials, and deployment steps will be added with the executable
foundation. The intended stack is Node.js 22+, PostgreSQL 16+, and MinIO (or an
S3-compatible provider).

Until then, schema syntax can be checked after dependencies are installed:

```bash
npm install
npm run prisma:validate
```

Do not add real credentials to the repository. `.env` files, local database
volumes, object-store data, and generated framework output are ignored.
