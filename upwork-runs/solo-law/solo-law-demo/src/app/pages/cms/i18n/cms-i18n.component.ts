import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-cms-i18n',
  standalone: true,
  imports: [FormsModule, TranslatePipe, TranslateDirective, CommonModule],
  template: `
    <div class="p-8 min-h-screen">
      <div class="mb-8">
        <p class="text-xs uppercase tracking-[0.2em] text-accent mb-1">{{ 'cms.translations' | translate }}</p>
        <h1 class="font-serif text-3xl font-light text-text-primary">Translation Manager</h1>
        <p class="text-sm text-text-secondary mt-2">Manage UI string overrides per locale. Content (practice areas, publications) is edited in their own sections.</p>
      </div>

      <!-- Side-by-side EN / ES -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        @for (locale of ['en','es']; track locale) {
          <div class="border border-white/10 p-6" style="background: var(--bg-surface);">
            <p class="text-xs uppercase tracking-widest text-accent mb-4">{{ locale.toUpperCase() }}</p>
            <div class="space-y-3 max-h-96 overflow-y-auto">
              @for (entry of stringsFor(locale); track entry.key) {
                <div>
                  <label class="block text-xs text-text-secondary mb-1 font-mono">{{ entry.key }}</label>
                  <input type="text" [(ngModel)]="entry.value"
                         class="sl-input text-sm"
                         (change)="markDirty(locale, entry.key, entry.value)" />
                </div>
              }
            </div>
          </div>
        }
      </div>

      @if (dirty().length) {
        <div class="flex items-center gap-4 p-4 border border-accent/30" style="background: var(--bg-surface);">
          <p class="text-xs text-text-secondary flex-1">{{ dirty().length }} unsaved changes</p>
          <button (click)="saveAll()" [disabled]="saving()" class="btn-gold text-xs">
            {{ saving() ? 'Saving...' : 'Save All' }}
          </button>
          <button (click)="revert()" class="btn-ghost text-xs">Revert</button>
        </div>
      }

      @if (savedMsg()) {
        <p class="text-green-400 text-xs mt-2">{{ savedMsg() }}</p>
      }
    </div>
  `
})
export class CmsI18nComponent implements OnInit {
  private api = inject(ApiService);
  enStrings = signal<{key: string; value: string}[]>([]);
  esStrings = signal<{key: string; value: string}[]>([]);
  dirty = signal<{locale: string; key: string; value: string}[]>([]);
  saving = signal(false);
  savedMsg = signal('');

  private flatten(obj: any, prefix = ''): {key: string; value: string}[] {
    return Object.entries(obj).flatMap(([k, v]) =>
      typeof v === 'object' && v !== null
        ? this.flatten(v, prefix ? `${prefix}.${k}` : k)
        : [{ key: prefix ? `${prefix}.${k}` : k, value: String(v) }]
    );
  }

  async ngOnInit() {
    try {
      const [en, es] = await Promise.all([
        fetch('./assets/i18n/en.json').then(r => r.json()),
        fetch('./assets/i18n/es.json').then(r => r.json()),
      ]);
      this.enStrings.set(this.flatten(en));
      this.esStrings.set(this.flatten(es));
    } catch {}
  }

  stringsFor(locale: string) {
    return locale === 'en' ? this.enStrings() : this.esStrings();
  }

  markDirty(locale: string, key: string, value: string) {
    const cur = this.dirty().filter(d => !(d.locale === locale && d.key === key));
    this.dirty.set([...cur, { locale, key, value }]);
  }

  async saveAll() {
    this.saving.set(true);
    try {
      for (const d of this.dirty()) {
        await this.api.cmsUpsertI18n(d);
      }
      this.dirty.set([]);
      this.savedMsg.set('All changes saved.');
      setTimeout(() => this.savedMsg.set(''), 2000);
    } catch { this.savedMsg.set('Save failed.'); }
    finally { this.saving.set(false); }
  }

  revert() { this.dirty.set([]); }
}
