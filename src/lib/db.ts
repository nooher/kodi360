// db.ts — KODI360's offline-first local store (IndexedDB via Dexie). Every
// module writes here first and syncs later when connectivity returns, so
// registration, receipts, and disputes all work with zero network.

import Dexie, { type EntityTable } from 'dexie';

export interface Registration {
  id?: number;
  name: string;
  phone: string;
  location: string;
  activity: string;
  createdAt: number;
  synced: boolean;
}

export interface ReceiptRecord {
  id?: number;
  receiptNo: string;
  item: string;
  amount: number;
  buyerPhone?: string;
  createdAt: number;
  synced: boolean;
}

export interface DisputeRecord {
  id?: number;
  reference: string;
  assessedAmount: number;
  undisputedAmount: number;
  decisionDate: number;
  status: 'draft' | 'filed';
  createdAt: number;
}

class Kodi360DB extends Dexie {
  registrations!: EntityTable<Registration, 'id'>;
  receipts!: EntityTable<ReceiptRecord, 'id'>;
  disputes!: EntityTable<DisputeRecord, 'id'>;

  constructor() {
    super('kodi360');
    this.version(1).stores({
      registrations: '++id, phone, synced, createdAt',
      receipts: '++id, receiptNo, createdAt, synced',
      disputes: '++id, reference, decisionDate, createdAt',
    });
  }
}

export const db = new Kodi360DB();

export function genReceiptNo(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `KODI-${n}`;
}

export function genReference(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `UTZ-${new Date().getFullYear()}-${n}`;
}
