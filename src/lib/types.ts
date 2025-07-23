// Match the ControlConfig type from ShaderPlayground
export interface ControlConfig {
  value: number | number[] | string | string[];
  min?: number;
  max?: number;
  step?: number;
  options?: unknown;
  label?: string;
}

export interface Shader {
  id: string;
  created_at: Date;
  creator_id: string;
  lineage_id: string;
  parent_id: string | null;
  html: string | null;
  json: Record<string, Record<string, ControlConfig>> | null;
  metadata?: Record<string, unknown> | null;
}
