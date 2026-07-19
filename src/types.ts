// types.ts — shared domain types for KODI360's officer-facing side.

export interface OfficerProfile {
  id: string;
  email: string;
  name: string;
  role: 'officer' | 'admin';
  region?: string;
  created: string;
  updated: string;
}
