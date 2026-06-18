import { LedgerService } from './ledger.service';
export declare class LedgerController {
    private readonly service;
    constructor(service: LedgerService);
    listAccounts(): Promise<{
        currency: "USD" | "BRL";
        id: number;
        name: string;
        code: string;
        type: "asset" | "liability" | "revenue" | "expense";
        balanceMinorUnits: number;
        updatedAt: Date;
    }[]>;
    accountEntries(id: number): Promise<{
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
    recent(): Promise<{
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
