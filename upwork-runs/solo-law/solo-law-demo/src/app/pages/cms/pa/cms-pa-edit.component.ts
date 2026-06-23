import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { AiAssistComponent } from '../../../components/ai-assist.component';

@Component({
  selector: 'app-cms-pa-edit',
  standalone: true,
  imports: [RouterLink, FormsModule, TranslatePipe, TranslateDirective, CommonModule, AiAssistComponent],
  template: `
    <div class="p-8 min-h-screen">
      <div class="flex items-center justify-between mb-8">
        <div>
          <a routerLink="/cms/practice-areas" class="text-xs text-accent hover:underline">← {{ 'cms.practice_areas' | translate }}</a>
          <h1 class="font-serif text-3xl font-light text-text-primary mt-1">
            {{ isNew() ? 'New Practice Area' : 'Edit Practice Area' }}
          </h1>
        </div>
        <div class="flex gap-2">
          <button (click)="showAi.set(!showAi())" class="btn-outline text-xs">
            🤖 {{ 'cms.ai_assist' | translate }}
          </button>
          <button (click)="save()" [disabled]="saving()" class="btn-gold text-xs">
            {{ saving() ? 'Saving...' : ('cms.save' | translate) }}
          </button>
        </div>
      </div>

      @if (error()) {
        <div class="mb-4 p-4 border border-danger/40 text-sm text-danger">{{ error() }}</div>
      }
      @if (success()) {
        <div class="mb-4 p-4 border border-green-500/40 text-sm text-green-400">{{ success() }}</div>
      }

      <div class="flex gap-8">
        <!-- Form -->
        <div class="flex-1 space-y-5">
          <!-- Locale -->
          <div>
            <label class="block text-xs uppercase tracking-widest text-text-secondary mb-2">{{ 'cms.locale' | translate }}</label>
            <select [(ngModel)]="form.locale" class="sl-input text-sm">
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs uppercase tracking-widest text-text-secondary mb-2">{{ 'cms.title' | translate }}</label>
              <input type="text" [(ngModel)]="form.title" class="sl-input" />
            </div>
            <div>
              <label class="block text-xs uppercase tracking-widest text-text-secondary mb-2">{{ 'cms.icon' | translate }}</label>
              <input type="text" [(ngModel)]="form.icon_emoji" class="sl-input" placeholder="🏛" />
            </div>
          </div>
          <div>
            <label class="block text-xs uppercase tracking-widest text-text-secondary mb-2">{{ 'cms.tagline' | translate }}</label>
            <input type="text" [(ngModel)]="form.tagline" class="sl-input" />
          </div>
          <div>
            <label class="block text-xs uppercase tracking-widest text-text-secondary mb-2">{{ 'cms.body' | translate }} (HTML)</label>
            <textarea [(ngModel)]="form.body_html" rows="12" class="sl-input resize-none text-sm font-mono"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs uppercase tracking-widest text-text-secondary mb-2">{{ 'cms.display_order' | translate }}</label>
              <input type="number" [(ngModel)]="form.display_order" class="sl-input" />
            </div>
            <div class="flex items-end pb-1">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" [(ngModel)]="form.published" class="accent-accent" />
                <span class="text-xs uppercase tracking-widest text-text-secondary">{{ 'cms.published' | translate }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- AI Panel -->
        @if (showAi()) {
          <div class="w-80 flex-shrink-0">
            <app-ai-assist
              [context]="form.title + ': ' + form.tagline"
              (accepted)="acceptAi($event)" />
          </div>
        }
      </div>
    </div>
  `
})
export class CmsPaEditComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);

  isNew = signal(true);
  itemId = signal<number>(0);
  saving = signal(false);
  error = signal('');
  success = signal('');
  showAi = signal(false);

  form: any = {
    locale: 'en', title: '', tagline: '', body_html: '',
    icon_emoji: '🏛', display_order: 1, published: true, slug: ''
  };

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isNew.set(false);
      this.itemId.set(Number(id));
      try {
        const item = await this.api.cmsGetPracticeArea(Number(id));
        Object.assign(this.form, item);
      } catch { this.error.set('Failed to load item.'); }
    }
  }

  async save() {
    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    try {
      if (this.isNew()) {
        await this.api.cmsCreatePracticeArea(this.form);
        this.success.set('Created successfully.');
        setTimeout(() => this.router.navigate(['/cms/practice-areas']), 800);
      } else {
        await this.api.cmsUpdatePracticeArea(this.itemId(), this.form);
        this.success.set('Saved successfully.');
      }
    } catch { this.error.set('Save failed. Please try again.'); }
    finally { this.saving.set(false); }
  }

  acceptAi(text: string) { this.form.body_html = text; }
}
