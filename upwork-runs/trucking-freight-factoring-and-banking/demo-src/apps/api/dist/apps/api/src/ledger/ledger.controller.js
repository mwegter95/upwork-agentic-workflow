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
exports.LedgerController = void 0;
const common_1 = require("@nestjs/common");
const ledger_service_1 = require("./ledger.service");
const jwt_strategy_1 = require("../auth/jwt.strategy");
let LedgerController = class LedgerController {
    constructor(service) {
        this.service = service;
    }
    listAccounts() {
        return this.service.listAccounts();
    }
    accountEntries(id) {
        return this.service.getAccountWithEntries(id);
    }
    recent() {
        return this.service.recentEntries();
    }
};
exports.LedgerController = LedgerController;
__decorate([
    (0, common_1.Get)('accounts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LedgerController.prototype, "listAccounts", null);
__decorate([
    (0, common_1.Get)('accounts/:id/entries'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], LedgerController.prototype, "accountEntries", null);
__decorate([
    (0, common_1.Get)('ledger'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LedgerController.prototype, "recent", null);
exports.LedgerController = LedgerController = __decorate([
    (0, common_1.UseGuards)(jwt_strategy_1.JwtAuthGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [ledger_service_1.LedgerService])
], LedgerController);
//# sourceMappingURL=ledger.controller.js.map