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

export interface IPAPILocation {
  country: string; // eg: United States
  countryCode: string; // eg: US
  region: string; // eg: CA
  regionName: string; // eg: California
  city: string; // eg: San Francisco
  zip: string; // eg: 94188
  lat: number; // eg: 37.7749
  lon: number; // eg: -122.419
}
