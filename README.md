# Intila9a Foussana

A private, security-first portal for an elementary school serving **grades 1 to
6 only**. Teachers publish class-scoped learning materials; students and linked
parents can safely view them; the Director manages accounts, events, content,
and audit activity.

> **Project status:** Phase 2 foundations are in progress. The local preview
> provides a working, non-production authentication flow for all four roles; the
> persistent PostgreSQL features are delivered in the following phases.

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

## Local visual preview

A working local preview is available now. It is deliberately **not a production
release**: it uses an in-memory demo identity store so that the login, secure
cookie, logout, password-reset, CSRF, throttling, and role-specific dashboard
flows can be reviewed without a database or email provider. Restarting the dev
server resets all demo data. Production mode refuses to use this adapter.

```bash
npm install
npm run dev
# open http://localhost:3000
```

Choose any role card on the login screen to prefill a local-only demo account,
then select **Se connecter**. You can test logout and the password-reset flow as
well. No demo account exists outside local development.

The preview uses Node.js 22.12+ and binds to port `3000`. Its public production
replacement will use PostgreSQL 16+, Prisma, private object storage, a mail
provider, and Docker Compose in the later delivery phases.

## Validation commands

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
npm audit --audit-level=high
```

`npm run prisma:validate` is also provided. In the Arena sandbox it cannot finish
because Prisma fetches a schema-engine binary from `binaries.prisma.sh`, a host
outside the permitted outbound network; it will run in a normal Docker/CI setup.

Do not add real credentials to the repository. `.env` files, local database
volumes, object-store data, and generated framework output are ignored.
