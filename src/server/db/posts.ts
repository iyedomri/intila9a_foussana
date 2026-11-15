import "server-only";

import type { UserRole } from "@/server/auth/types";
import type {
  DemoPost,
  DemoPostAudience,
  DemoPostFile,
  DemoPostType,
} from "@/server/posts/demo-post-store";

import { query, withTransaction } from "./pool";

interface DbPostRow {
  id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  type: string;
  audience: string;
  title: string;
  description: string;
  subject: string;
  grade: number;
  status: string;
  deleted_at: Date | null;
  delete_reason: string | null;
  created_at: Date;
  file_id: string | null;
  file_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  data_base64: string | null;
}

function mapRowToPost(row: DbPostRow): DemoPost {
  let file: DemoPostFile | undefined;
  if (row.file_id && row.file_name && row.mime_type && row.file_size !== null) {
    file = {
      id: row.file_id,
      fileName: row.file_name,
      mimeType: row.mime_type,
      size: row.file_size,
      dataBase64: row.data_base64 ?? "",
    };
  }

  return {
    id: row.id,
    authorId: row.author_id,
    authorName: row.author_name,
    authorRole: row.author_role as UserRole,
    subject: row.subject,
    grade: row.grade,
    title: row.title,
    description: row.description,
    type: row.type as DemoPostType,
    audience: row.audience as DemoPostAudience,
    file,
    deletedAt: row.deleted_at,
    deletedReason: row.delete_reason,
    createdAt: new Date(row.created_at),
  };
}

const SELECT_POSTS_SQL = `
  SELECT 
    p.id, p.author_id, p.author_name, p.author_role, p.type, p.audience,
    p.title, p.description, p.subject, p.grade, p.status,
    p.deleted_at, p.delete_reason, p.created_at,
    f.id as file_id, f.file_name, f.mime_type, f.size as file_size, f.data_base64
  FROM posts p
  LEFT JOIN post_files f ON f.post_id = p.id
`;

export async function dbCreatePost(
  post: Omit<DemoPost, "id" | "createdAt">,
): Promise<DemoPost> {
  return withTransaction(async (client) => {
    const postResult = await client.query<{ id: string; created_at: Date }>(
      `
      INSERT INTO posts (
        author_id, author_name, author_role, type, audience,
        title, description, subject, grade, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PUBLISHED')
      RETURNING id, created_at;
      `,
      [
        post.authorId,
        post.authorName,
        post.authorRole,
        post.type,
        post.audience ?? "ALL",
        post.title,
        post.description,
        post.subject,
        post.grade,
      ],
    );

    const inserted = postResult.rows[0];
    if (!inserted) {
      throw new Error("Failed to insert post");
    }

    let createdFile: DemoPostFile | undefined;
    if (post.file) {
      const fileResult = await client.query<{ id: string }>(
        `
        INSERT INTO post_files (post_id, file_name, mime_type, size, data_base64)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id;
        `,
        [
          inserted.id,
          post.file.fileName,
          post.file.mimeType,
          post.file.size,
          post.file.dataBase64,
        ],
      );

      const fileId = fileResult.rows[0]?.id;
      if (fileId) {
        createdFile = {
          id: fileId,
          fileName: post.file.fileName,
          mimeType: post.file.mimeType,
          size: post.file.size,
          dataBase64: post.file.dataBase64,
        };
      }
    }

    return {
      ...post,
      id: inserted.id,
      file: createdFile,
      createdAt: new Date(inserted.created_at),
    };
  });
}

export async function dbListPostsByGrade(
  grade: number,
  audience?: DemoPostAudience | "Élève" | "Parent",
): Promise<readonly DemoPost[]> {
  const isStudent = audience === "Élève" || audience === "STUDENTS";
  const isParent = audience === "Parent" || audience === "PARENTS";

  let sql = `
    ${SELECT_POSTS_SQL}
    WHERE p.deleted_at IS NULL
    AND (p.grade = 0 OR p.grade = $1)
  `;
  const params: unknown[] = [grade];

  if (isStudent) {
    sql += " AND p.audience NOT IN ('PARENTS', 'TEACHERS')";
  } else if (isParent) {
    sql += " AND p.audience NOT IN ('STUDENTS', 'TEACHERS')";
  }

  sql += " ORDER BY p.created_at DESC;";

  const result = await query<DbPostRow>(sql, params);
  return result.rows.map(mapRowToPost);
}

export async function dbListTeacherPosts(): Promise<readonly DemoPost[]> {
  const sql = `
    ${SELECT_POSTS_SQL}
    WHERE p.deleted_at IS NULL
    AND (
      p.audience = 'TEACHERS'
      OR (p.author_role = 'DIRECTOR' AND (p.audience = 'ALL' OR p.type = 'ANNOUNCEMENT'))
    )
    ORDER BY p.created_at DESC;
  `;

  const result = await query<DbPostRow>(sql);
  return result.rows.map(mapRowToPost);
}

export async function dbListAllPosts(includeDeleted = false): Promise<readonly DemoPost[]> {
  let sql = SELECT_POSTS_SQL;
  if (!includeDeleted) {
    sql += " WHERE p.deleted_at IS NULL";
  }
  sql += " ORDER BY p.created_at DESC;";

  const result = await query<DbPostRow>(sql);
  return result.rows.map(mapRowToPost);
}

export async function dbDeletePost(
  id: string,
  reason?: string,
  deletedById?: string,
): Promise<boolean> {
  const result = await query(
    `
    UPDATE posts
    SET deleted_at = CURRENT_TIMESTAMP,
        delete_reason = $1,
        deleted_by_id = $2
    WHERE id = $3 AND deleted_at IS NULL;
    `,
    [reason || "Supprimé par la Direction", deletedById ?? null, id],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function dbGetPostById(id: string): Promise<DemoPost | undefined> {
  const sql = `
    ${SELECT_POSTS_SQL}
    WHERE p.id = $1
    LIMIT 1;
  `;

  const result = await query<DbPostRow>(sql, [id]);
  const row = result.rows[0];
  return row ? mapRowToPost(row) : undefined;
}
