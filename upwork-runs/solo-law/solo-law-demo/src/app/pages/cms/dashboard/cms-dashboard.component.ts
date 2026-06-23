import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-cms-dashboard',
  standalone: true,
  imports: [RouterLink, TranslatePipe, TranslateDirective, CommonModule],
  template: `
    <div class="p-8 min-h-screen">
      <div class="mb-10">
        <p class="text-xs uppercase tracking-[0.2em] text-accent mb-2">Welcome back</p>
        <h1 class="font-serif text-4xl font-light text-text-primary">{{ 'cms.dashboard' | translate }}</h1>
      </div>

      <!-- Stat cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        @for (stat of stats(); track stat.label) {
          <div class="p-6 border border-white/10 hover:border-accent/30 transition-colors"
               style="background: var(--bg-surface);">
            <p class="text-3xl font-serif text-text-primary mb-1">{{ stat.value }}</p>
            <p class="text-xs uppercase tracking-widest text-text-secondary">{{ stat.label }}</p>
          </div>
        }
      </div>

      <!-- Quick actions -->
      <div class="mb-10">
        <p class="text-xs uppercase tracking-widest text-text-secondary mb-4">Quick Actions</p>
        <div class="flex flex-wrap gap-3">
          <a routerLink="/cms/practice-areas/edit/new" class="btn-outline text-xs">+ New Practice Area</a>
          <a routerLink="/cms/publications/edit/new" class="btn-outline text-xs">+ New Publication</a>
          <a routerLink="/cms/brand-assets" class="btn-ghost text-xs">Manage Brand Assets</a>
          <a routerLink="/cms/i18n" class="btn-ghost text-xs">Manage Translations</a>
        </div>
      </div>

      <!-- AI model note -->
      <div class="p-6 border border-accent/20 max-w-xl" style="background: var(--bg-surface);">
        <p class="text-xs uppercase tracking-widest text-accent mb-2">AI Content Assistant</p>
        <p class="text-sm text-text-secondary leading-relaxed">
          Open any Practice Area or Publication to access the AI Assist panel.
          In a WebGPU-enabled browser, it runs Phi-3.5-mini locally in your GPU.
          Agentic loop: <span class="text-text-primary">Draft → Reflect → Evaluate → Accept</span>.
        </p>
      </div>
    </div>
  `
})
export class CmsDashboardComponent implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);
  stats = signal<{label: string; value: number}[]>([]);

  async ngOnInit() {
    try {
      const s = await this.api.cmsDashboardStats();
      this.stats.set([
        { label: 'Practice Areas', value: s.practice_areas || 0 },
        { label: 'Publications', value: s.publications || 0 },
        { label: 'Languages', value: s.languages || 3 },
        { label: 'Brand Assets', value: s.brand_assets || 0 },
      ]);
    } catch {
      this.stats.set([
        { label: 'Practice Areas', value: 4 },
        { label: 'Publications', value: 5 },
        { label: 'Languages', value: 3 },
        { label: 'Brand Assets', value: 0 },
      ]);
    }
  }
}
