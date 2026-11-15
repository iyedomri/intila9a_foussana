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

1. **Student / Parent spaces** (`/student-space`, `/parent-space`):
   Choose a grade from 1st to 6th, and review the read-only example posts and download documents.
2. **Teacher space** (`/teacher-access`):
   Enter the local teacher access code (`Demo!Teacher2026` or click **Remplir**), then create a post with your name, subject, grade (1st–6th), type (exercise, exam, lesson), title, description, and **attach a lesson PDF document** (max 15 MB).
3. **Verify publication & PDF download**:
   Visit that grade in the read-only Student or Parent view to see your newly published post appear immediately in the feed with its attached PDF file badge, and click **Télécharger le PDF** to download your uploaded document.
4. **Director space** (`/director-access`):
   Enter the local director access code (`Demo!Director2026` or click **Remplir**) to access the administration dashboard (`/dashboard`).
   - **Publier une annonce / consigne** : Publiez pour toute l'école (`🏫 Toute l'école (Niveaux 1 à 6)`) ou pour une classe spécifique, en ciblant le public souhaité (`👥 Toute la communauté`, `🎒 Élèves uniquement`, ou `👨‍👩‍👧 Parents uniquement`), avec document PDF joint optionnel.
   - **Modération des publications** : Consultez en temps réel toutes les publications de l'école avec filtres avancés (niveau, public, type, recherche).
   - **Suppression / Retrait d'un contenu** : Cliquez sur **Supprimer** sur n'importe quel post, choisissez le motif de modération (information obsolète, erreur, etc.), et validez pour archiver le contenu immédiatement avec journal d'audit.
   - **Historique & Journal** : Activez l'option *Voir supprimées* pour inspecter les publications archivées et leurs motifs de retrait.
5. **Déploiement sur Vercel** :
   Consultez [`docs/DEPLOYMENT_VERCEL.md`](../docs/DEPLOYMENT_VERCEL.md) pour les instructions de mise en ligne sur Vercel en mode Démo (`ENABLE_DEMO_MODE=true`) ou en mode Production avec base PostgreSQL.

## Demo credentials

| Role | Access URL | Identifier / Account | Password / Code |
| :--- | :--- | :--- | :--- |
| **Teacher (Enseignant)** | `/teacher-access` | `teacher@demo.intila9a.local` | `Demo!Teacher2026` |
| **Director (Direction)** | `/director-access` | `director@demo.intila9a.local` | `Demo!Director2026` |
| **Student (Élève)** | `/student-space` (or `/login`) | `student@demo.intila9a.local` | `Demo!Student2026` |
| **Parent (Parent)** | `/parent-space` (or `/login`) | `parent@demo.intila9a.local` | `Demo!Parent2026` |

Posts in this visual demo are kept in memory and reset whenever the development
server restarts.
