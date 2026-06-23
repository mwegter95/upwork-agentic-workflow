import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-cms-login',
  standalone: true,
  imports: [FormsModule, TranslatePipe, TranslateDirective, CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center px-6" style="background: var(--bg-base);">
      <div class="w-full max-w-sm">
        <div class="text-center mb-10">
          <p class="font-serif text-2xl text-text-primary mb-1">Wegter Law</p>
          <p class="text-xs uppercase tracking-widest text-accent">Editor Access</p>
        </div>

        <form (ngSubmit)="login()" class="space-y-4">
          <div>
            <label class="block text-xs uppercase tracking-widest text-text-secondary mb-2">{{ 'cms.email' | translate }}</label>
            <input type="email" [(ngModel)]="email" name="email" required
                   class="sl-input" placeholder="editor@solo-law.demo" />
          </div>
          <div>
            <label class="block text-xs uppercase tracking-widest text-text-secondary mb-2">{{ 'cms.password' | translate }}</label>
            <input type="password" [(ngModel)]="password" name="password" required
                   class="sl-input" placeholder="••••••••" />
          </div>

          @if (error()) {
            <p class="text-xs text-danger text-center py-2">{{ error() }}</p>
          }

          <button type="submit" [disabled]="loading()" class="btn-gold w-full mt-2">
            @if (loading()) { Signing in... }
            @else { {{ 'cms.sign_in' | translate }} }
          </button>
        </form>

        <div class="mt-8 p-4 border border-white/10 rounded" style="background: var(--bg-surface);">
          <p class="text-xs text-text-secondary text-center mb-2">Demo credentials</p>
          <p class="text-xs font-mono text-text-primary text-center">editor&#64;solo-law.demo / Demo2026!</p>
        </div>
      </div>
    </div>
  `
})
export class CmsLoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  email = 'editor@solo-law.demo';
  password = 'Demo2026!';
  loading = signal(false);
  error = signal('');

  async login() {
    this.loading.set(true);
    this.error.set('');
    try {
      await this.auth.login(this.email, this.password);
      this.router.navigate(['/cms/dashboard']);
    } catch {
      this.error.set('Invalid credentials. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
