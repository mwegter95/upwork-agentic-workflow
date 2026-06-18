"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ledgerEntries = exports.invoices = exports.accounts = exports.users = exports.accountTypeEnum = exports.entryTypeEnum = exports.invoiceStatusEnum = exports.currencyEnum = exports.roleEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.roleEnum = (0, pg_core_1.pgEnum)('role', ['admin', 'underwriter', 'carrier', 'driver']);
exports.currencyEnum = (0, pg_core_1.pgEnum)('currency', ['USD', 'BRL']);
exports.invoiceStatusEnum = (0, pg_core_1.pgEnum)('invoice_status', [
    'pending',
    'approved',
    'rejected',
    'disbursed',
    'collected',
]);
exports.entryTypeEnum = (0, pg_core_1.pgEnum)('entry_type', ['debit', 'credit']);
exports.accountTypeEnum = (0, pg_core_1.pgEnum)('account_type', [
    'asset',
    'liability',
    'revenue',
    'expense',
]);
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    email: (0, pg_core_1.text)('email').notNull().unique(),
    passwordHash: (0, pg_core_1.text)('password_hash').notNull(),
    name: (0, pg_core_1.text)('name').notNull(),
    role: (0, exports.roleEnum)('role').notNull().default('carrier'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.accounts = (0, pg_core_1.pgTable)('accounts', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.text)('name').notNull(),
    code: (0, pg_core_1.text)('code').notNull().unique(),
    type: (0, exports.accountTypeEnum)('type').notNull(),
    currency: (0, exports.currencyEnum)('currency').notNull().default('USD'),
    balanceMinorUnits: (0, pg_core_1.integer)('balance_minor_units').notNull().default(0),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.invoices = (0, pg_core_1.pgTable)('invoices', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    invoiceNumber: (0, pg_core_1.text)('invoice_number').notNull().unique(),
    carrierId: (0, pg_core_1.integer)('carrier_id')
        .notNull()
        .references(() => exports.users.id),
    underwriterId: (0, pg_core_1.integer)('underwriter_id').references(() => exports.users.id),
    payerName: (0, pg_core_1.text)('payer_name').notNull(),
    payerDaysToPay: (0, pg_core_1.integer)('payer_days_to_pay').notNull().default(30),
    faceValueMinorUnits: (0, pg_core_1.integer)('face_value_minor_units').notNull(),
    advanceRateBps: (0, pg_core_1.integer)('advance_rate_bps').notNull(),
    feeRateBps: (0, pg_core_1.integer)('fee_rate_bps').notNull(),
    advanceMinorUnits: (0, pg_core_1.integer)('advance_minor_units'),
    feeMinorUnits: (0, pg_core_1.integer)('fee_minor_units'),
    reserveMinorUnits: (0, pg_core_1.integer)('reserve_minor_units'),
    currency: (0, exports.currencyEnum)('currency').notNull().default('USD'),
    status: (0, exports.invoiceStatusEnum)('status').notNull().default('pending'),
    notes: (0, pg_core_1.text)('notes'),
    submittedAt: (0, pg_core_1.timestamp)('submitted_at').defaultNow().notNull(),
    approvedAt: (0, pg_core_1.timestamp)('approved_at'),
    disbursedAt: (0, pg_core_1.timestamp)('disbursed_at'),
    collectedAt: (0, pg_core_1.timestamp)('collected_at'),
});
exports.ledgerEntries = (0, pg_core_1.pgTable)('ledger_entries', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    invoiceId: (0, pg_core_1.integer)('invoice_id').references(() => exports.invoices.id),
    accountId: (0, pg_core_1.integer)('account_id')
        .notNull()
        .references(() => exports.accounts.id),
    entryType: (0, exports.entryTypeEnum)('entry_type').notNull(),
    amountMinorUnits: (0, pg_core_1.integer)('amount_minor_units').notNull(),
    currency: (0, exports.currencyEnum)('currency').notNull().default('USD'),
    description: (0, pg_core_1.text)('description').notNull(),
    postedAt: (0, pg_core_1.timestamp)('posted_at').defaultNow().notNull(),
});
//# sourceMappingURL=schema.js.map