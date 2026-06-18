import { JwtService } from '@nestjs/jwt';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '../../../../packages/db/src/schema';
type DB = NodePgDatabase<typeof schema>;
export declare class AuthService {
    private readonly db;
    private readonly jwtService;
    constructor(db: DB, jwtService: JwtService);
    login(email: string, password: string): Promise<{
        access_token: string;
        user: {
            id: number;
            email: string;
            role: "admin" | "underwriter" | "carrier" | "driver";
            name: string;
        };
    }>;
    findById(id: number): Promise<{
        role: "admin" | "underwriter" | "carrier" | "driver";
        id: number;
        email: string;
        passwordHash: string;
        name: string;
        createdAt: Date;
    }>;
}
export {};
