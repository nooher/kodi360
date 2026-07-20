// types.ts — shared domain types for KODI360's officer- and trader-facing sides.

export interface OfficerProfile {
  id: string;
  email: string;
  name: string;
  role: 'officer' | 'admin';
  region?: string;
  created: string;
  updated: string;
}

export type TraderIdType = 'nida' | 'tin';

export interface TraderProfile {
  id: string;
  idType: TraderIdType;
  idNumber: string;
  name: string;
  phone: string;
  activity: string;
  created: string;
}
