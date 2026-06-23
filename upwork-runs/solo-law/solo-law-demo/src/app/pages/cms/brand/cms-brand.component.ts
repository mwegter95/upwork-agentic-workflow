import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';

const SEED_ASSETS = [
  { id: 'seed-1', name: 'Background Base', type: 'color', value: '#0D0D0D', tag: 'palette' },
  { id: 'seed-2', name: 'Surface', type: 'color', value: '#141414', tag: 'palette' },
  { id: 'seed-3', name: 'Text Primary', type: 'color', value: '#F5F3EF', tag: 'palette' },
  { id: 'seed-4', name: 'Accent Gold', type: 'color', value: '#C9A96E', tag: 'palette' },
  { id: 'seed-5', name: 'Accent Hover', type: 'color', value: '#B8955A', tag: 'palette' },
  { id: 'seed-6', name: 'Text Secondary', type: 'color', value: '#9E9E9E', tag: 'palette' },
  { id: 'seed-7', name: 'Display', type: 'font', value: 'Cormorant Garamond', tag: 'typography' },
  { id: 'seed-8', name: 'Body', type: 'font', value: 'Inter', tag: 'typography' },
  { id: 'seed-9', name: 'Tone Voice', type: 'text', value: 'formal, precise, institutional; avoid marketing clichés', tag: 'brand-voice' },
  { id: 'seed-10', name: 'Forbidden Terms', type: 'text', value: 'passionate, innovative, cutting-edge, leverage, synergy', tag: 'brand-voice' },
];

@Component({
  selector: 'app-cms-brand',
  standalone: true,
  imports: [FormsModule, TranslatePipe, TranslateDirective, CommonModule],
  template: `
    <div class="p-8 min-h-screen">
      <div class="mb-8">
        <p class="text-xs uppercase tracking-[0.2em] text-accent mb-1">{{ 'cms.brand_assets' | translate }}</p>
        <h1 class="font-serif text-3xl font-light text-text-primary">Brand System</h1>
      </div>

      <!-- Color palette -->
      <section class="mb-12">
        <p class="text-xs uppercase tracking-widest text-text-secondary mb-4">Palette</p>
        <div class="flex flex-wrap gap-4">
          @for (a of colorAssets(); track a.id) {
            <div class="flex flex-col items-center gap-2">
              <div class="w-16 h-16 border border-white/10" [style.background]="a.value"></div>
              <p class="text-xs text-text-secondary text-center">{{ a.name }}</p>
              <p class="text-xs font-mono text-text-primary">{{ a.value }}</p>
            </div>
          }
        </div>
      </section>

      <!-- Typography -->
      <section class="mb-12">
        <p class="text-xs uppercase tracking-widest text-text-secondary mb-4">Typography</p>
        <div class="space-y-4">
          @for (a of fontAssets(); track a.id) {
            <div class="p-4 border border-white/10" style="background: var(--bg-surface);">
              <p class="text-xs text-text-secondary mb-1">{{ a.name }}</p>
              <p class="text-2xl text-text-primary" [style.fontFamily]="a.value">{{ a.value }}</p>
            </div>
          }
        </div>
        <!-- Type scale demo -->
        <div class="mt-6 p-6 border border-white/10" style="background: var(--bg-surface);">
          <p class="font-serif text-5xl text-text-primary mb-2">Aa Bb Cc — Display Serif</p>
          <p class="font-sans text-base text-text-secondary leading-relaxed">Body copy uses Inter at regular weight. Proper line-height 1.7–1.8 for legal prose readability.</p>
          <p class="font-sans text-accent text-sm mt-2 uppercase tracking-[0.2em]">Accent uppercase labels, 0.2em tracking</p>
        </div>
      </section>

      <!-- Brand voice -->
      <section class="mb-12">
        <p class="text-xs uppercase tracking-widest text-text-secondary mb-4">Brand Voice</p>
        <div class="space-y-3">
          @for (a of voiceAssets(); track a.id) {
            <div class="p-4 border border-white/10" style="background: var(--bg-surface);">
              <p class="text-xs text-accent uppercase tracking-widest mb-2">{{ a.name }}</p>
              <p class="text-sm text-text-primary">{{ a.value }}</p>
            </div>
          }
        </div>
      </section>

      <!-- Add custom asset -->
      <section class="max-w-lg">
        <p class="text-xs uppercase tracking-widest text-text-secondary mb-4">Add Asset</p>
        <form (ngSubmit)="addAsset()" class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs uppercase tracking-widest text-text-secondary mb-1">Name</label>
              <input type="text" [(ngModel)]="newAsset.name" name="name" class="sl-input text-sm" required />
            </div>
            <div>
              <label class="block text-xs uppercase tracking-widest text-text-secondary mb-1">Type</label>
              <select [(ngModel)]="newAsset.type" name="type" class="sl-input text-sm">
                <option>color</option><option>font</option><option>image</option><option>text</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs uppercase tracking-widest text-text-secondary mb-1">Value</label>
              <input type="text" [(ngModel)]="newAsset.value" name="value" class="sl-input text-sm" required />
            </div>
            <div>
              <label class="block text-xs uppercase tracking-widest text-text-secondary mb-1">Tag</label>
              <input type="text" [(ngModel)]="newAsset.tag" name="tag" class="sl-input text-sm" />
            </div>
          </div>
          <button type="submit" [disabled]="adding()" class="btn-gold text-xs">
            {{ adding() ? 'Adding...' : '+ Add Asset' }}
          </button>
        </form>
      </section>

      <!-- Custom assets from API -->
      @if (customAssets().length) {
        <section class="mt-8">
          <p class="text-xs uppercase tracking-widest text-text-secondary mb-4">Custom Assets</p>
          <div class="space-y-2">
            @for (a of customAssets(); track a.id) {
              <div class="flex items-center justify-between p-4 border border-white/10" style="background: var(--bg-surface);">
                <div>
                  <span class="text-xs uppercase tracking-widest text-accent mr-2">{{ a.type }}</span>
                  <span class="text-sm text-text-primary">{{ a.name }}: {{ a.value }}</span>
                </div>
                <button (click)="deleteAsset(a.id)" class="btn-ghost text-xs text-danger hover:border-danger">Delete</button>
              </div>
            }
          </div>
        </section>
      }
    </div>
  `
})
export class CmsBrandComponent implements OnInit {
  private api = inject(ApiService);
  customAssets = signal<any[]>([]);
  adding = signal(false);
  newAsset = { name: '', type: 'color', value: '', tag: '' };

  colorAssets() { return SEED_ASSETS.filter(a => a.type === 'color'); }
  fontAssets() { return SEED_ASSETS.filter(a => a.type === 'font'); }
  voiceAssets() { return SEED_ASSETS.filter(a => a.tag === 'brand-voice'); }

  async ngOnInit() {
    try { this.customAssets.set(await this.api.getBrandAssets()); }
    catch { this.customAssets.set([]); }
  }

  async addAsset() {
    this.adding.set(true);
    try {
      await this.api.cmsCreateBrandAsset(this.newAsset);
      this.customAssets.set(await this.api.getBrandAssets());
      this.newAsset = { name: '', type: 'color', value: '', tag: '' };
    } catch {} finally { this.adding.set(false); }
  }

  async deleteAsset(id: number) {
    if (!confirm('Delete?')) return;
    await this.api.cmsDeleteBrandAsset(id);
    this.customAssets.set(await this.api.getBrandAssets());
  }
}
