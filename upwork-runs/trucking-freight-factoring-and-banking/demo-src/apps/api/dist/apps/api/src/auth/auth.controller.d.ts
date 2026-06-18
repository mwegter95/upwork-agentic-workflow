import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(body: unknown): Promise<{
        access_token: string;
        user: {
            id: number;
            email: string;
            role: "admin" | "underwriter" | "carrier" | "driver";
            name: string;
        };
    }>;
    me(req: {
        user: {
            sub: number;
            email: string;
            role: string;
            name: string;
        };
    }): {
        sub: number;
        email: string;
        role: string;
        name: string;
    };
}
