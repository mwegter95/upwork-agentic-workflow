import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cms-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, TranslatePipe, TranslateDirective, CommonModule],
  template: `
    <div class="min-h-screen flex" style="background: var(--bg-base);">
      <!-- Sidebar -->
      <aside class="w-56 fixed top-0 bottom-0 left-0 border-r border-white/10 flex flex-col"
             style="background: var(--bg-surface); z-index: 40;">
        <div class="px-6 py-5 border-b border-white/10">
          <p class="font-serif text-base text-text-primary">Wegter Law</p>
          <p class="text-xs text-accent tracking-widest">CMS</p>
        </div>

        <nav class="flex-1 py-4 overflow-y-auto">
          <a routerLink="/cms/dashboard" routerLinkActive="bg-white/5 text-text-primary"
             class="flex items-center gap-3 px-6 py-2.5 text-xs uppercase tracking-widest text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
            <span>⬜</span> {{ 'cms.dashboard' | translate }}
          </a>
          <a routerLink="/cms/practice-areas" routerLinkActive="bg-white/5 text-text-primary"
             class="flex items-center gap-3 px-6 py-2.5 text-xs uppercase tracking-widest text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
            <span>🏛</span> {{ 'cms.practice_areas' | translate }}
          </a>
          <a routerLink="/cms/publications" routerLinkActive="bg-white/5 text-text-primary"
             class="flex items-center gap-3 px-6 py-2.5 text-xs uppercase tracking-widest text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
            <span>📄</span> {{ 'cms.publications' | translate }}
          </a>
          <a routerLink="/cms/brand-assets" routerLinkActive="bg-white/5 text-text-primary"
             class="flex items-center gap-3 px-6 py-2.5 text-xs uppercase tracking-widest text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
            <span>🎨</span> {{ 'cms.brand_assets' | translate }}
          </a>
          <a routerLink="/cms/i18n" routerLinkActive="bg-white/5 text-text-primary"
             class="flex items-center gap-3 px-6 py-2.5 text-xs uppercase tracking-widest text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
            <span>🌐</span> {{ 'cms.translations' | translate }}
          </a>
        </nav>

        <div class="px-6 py-4 border-t border-white/10">
          <p class="text-xs text-text-secondary mb-3">{{ auth.currentUser()?.email }}</p>
          <button (click)="auth.logout()" class="btn-ghost w-full text-xs">{{ 'cms.logout' | translate }}</button>
        </div>
      </aside>

      <!-- Main -->
      <main class="ml-56 flex-1 min-h-screen pt-0">
        <router-outlet />
      </main>
    </div>
  `
})
export class CmsShellComponent {
  auth = inject(AuthService);
}
