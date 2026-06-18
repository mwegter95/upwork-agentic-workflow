import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '../../../../packages/db/src/schema';
type DB = NodePgDatabase<typeof schema>;
export declare class LedgerService {
    private readonly db;
    constructor(db: DB);
    listAccounts(): Promise<{
        currency: "USD" | "BRL";
        id: number;
        name: string;
        code: string;
        type: "asset" | "liability" | "revenue" | "expense";
        balanceMinorUnits: number;
        updatedAt: Date;
    }[]>;
    getAccountWithEntries(id: number): Promise<{
        account: {
            currency: "USD" | "BRL";
            id: number;
            name: string;
            code: string;
            type: "asset" | "liability" | "revenue" | "expense";
            balanceMinorUnits: number;
            updatedAt: Date;
        };
        entries: {
            currency: "USD" | "BRL";
            id: number;
            invoiceId: number | null;
            accountId: number;
            entryType: "debit" | "credit";
            amountMinorUnits: number;
            description: string;
            postedAt: Date;
        }[];
    }>;
    recentEntries(): Promise<{
        currency: "USD" | "BRL";
        id: number;
        invoiceId: number | null;
        accountId: number;
        entryType: "debit" | "credit";
        amountMinorUnits: number;
        description: string;
        postedAt: Date;
    }[]>;
}
export {};
