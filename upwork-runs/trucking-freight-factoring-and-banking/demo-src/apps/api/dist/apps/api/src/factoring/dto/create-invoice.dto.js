"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateInvoiceSchema = void 0;
const zod_1 = require("zod");
exports.CreateInvoiceSchema = zod_1.z.object({
    invoiceNumber: zod_1.z.string().min(1),
    payerName: zod_1.z.string().min(1),
    payerDaysToPay: zod_1.z.number().int().positive().max(365).default(30),
    faceValueMinorUnits: zod_1.z.number().int().positive(),
    advanceRateBps: zod_1.z.number().int().min(5000).max(9500),
    feeRateBps: zod_1.z.number().int().min(50).max(1000),
    currency: zod_1.z.enum(['USD', 'BRL']).default('USD'),
    notes: zod_1.z.string().optional(),
});
//# sourceMappingURL=create-invoice.dto.js.map