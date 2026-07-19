// validation.ts — Zod schemas for KODI360's three citizen-facing forms.
// Field-level error maps so each input can show its own message.

import { z } from 'zod';

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

export const receiptSchema = z.object({
  item: z.string().trim().min(1, { message: 'Andika bidhaa/huduma' }).max(200),
  amount: z.coerce.number().positive({ message: 'Kiasi lazima kiwe zaidi ya sifuri' }).max(1_000_000_000),
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
