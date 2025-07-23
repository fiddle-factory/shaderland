import postgres from "postgres";
import { nanoid } from "./nanoid";

const sql = postgres(process.env.PG_DB_STRING!);

/*
Schema for reference:

CREATE TABLE public.shaders (
  id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  creator_id text NOT NULL,
  lineage_id text NOT NULL,
  parent_id text,
  html text,
  json jsonb,
  metadata jsonb,
  CONSTRAINT shaders_pkey PRIMARY KEY (id)
);
*/

export interface Shader {
  id: string;
  created_at: Date;
  creator_id: string;
  lineage_id: string;
  parent_id: string | null;
  html: string | null;
  json: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

export interface InsertShaderParams {
  creator_id: string;
  lineage_id?: string;
  parent_id?: string;
  html: string;
  json: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export async function insertShader(
  params: InsertShaderParams
): Promise<string> {
  const id = nanoid();
  const lineage_id = params.lineage_id || id;
  const metadata = params.metadata || {};

  await sql`
    INSERT INTO public.shaders (
      id,
      creator_id,
      lineage_id,
      parent_id,
      html,
      json,
      metadata
    ) VALUES (
      ${id},
      ${params.creator_id},
      ${lineage_id},
      ${params.parent_id || null},
      ${params.html},
      ${JSON.stringify(params.json)},
      ${JSON.stringify(metadata)}
    )
  `;

  return id;
}

export interface RecentRowsParams {
  userId?: string;
  limit?: number;
}

export async function recentRows(
  params: RecentRowsParams = {}
): Promise<Shader[]> {
  const limit = params.limit || 5;

  let rows;
  if (params.userId) {
    rows = await sql`
      SELECT id, created_at, creator_id, lineage_id, parent_id, html, json, metadata
      FROM public.shaders
      WHERE creator_id = ${params.userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
  } else {
    rows = await sql`
      SELECT id, created_at, creator_id, lineage_id, parent_id, html, json, metadata
      FROM public.shaders
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
  }

  // Ensure JSON fields are properly parsed
  return rows.map((row) => ({
    ...row,
    json: typeof row.json === "string" ? JSON.parse(row.json) : row.json,
    metadata:
      typeof row.metadata === "string"
        ? JSON.parse(row.metadata)
        : row.metadata,
  })) as Shader[];
}

export async function getShaderById(id: string): Promise<Shader | null> {
  const shaders = await sql`
    SELECT id, created_at, creator_id, lineage_id, parent_id, html, json, metadata
    FROM public.shaders
    WHERE id = ${id}
  `;

  if (!shaders || shaders.length === 0) {
    return null;
  }

  const shader = shaders[0] as Shader;

  return {
    ...shader,
    json:
      typeof shader.json === "string" ? JSON.parse(shader.json) : shader.json,
    metadata:
      typeof shader.metadata === "string"
        ? JSON.parse(shader.metadata)
        : shader.metadata,
  } as Shader;
}
