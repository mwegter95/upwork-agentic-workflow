"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FactoringService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const db_module_1 = require("../db/db.module");
const schema_1 = require("../../../../packages/db/src/schema");
const create_invoice_dto_1 = require("./dto/create-invoice.dto");
function calcAdvance(faceValueMinorUnits, advanceRateBps) {
    return Math.floor((faceValueMinorUnits * advanceRateBps) / 10000);
}
function calcFee(faceValueMinorUnits, feeRateBps) {
    return Math.floor((faceValueMinorUnits * feeRateBps) / 10000);
}
function calcReserve(faceValueMinorUnits, advanceMinorUnits) {
    return faceValueMinorUnits - advanceMinorUnits;
}
let FactoringService = class FactoringService {
    constructor(db) {
        this.db = db;
    }
    async createInvoice(body, user) {
        const dto = create_invoice_dto_1.CreateInvoiceSchema.parse(body);
        const advanceMinorUnits = calcAdvance(dto.faceValueMinorUnits, dto.advanceRateBps);
        const feeMinorUnits = calcFee(dto.faceValueMinorUnits, dto.feeRateBps);
        const reserveMinorUnits = calcReserve(dto.faceValueMinorUnits, advanceMinorUnits);
        const [invoice] = await this.db
            .insert(schema_1.invoices)
            .values({
            invoiceNumber: dto.invoiceNumber,
            carrierId: user.sub,
            payerName: dto.payerName,
            payerDaysToPay: dto.payerDaysToPay,
            faceValueMinorUnits: dto.faceValueMinorUnits,
            advanceRateBps: dto.advanceRateBps,
            feeRateBps: dto.feeRateBps,
            advanceMinorUnits,
            feeMinorUnits,
            reserveMinorUnits,
            currency: dto.currency,
            notes: dto.notes,
            status: 'pending',
        })
            .returning();
        return invoice;
    }
    async listInvoices(user) {
        if (user.role === 'carrier') {
            return this.db
                .select()
                .from(schema_1.invoices)
                .where((0, drizzle_orm_1.eq)(schema_1.invoices.carrierId, user.sub))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.invoices.submittedAt));
        }
        return this.db
            .select()
            .from(schema_1.invoices)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.invoices.submittedAt));
    }
    async getInvoice(id, user) {
        const [inv] = await this.db
            .select()
            .from(schema_1.invoices)
            .where((0, drizzle_orm_1.eq)(schema_1.invoices.id, id))
            .limit(1);
        if (!inv)
            throw new common_1.NotFoundException(`Invoice ${id} not found`);
        if (user.role === 'carrier' && inv.carrierId !== user.sub) {
            throw new common_1.ForbiddenException('Not your invoice');
        }
        return inv;
    }
    async approveInvoice(id, user, notes) {
        if (!['underwriter', 'admin'].includes(user.role)) {
            throw new common_1.ForbiddenException('Insufficient role');
        }
        const [inv] = await this.db
            .select()
            .from(schema_1.invoices)
            .where((0, drizzle_orm_1.eq)(schema_1.invoices.id, id))
            .limit(1);
        if (!inv)
            throw new common_1.NotFoundException(`Invoice ${id} not found`);
        if (inv.status !== 'pending') {
            throw new common_1.BadRequestException(`Invoice is in '${inv.status}' status, cannot approve`);
        }
        const [updated] = await this.db
            .update(schema_1.invoices)
            .set({
            status: 'approved',
            underwriterId: user.sub,
            approvedAt: new Date(),
            notes: notes ?? inv.notes,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.invoices.id, id))
            .returning();
        return updated;
    }
    async rejectInvoice(id, user, notes) {
        if (!['underwriter', 'admin'].includes(user.role)) {
            throw new common_1.ForbiddenException('Insufficient role');
        }
        const [inv] = await this.db
            .select()
            .from(schema_1.invoices)
            .where((0, drizzle_orm_1.eq)(schema_1.invoices.id, id))
            .limit(1);
        if (!inv)
            throw new common_1.NotFoundException(`Invoice ${id} not found`);
        if (inv.status !== 'pending') {
            throw new common_1.BadRequestException(`Invoice is in '${inv.status}' status, cannot reject`);
        }
        const [updated] = await this.db
            .update(schema_1.invoices)
            .set({
            status: 'rejected',
            underwriterId: user.sub,
            notes: notes ?? inv.notes,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.invoices.id, id))
            .returning();
        return updated;
    }
    async disburseInvoice(id, user) {
        if (!['underwriter', 'admin'].includes(user.role)) {
            throw new common_1.ForbiddenException('Insufficient role');
        }
        const [inv] = await this.db
            .select()
            .from(schema_1.invoices)
            .where((0, drizzle_orm_1.eq)(schema_1.invoices.id, id))
            .limit(1);
        if (!inv)
            throw new common_1.NotFoundException(`Invoice ${id} not found`);
        if (inv.status !== 'approved') {
            throw new common_1.BadRequestException(`Invoice must be 'approved' to disburse`);
        }
        const advanceAmt = inv.advanceMinorUnits;
        const [recAcct] = await this.db
            .select()
            .from(schema_1.accounts)
            .where((0, drizzle_orm_1.eq)(schema_1.accounts.code, 'FACTORING_REC'))
            .limit(1);
        const [cashAcct] = await this.db
            .select()
            .from(schema_1.accounts)
            .where((0, drizzle_orm_1.eq)(schema_1.accounts.code, 'CASH_BANK'))
            .limit(1);
        if (!recAcct || !cashAcct)
            throw new common_1.BadRequestException('Ledger accounts not seeded');
        await this.db.insert(schema_1.ledgerEntries).values([
            {
                invoiceId: id,
                accountId: recAcct.id,
                entryType: 'debit',
                amountMinorUnits: advanceAmt,
                currency: inv.currency,
                description: `Advance disbursed for ${inv.invoiceNumber}`,
            },
            {
                invoiceId: id,
                accountId: cashAcct.id,
                entryType: 'credit',
                amountMinorUnits: advanceAmt,
                currency: inv.currency,
                description: `Cash out — advance for ${inv.invoiceNumber}`,
            },
        ]);
        await this.db
            .update(schema_1.accounts)
            .set({
            balanceMinorUnits: recAcct.balanceMinorUnits + advanceAmt,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.accounts.id, recAcct.id));
        await this.db
            .update(schema_1.accounts)
            .set({
            balanceMinorUnits: cashAcct.balanceMinorUnits - advanceAmt,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.accounts.id, cashAcct.id));
        const [updated] = await this.db
            .update(schema_1.invoices)
            .set({ status: 'disbursed', disbursedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.invoices.id, id))
            .returning();
        return updated;
    }
    async collectInvoice(id, user) {
        if (user.role !== 'admin') {
            throw new common_1.ForbiddenException('Only admins can mark collected');
        }
        const [inv] = await this.db
            .select()
            .from(schema_1.invoices)
            .where((0, drizzle_orm_1.eq)(schema_1.invoices.id, id))
            .limit(1);
        if (!inv)
            throw new common_1.NotFoundException(`Invoice ${id} not found`);
        if (inv.status !== 'disbursed') {
            throw new common_1.BadRequestException(`Invoice must be 'disbursed' to collect`);
        }
        const faceAmt = inv.faceValueMinorUnits;
        const advanceAmt = inv.advanceMinorUnits;
        const feeAmt = inv.feeMinorUnits;
        const reserveAmt = inv.reserveMinorUnits;
        const [recAcct] = await this.db.select().from(schema_1.accounts).where((0, drizzle_orm_1.eq)(schema_1.accounts.code, 'FACTORING_REC')).limit(1);
        const [cashAcct] = await this.db.select().from(schema_1.accounts).where((0, drizzle_orm_1.eq)(schema_1.accounts.code, 'CASH_BANK')).limit(1);
        const [feeAcct] = await this.db.select().from(schema_1.accounts).where((0, drizzle_orm_1.eq)(schema_1.accounts.code, 'FEE_REVENUE')).limit(1);
        const [reserveAcct] = await this.db.select().from(schema_1.accounts).where((0, drizzle_orm_1.eq)(schema_1.accounts.code, 'CARRIER_RESERVE')).limit(1);
        if (!recAcct || !cashAcct || !feeAcct || !reserveAcct) {
            throw new common_1.BadRequestException('Ledger accounts not seeded');
        }
        await this.db.insert(schema_1.ledgerEntries).values([
            {
                invoiceId: id,
                accountId: cashAcct.id,
                entryType: 'debit',
                amountMinorUnits: faceAmt,
                currency: inv.currency,
                description: `Collection received for ${inv.invoiceNumber}`,
            },
            {
                invoiceId: id,
                accountId: recAcct.id,
                entryType: 'credit',
                amountMinorUnits: advanceAmt,
                currency: inv.currency,
                description: `Close receivable — ${inv.invoiceNumber}`,
            },
            {
                invoiceId: id,
                accountId: feeAcct.id,
                entryType: 'credit',
                amountMinorUnits: feeAmt,
                currency: inv.currency,
                description: `Factoring fee earned — ${inv.invoiceNumber}`,
            },
            {
                invoiceId: id,
                accountId: reserveAcct.id,
                entryType: 'credit',
                amountMinorUnits: reserveAmt - feeAmt,
                currency: inv.currency,
                description: `Reserve released to carrier — ${inv.invoiceNumber}`,
            },
        ]);
        await this.db.update(schema_1.accounts).set({
            balanceMinorUnits: cashAcct.balanceMinorUnits + faceAmt,
            updatedAt: new Date(),
        }).where((0, drizzle_orm_1.eq)(schema_1.accounts.id, cashAcct.id));
        await this.db.update(schema_1.accounts).set({
            balanceMinorUnits: recAcct.balanceMinorUnits - advanceAmt,
            updatedAt: new Date(),
        }).where((0, drizzle_orm_1.eq)(schema_1.accounts.id, recAcct.id));
        await this.db.update(schema_1.accounts).set({
            balanceMinorUnits: feeAcct.balanceMinorUnits + feeAmt,
            updatedAt: new Date(),
        }).where((0, drizzle_orm_1.eq)(schema_1.accounts.id, feeAcct.id));
        const [updated] = await this.db
            .update(schema_1.invoices)
            .set({ status: 'collected', collectedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.invoices.id, id))
            .returning();
        return updated;
    }
};
exports.FactoringService = FactoringService;
exports.FactoringService = FactoringService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(db_module_1.DB_TOKEN)),
    __metadata("design:paramtypes", [Object])
], FactoringService);
//# sourceMappingURL=factoring.service.js.map