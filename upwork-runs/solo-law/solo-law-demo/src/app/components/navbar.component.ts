import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe, CommonModule],
  template: `
    <nav class="fixed top-0 left-0 right-0 z-50 border-b border-white/5"
         style="background: rgba(13,13,13,0.95); backdrop-filter: blur(12px);">
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <!-- Firm name -->
        <a routerLink="/" class="font-serif text-xl text-text-primary tracking-wide hover:text-accent transition-colors">
          Wegter Law
        </a>

        <!-- Desktop nav -->
        <div class="hidden md:flex items-center gap-8">
          <a routerLink="/practice-areas" routerLinkActive="text-accent"
             class="nav-link text-xs uppercase tracking-widest text-text-secondary hover:text-text-primary transition-colors">
            {{ 'nav.practice_areas' | translate }}
          </a>
          <a routerLink="/publications" routerLinkActive="text-accent"
             class="nav-link text-xs uppercase tracking-widest text-text-secondary hover:text-text-primary transition-colors">
            {{ 'nav.publications' | translate }}
          </a>
          <a routerLink="/contact" routerLinkActive="text-accent"
             class="nav-link text-xs uppercase tracking-widest text-text-secondary hover:text-text-primary transition-colors">
            {{ 'nav.contact' | translate }}
          </a>
        </div>

        <!-- Right: locale + CMS -->
        <div class="flex items-center gap-4">
          <div class="flex gap-1">
            @for (lang of langs; track lang) {
              <button (click)="setLang(lang)"
                      [class.text-accent]="currentLang() === lang"
                      [class.border-accent]="currentLang() === lang"
                      class="px-2 py-1 text-xs font-mono border border-white/10 text-text-secondary hover:text-accent hover:border-accent transition-all">
                {{ lang.toUpperCase() }}
              </button>
            }
          </div>
          <a routerLink="/cms/login"
             class="text-xs uppercase tracking-widest text-text-secondary hover:text-accent transition-colors border-l border-white/10 pl-4">
            {{ 'nav.cms_login' | translate }}
          </a>
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent {
  private translate = inject(TranslateService);
  langs = ['en', 'es', 'fr'];
  currentLang = signal<string>(this.translate.currentLang() || 'en');

  setLang(lang: string) {
    this.translate.use(lang);
    localStorage.setItem('sl_lang', lang);
    this.currentLang.set(lang);
  }
}
