-- Intila9a Foussana — Initialisation PostgreSQL Réelle
-- Directeur : M. Fethi Omri

-- 1. Niveaux scolaires (Grades 1 à 6)
INSERT INTO grades (id, level, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 1, NOW(), NOW()),
  (gen_random_uuid(), 2, NOW(), NOW()),
  (gen_random_uuid(), 3, NOW(), NOW()),
  (gen_random_uuid(), 4, NOW(), NOW()),
  (gen_random_uuid(), 5, NOW(), NOW()),
  (gen_random_uuid(), 6, NOW(), NOW())
ON CONFLICT (level) DO NOTHING;

-- 2. Compte de la Direction (M. Fethi Omri)
-- Hachage Argon2id sécurisé
INSERT INTO users (
  id, role, first_name, last_name, email, password_hash, is_active, must_change_password, created_at, updated_at
)
VALUES (
  gen_random_uuid(),
  'DIRECTOR',
  'Fethi',
  'Omri',
  'directeur@ecole-foussana.tn',
  '$argon2id$v=19$m=65536,t=3,p=4$bVGN2G3OQ1bKS2uon/Vp+g$ZEin6Rle+CowJ5++iQgA65DM4J8av+l2GfgOx8YZvws',
  true,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- 3. Compte Enseignant (Mot de passe intila9a2026 haché Argon2id)
INSERT INTO users (
  id, role, first_name, last_name, email, password_hash, is_active, must_change_password, created_at, updated_at
)
VALUES (
  gen_random_uuid(),
  'TEACHER',
  'Nour',
  'Trabelsi',
  'enseignant@ecole-foussana.tn',
  '$argon2id$v=19$m=65536,t=3,p=4$KI5Co9FDbUdezgKlxMvzuA$U72telUA6Lh+/QRqqiDesvMF+NkhP+d0G3aU9D4NYwU',
  true,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;
