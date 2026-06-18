import { z } from 'zod';
export declare const CreateInvoiceSchema: z.ZodObject<{
    invoiceNumber: z.ZodString;
    payerName: z.ZodString;
    payerDaysToPay: z.ZodDefault<z.ZodNumber>;
    faceValueMinorUnits: z.ZodNumber;
    advanceRateBps: z.ZodNumber;
    feeRateBps: z.ZodNumber;
    currency: z.ZodDefault<z.ZodEnum<["USD", "BRL"]>>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    currency: "USD" | "BRL";
    invoiceNumber: string;
    payerName: string;
    payerDaysToPay: number;
    faceValueMinorUnits: number;
    advanceRateBps: number;
    feeRateBps: number;
    notes?: string | undefined;
}, {
    invoiceNumber: string;
    payerName: string;
    faceValueMinorUnits: number;
    advanceRateBps: number;
    feeRateBps: number;
    currency?: "USD" | "BRL" | undefined;
    payerDaysToPay?: number | undefined;
    notes?: string | undefined;
}>;
export type CreateInvoiceDto = z.infer<typeof CreateInvoiceSchema>;
