// db.ts — KODI360's offline-first local store (IndexedDB via Dexie). Receipts
// and disputes are queued here first and synced when connectivity returns —
// both require a signed-in trader (see migration 0008). Registration is no
// longer queued here: it's the trader sign-up flow (Rasimisha), which
// inherently requires connectivity for the account-creation call itself.

import Dexie, { type EntityTable } from 'dexie';

export interface ReceiptRecord {
  id?: number;
  receiptNo: string;
  item: string;
  amount: number;
  buyerName?: string;
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
  synced: boolean;
  /** Supporting evidence file, queued offline; uploaded to Storage on sync. */
  evidenceBlob?: Blob;
  evidenceFileName?: string;
  /** Set once the evidence file has been uploaded (Storage object path). */
  evidencePath?: string;
}

class Kodi360DB extends Dexie {
  receipts!: EntityTable<ReceiptRecord, 'id'>;
  disputes!: EntityTable<DisputeRecord, 'id'>;

  constructor() {
    super('kodi360');
    this.version(1).stores({
      registrations: '++id, phone, synced, createdAt',
      receipts: '++id, receiptNo, createdAt, synced',
      disputes: '++id, reference, decisionDate, createdAt',
    });
    this.version(2).stores({
      registrations: '++id, phone, synced, createdAt',
      receipts: '++id, receiptNo, createdAt, synced',
      disputes: '++id, reference, decisionDate, createdAt, synced',
    }).upgrade((tx) => tx.table('disputes').toCollection().modify((d) => { d.synced = false; }));
    // v3: registrations moved to the trader sign-up flow (immediate online
    // insert, no local queue) — drop the now-unused local table.
    this.version(3).stores({
      registrations: null,
      receipts: '++id, receiptNo, createdAt, synced',
      disputes: '++id, reference, decisionDate, createdAt, synced',
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
