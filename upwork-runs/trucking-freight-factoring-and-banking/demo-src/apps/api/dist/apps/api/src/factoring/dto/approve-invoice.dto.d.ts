import { z } from 'zod';
export declare const ApproveInvoiceSchema: z.ZodObject<{
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    notes?: string | undefined;
}, {
    notes?: string | undefined;
}>;
export type ApproveInvoiceDto = z.infer<typeof ApproveInvoiceSchema>;
