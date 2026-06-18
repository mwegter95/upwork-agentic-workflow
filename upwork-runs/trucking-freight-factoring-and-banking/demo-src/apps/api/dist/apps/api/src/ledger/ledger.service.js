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
exports.LedgerService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const db_module_1 = require("../db/db.module");
const schema_1 = require("../../../../packages/db/src/schema");
let LedgerService = class LedgerService {
    constructor(db) {
        this.db = db;
    }
    async listAccounts() {
        return this.db.select().from(schema_1.accounts).orderBy(schema_1.accounts.code);
    }
    async getAccountWithEntries(id) {
        const [acct] = await this.db
            .select()
            .from(schema_1.accounts)
            .where((0, drizzle_orm_1.eq)(schema_1.accounts.id, id))
            .limit(1);
        const entries = await this.db
            .select()
            .from(schema_1.ledgerEntries)
            .where((0, drizzle_orm_1.eq)(schema_1.ledgerEntries.accountId, id))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.ledgerEntries.postedAt))
            .limit(100);
        return { account: acct, entries };
    }
    async recentEntries() {
        return this.db
            .select()
            .from(schema_1.ledgerEntries)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.ledgerEntries.postedAt))
            .limit(50);
    }
};
exports.LedgerService = LedgerService;
exports.LedgerService = LedgerService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(db_module_1.DB_TOKEN)),
    __metadata("design:paramtypes", [Object])
], LedgerService);
//# sourceMappingURL=ledger.service.js.map