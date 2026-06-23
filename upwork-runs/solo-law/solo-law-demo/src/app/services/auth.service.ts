import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

const API = 'https://api.michaelwegter.com/solo-law';
const TOKEN_KEY = 'sl_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly isLoggedIn = signal<boolean>(!!localStorage.getItem(TOKEN_KEY));
  readonly currentUser = signal<{email: string; role: string} | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.currentUser.set({ email: payload.email, role: payload.role });
      } catch { this.clearToken(); }
    }
  }

  async login(email: string, password: string): Promise<void> {
    const res: any = await lastValueFrom(
      this.http.post(`${API}/auth/login`, { email, password })
    );
    if (res.token) {
      localStorage.setItem(TOKEN_KEY, res.token);
      this.isLoggedIn.set(true);
      const payload = JSON.parse(atob(res.token.split('.')[1]));
      this.currentUser.set({ email: payload.email, role: payload.role });
    } else {
      throw new Error('Login failed');
    }
  }

  logout(): void {
    this.clearToken();
    this.router.navigate(['/cms/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
  }
}
