# Guide de Déploiement Vercel — Intila9a Foussana

Ce guide détaille l’ensemble des étapes et des prérequis pour déployer le portail scolaire **Intila9a Foussana** sur la plateforme [Vercel](https://vercel.com).

---

## 1. Deux modes de déploiement possibles

| Fonctionnalité | Mode Démo / Aperçu Showcase | Mode Production Complète |
| :--- | :--- | :--- |
| **Objectif** | Présentation client, démo interactive en ligne | Exploitation réelle par l'établissement |
| **Base de données** | En mémoire (aucun serveur SQL requis) | PostgreSQL (Neon, Supabase, AWS RDS) |
| **Stockage PDF** | En mémoire (jusqu'à 15 Mo par publication) | Compatible S3 (AWS S3, MinIO, Cloudflare R2) |
| **Comptes de test** | Direction, Enseignants, Élèves, Parents inclus | Comptes réels hachés avec Argon2id en base |
| **Variable clé** | `ENABLE_DEMO_MODE=true` | `APP_MODE=production` + `DATABASE_URL` |

---

## 2. Configuration du projet sur Vercel

1. **Connecter le dépôt Git** :
   - Rendez-vous sur votre compte Vercel et cliquez sur **Add New… → Project**.
   - Sélectionnez le dépôt `intila9a_foussana`.
2. **Framework Preset** :
   - Vercel détecte automatiquement **Next.js**.
3. **Version de Node.js** :
   - Allez dans **Settings → General → Node.js Version**.
   - Choisissez **22.x** (compatible avec les spécifications du `package.json` : `node >= 22.12.0`).
4. **Paramètres de Build & Output** :
   - **Build Command** :
     - Pour le mode démo : `npm run build`
     - Pour le mode production avec Prisma : `npx prisma generate && next build`
   - **Output Directory** : `.next` (par défaut)
   - **Install Command** : `npm install` (par défaut)

---

## 3. Variables d'environnement requises

### Option A : Déploiement en Mode Démo (Recommandé pour test rapide sur Vercel)

Dans **Settings → Environment Variables** sur Vercel :

| Variable | Valeur recommandée | Description |
| :--- | :--- | :--- |
| `ENABLE_DEMO_MODE` | `true` | Active les comptes de démonstration et le store in-memory sur Vercel |
| `APP_MODE` | `demo` | Définit le mode d'exécution |
| `APP_URL` | `https://votre-projet.vercel.app` | URL publique de votre projet Vercel |

> **Identifiants de test préconfigurés :**
> - **Direction** : `director@demo.intila9a.local` / `Demo!Director2026`
> - **Enseignant** : `teacher@demo.intila9a.local` / `Demo!Teacher2026`
> - **Élève (3e année)** : `student@demo.intila9a.local` / `Demo!Student2026`
> - **Parent** : `parent@demo.intila9a.local` / `Demo!Parent2026`

---

### Option B : Déploiement en Mode Production (Base PostgreSQL)

Dans **Settings → Environment Variables** sur Vercel :

| Variable | Valeur recommandée | Description |
| :--- | :--- | :--- |
| `APP_MODE` | `production` | Active le mode strict de sécurité |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db?sslmode=require` | Chaîne de connexion PostgreSQL (Neon/Supabase) |
| `SESSION_PEPPER` | *(Secret aléatoire de 32+ caractères)* | Clé secrète pour le hachage des jetons de session |
| `APP_URL` | `https://votre-domaine.tn` | URL publique officielle de l'établissement |
| `PASSWORD_RESET_TTL_MINUTES` | `20` | Durée de validité des liens de réinitialisation |
| `S3_ENDPOINT` | `https://s3.eu-west-3.amazonaws.com` | Endpoint de stockage d'objets S3 |
| `S3_REGION` | `eu-west-3` | Région du bucket S3 |
| `S3_BUCKET` | `intila9a-foussana-documents` | Nom du compartiment de documents sécurisés |
| `S3_ACCESS_KEY` | *(Clé d'accès IAM)* | Clé d'API S3 |
| `S3_SECRET_KEY` | *(Secret d'accès IAM)* | Secret d'API S3 |

---

## 4. Points techniques audités & résolus

1. **Modules C++ natifs (`argon2`) sur Vercel Serverless** :
   - `argon2` utilise un binaire natif compilé (`.node`).
   - Le fichier `next.config.ts` inclut désormais `serverExternalPackages: ["argon2", "@prisma/client"]`.
   - Cela empêche le bundler Turbopack de casser le chargement du binaire sur AWS Lambda / Vercel Functions.
2. **Cookies de session sécurisés** :
   - En production Vercel (`HTTPS`), les cookies de session sont émis avec `secure: true`, `httpOnly: true` et `sameSite: "none"` (ou `"lax"` pour les domaines directs).
3. **En-têtes de sécurité (CSP & X-Frame-Options)** :
   - Définis dans `src/proxy.ts` (Next.js middleware).
   - En production, `X-Frame-Options: DENY` et `Strict-Transport-Security` sont appliqués automatiquement pour protéger l'école contre les attaques de clickjacking et de détournement.
4. **Vérification d'origine et protection CSRF** :
   - Toutes les mutations (`POST`, `DELETE`) valident le jeton `X-CSRF-Token` et l'en-tête `Origin` correspondant à l'URL de l'application.

---

## 5. Checklist avant mise en ligne

- [x] Vérification TypeScript : `npm run typecheck` (0 erreur).
- [x] Vérification Linter : `npm run lint` (0 avertissement / 0 erreur).
- [x] Tests unitaires automatisés : `npm test` (18 tests réussis).
- [x] Compilation Next.js Turbopack : `npm run build` (génération statique & dynamique validée).
- [x] Configuration des paquets externes serveur dans `next.config.ts`.
- [x] Fichier `vercel.json` créé à la racine.
