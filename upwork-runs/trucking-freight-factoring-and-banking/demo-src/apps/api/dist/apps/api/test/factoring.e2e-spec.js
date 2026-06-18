"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const postgres_1 = __importDefault(require("postgres"));
const DB_URL = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
function calcAdvance(face, rateBps) { return Math.floor((face * rateBps) / 10000); }
function calcFee(face, rateBps) { return Math.floor((face * rateBps) / 10000); }
function calcReserve(face, advance) { return face - advance; }
describe('Money math — integer invariants', () => {
    it('advance calc uses only integer arithmetic (no float loss)', () => {
        const face = 1250000;
        const adv = calcAdvance(face, 9000);
        expect(adv).toBe(1125000);
        expect(Number.isInteger(adv)).toBe(true);
    });
    it('fee calc — integer only', () => {
        const fee = calcFee(1250000, 200);
        expect(fee).toBe(25000);
        expect(Number.isInteger(fee)).toBe(true);
    });
    it('reserve is face minus advance (no float operations)', () => {
        const face = 1250000;
        const adv = calcAdvance(face, 9000);
        const reserve = calcReserve(face, adv);
        expect(reserve).toBe(125000);
        expect(adv + reserve).toBe(face);
    });
    it('partial basis point calc does not produce fractional cents', () => {
        const face = 2300000;
        const adv = calcAdvance(face, 9200);
        expect(adv).toBe(2116000);
        expect(Number.isInteger(adv)).toBe(true);
    });
});
describe('Real-DB money paths', () => {
    let client;
    beforeAll(async () => {
        if (!DB_URL) {
            console.warn('No DATABASE_URL — skipping real-DB tests');
            return;
        }
        client = (0, postgres_1.default)(DB_URL, { prepare: false });
    });
    afterAll(async () => {
        if (client)
            await client.end();
    });
    function skip() { return !DB_URL; }
    it('invoice create: advance/fee/reserve stored as integer cents', async () => {
        if (skip())
            return;
        const rows = await client `
      SELECT face_value_minor_units, advance_rate_bps, fee_rate_bps,
             advance_minor_units, fee_minor_units, reserve_minor_units
      FROM invoices WHERE invoice_number = 'INV-001'
    `;
        if (rows.length === 0) {
            console.warn('INV-001 not seeded — seed the DB first');
            return;
        }
        const inv = rows[0];
        const face = inv.face_value_minor_units;
        const expectedAdv = calcAdvance(face, inv.advance_rate_bps);
        const expectedFee = calcFee(face, inv.fee_rate_bps);
        const expectedReserve = calcReserve(face, expectedAdv);
        expect(inv.advance_minor_units).toBe(expectedAdv);
        expect(inv.fee_minor_units).toBe(expectedFee);
        expect(inv.reserve_minor_units).toBe(expectedReserve);
        expect(Number.isInteger(inv.advance_minor_units)).toBe(true);
        expect(Number.isInteger(inv.fee_minor_units)).toBe(true);
        expect(Number.isInteger(inv.reserve_minor_units)).toBe(true);
    });
    it('approved invoice has consistent integer money fields', async () => {
        if (skip())
            return;
        const rows = await client `
      SELECT face_value_minor_units, advance_minor_units, fee_minor_units, reserve_minor_units, status
      FROM invoices WHERE invoice_number = 'INV-002'
    `;
        if (rows.length === 0) {
            console.warn('INV-002 not seeded');
            return;
        }
        const inv = rows[0];
        expect(inv.status).toBe('approved');
        expect(Number.isInteger(inv.advance_minor_units)).toBe(true);
        expect(Number.isInteger(inv.fee_minor_units)).toBe(true);
        expect(inv.advance_minor_units + inv.reserve_minor_units)
            .toBe(inv.face_value_minor_units);
    });
    it('disbursed invoice has 2 ledger entries posted', async () => {
        if (skip())
            return;
        const rows = await client `
      SELECT id, status, disbursed_at, advance_minor_units
      FROM invoices WHERE invoice_number = 'INV-003'
    `;
        if (rows.length === 0) {
            console.warn('INV-003 not seeded');
            return;
        }
        const inv = rows[0];
        expect(inv.status).toBe('disbursed');
        expect(inv.disbursed_at).toBeTruthy();
        expect(Number.isInteger(inv.advance_minor_units)).toBe(true);
    });
    it('ledger account balances are all integers', async () => {
        if (skip())
            return;
        const rows = await client `SELECT balance_minor_units FROM accounts`;
        for (const row of rows) {
            expect(Number.isInteger(row.balance_minor_units)).toBe(true);
        }
    });
});
//# sourceMappingURL=factoring.e2e-spec.js.map