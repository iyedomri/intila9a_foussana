# Intila9a Foussana local demo

This folder is the entry point for the local visual demo. The runnable Next.js
application remains in the repository root so its Git branch, build scripts,
Prisma schema, and deployment configuration stay intact.

## Start the demo

From this folder:

```bash
./start-demo.sh
```

Or from the repository root:

```bash
npm run dev
```

Then open `http://localhost:3000` (or use the Arena Live Preview).

## What to test

1. Select Student or Parent, choose a grade from 1st to 6th, and review the
   read-only example posts/download.
2. Select Teacher, enter the local teacher access code, then create a post with
   a name, subject, grade, exercise/exam/lesson type, title, and description.
3. Visit that grade in the read-only Student or Parent view to see the local
   preview post.

Posts in this visual demo are kept in memory and reset whenever the development
server restarts.
