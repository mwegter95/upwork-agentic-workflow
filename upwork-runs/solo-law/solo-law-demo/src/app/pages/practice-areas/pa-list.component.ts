import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateDirective, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

const PA_IMAGES: Record<string, string> = {
  'corporate-transactions': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80',
  'commercial-litigation': 'https://images.unsplash.com/photo-1589391886645-d51941baf7fb?w=800&q=80',
  'intellectual-property': 'https://images.unsplash.com/photo-1620325867502-221cfb5faa5f?w=800&q=80',
  'regulatory-compliance': 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&q=80',
};

@Component({
  selector: 'app-pa-list',
  standalone: true,
  imports: [RouterLink, TranslatePipe, TranslateDirective, CommonModule],
  template: `
    <div class="pt-16 min-h-screen">
      <!-- Header -->
      <div class="py-20 px-6 border-b border-white/10" style="background: var(--bg-surface);">
        <div class="max-w-7xl mx-auto">
          <p class="text-xs uppercase tracking-[0.2em] text-accent mb-4">{{ 'pa.heading' | translate }}</p>
          <h1 class="font-serif text-5xl font-light text-text-primary">{{ 'pa.subhead' | translate }}</h1>
        </div>
      </div>

      <!-- Grid -->
      <div class="max-w-7xl mx-auto py-16 px-6">
        @if (loading()) {
          <div class="flex justify-center py-20">
            <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        } @else {
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
            @for (pa of practiceAreas(); track pa.id) {
              <a [routerLink]="['/practice-areas', pa.slug]"
                 class="group block">
                <!-- Image -->
                <div class="overflow-hidden mb-6 h-56">
                  <img [src]="getImage(pa.slug)" [alt]="pa.title"
                       class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                       style="filter: grayscale(100%) contrast(1.1);" />
                </div>
                <!-- Content -->
                <div class="border-t border-white/10 pt-6">
                  <div class="flex items-center gap-3 mb-3">
                    <span class="text-xl">{{ pa.icon_emoji }}</span>
                    <h2 class="font-serif text-2xl font-light text-text-primary group-hover:text-accent transition-colors">
                      {{ pa.title }}
                    </h2>
                  </div>
                  <p class="font-sans text-sm text-text-secondary leading-relaxed">{{ pa.tagline }}</p>
                  <p class="mt-4 text-xs uppercase tracking-widest text-accent flex items-center gap-2">
                    <span>Explore</span><span>→</span>
                  </p>
                </div>
              </a>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class PaListComponent implements OnInit {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  practiceAreas = signal<any[]>([]);
  loading = signal(true);

  getImage(slug: string) { return PA_IMAGES[slug] || PA_IMAGES['corporate-transactions']; }

  async ngOnInit() {
    await this.load(this.translate.currentLang() || 'en');
    this.translate.onLangChange.subscribe(e => this.load(e.lang));
  }

  private async load(locale: string) {
    this.loading.set(true);
    try { this.practiceAreas.set(await this.api.getPracticeAreas(locale)); }
    catch { this.practiceAreas.set([]); }
    finally { this.loading.set(false); }
  }
}
