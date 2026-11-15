import "server-only";

import * as argon2 from "argon2";
import type { Pool } from "pg";

import { getDatabasePool } from "./pool";

export async function seedDatabase(poolInstance?: Pool): Promise<void> {
  const pool = poolInstance ?? getDatabasePool();

  // 1. Password hashes
  const directorHash = await argon2.hash("fethi2026", {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  const teacherHash = await argon2.hash("intila9a2027", {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  // 2. Insert or ignore users
  const directorResult = await pool.query<{ id: string }>(
    `
    INSERT INTO users (role, first_name, last_name, email, password_hash, is_active)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (email) DO UPDATE SET 
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      password_hash = EXCLUDED.password_hash
    RETURNING id;
    `,
    ["DIRECTOR", "Fethi", "Omri", "director@demo.intila9a.local", directorHash, true],
  );
  const directorId = directorResult.rows[0]?.id;

  await pool.query(
    `
    INSERT INTO users (role, first_name, last_name, email, password_hash, is_active)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (email) DO NOTHING;
    `,
    ["TEACHER", "Enseignant", "Intila9a", "teacher@demo.intila9a.local", teacherHash, true],
  );

  // 3. Insert Grades 1 through 6
  for (let level = 1; level <= 6; level++) {
    await pool.query(
      `
      INSERT INTO grades (level)
      VALUES ($1)
      ON CONFLICT (level) DO NOTHING;
      `,
      [level],
    );
  }

  // 4. Insert Default Subjects
  const defaultSubjects = [
    "Mathématiques",
    "Français",
    "Arabe",
    "Éveil scientifique",
    "Éducation civique",
    "Activités artistiques",
    "Direction & Vie scolaire",
  ];

  for (const subject of defaultSubjects) {
    await pool.query(
      `
      INSERT INTO subjects (name)
      VALUES ($1)
      ON CONFLICT (name) DO NOTHING;
      `,
      [subject],
    );
  }

  // 5. Seed initial Director meeting convocation for teachers
  if (directorId) {
    const postCountResult = await pool.query<{ count: string }>(
      "SELECT count(*) as count FROM posts WHERE author_id = $1;",
      [directorId],
    );
    const postCount = Number(postCountResult.rows[0]?.count ?? "0");

    if (postCount === 0) {
      await pool.query(
        `
        INSERT INTO posts (
          author_id, author_name, author_role, type, audience,
          title, description, subject, grade, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
        `,
        [
          directorId,
          "Fethi Omri (Direction)",
          "DIRECTOR",
          "ANNOUNCEMENT",
          "TEACHERS",
          "Convocation : Conseil pédagogique et organisation du 1er trimestre",
          "Chers collègues enseignants,\n\nVous êtes priés d'assister à la réunion pédagogique trimestrielle ce jeudi à 14h00 en salle des professeurs.\n\nOrdre du jour :\n1. Calendrier des devoirs de contrôle et de synthèse du 1er trimestre.\n2. Suivi des projets pédagogiques et soutien scolaire.\n3. Organisation des activités parascolaires et vie de l'établissement.\n\nLa présence de l'ensemble du corps enseignant est indispensable. Merci pour votre engagement continu.",
          "Direction & Vie pédagogique",
          0,
          "PUBLISHED",
        ],
      );
    }
  }
}
