"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApproveInvoiceSchema = void 0;
const zod_1 = require("zod");
exports.ApproveInvoiceSchema = zod_1.z.object({
    notes: zod_1.z.string().optional(),
});
//# sourceMappingURL=approve-invoice.dto.js.map