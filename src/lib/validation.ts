// validation.ts — Zod schemas for KODI360's three citizen-facing forms.
// Field-level error maps so each input can show its own message.

import { z } from 'zod';
import { isValidNida, isValidTin } from './traderIdentity';

export const registrationSchema = z.object({
  name: z.string().trim().min(2, { message: 'Jina fupi mno' }).max(120),
  phone: z
    .string()
    .trim()
    .regex(/^0\d{9}$/, { message: 'Namba ya simu isiyo sahihi (mfano 0712345678)' }),
  location: z.string().trim().max(200).optional().default(''),
  activity: z.string().trim().min(1, { message: 'Chagua aina ya biashara' }),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export const traderSignUpSchema = z
  .object({
    idType: z.enum(['nida', 'tin']),
    idNumber: z.string().trim().min(1, { message: 'Andika namba ya NIDA au TIN' }),
    password: z.string().min(8, { message: 'Nenosiri liwe angalau herufi/tarakimu 8' }),
    confirmPassword: z.string(),
    name: z.string().trim().min(2, { message: 'Jina fupi mno' }).max(120),
    phone: z
      .string()
      .trim()
      .regex(/^0\d{9}$/, { message: 'Namba ya simu isiyo sahihi (mfano 0712345678)' }),
    location: z.string().trim().max(200).optional().default(''),
    activity: z.string().trim().min(1, { message: 'Chagua aina ya biashara' }),
  })
  .refine((v) => v.password === v.confirmPassword, { message: 'Manenosiri hayafanani', path: ['confirmPassword'] })
  .refine((v) => (v.idType === 'nida' ? isValidNida(v.idNumber) : isValidTin(v.idNumber)), {
    message: 'Namba si sahihi kwa aina uliyochagua (NIDA: tarakimu 20; TIN: tarakimu 9–10)',
    path: ['idNumber'],
  });

export type TraderSignUpInput = z.infer<typeof traderSignUpSchema>;

export const traderLoginSchema = z.object({
  idType: z.enum(['nida', 'tin']),
  idNumber: z.string().trim().min(1, { message: 'Andika namba ya NIDA au TIN' }),
  password: z.string().min(1, { message: 'Andika nenosiri' }),
});

export type TraderLoginInput = z.infer<typeof traderLoginSchema>;

export const receiptSchema = z.object({
  item: z.string().trim().min(1, { message: 'Andika bidhaa/huduma' }).max(200),
  amount: z.coerce.number().positive({ message: 'Kiasi lazima kiwe zaidi ya sifuri' }).max(1_000_000_000),
  buyerName: z.string().trim().max(200).optional().or(z.literal('')),
  buyerPhone: z
    .string()
    .trim()
    .regex(/^0\d{9}$/, { message: 'Namba ya simu isiyo sahihi' })
    .optional()
    .or(z.literal('')),
});

export type ReceiptInput = z.infer<typeof receiptSchema>;

export const disputeSchema = z.object({
  decisionDate: z.coerce.date({ message: 'Chagua tarehe sahihi' }),
  assessedAmount: z.coerce.number().nonnegative({ message: 'Kiasi hakiwezi kuwa hasi' }),
  undisputedAmount: z.coerce.number().nonnegative({ message: 'Kiasi hakiwezi kuwa hasi' }).default(0),
});

export type DisputeInput = z.infer<typeof disputeSchema>;

/** Flatten a ZodError into a { field: message } map for form display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_root';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
