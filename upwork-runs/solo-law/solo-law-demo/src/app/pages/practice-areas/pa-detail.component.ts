import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateDirective, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

const PA_IMAGES: Record<string, string> = {
  'corporate-transactions': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1600&q=80',
  'commercial-litigation': 'https://images.unsplash.com/photo-1589391886645-d51941baf7fb?w=1600&q=80',
  'intellectual-property': 'https://images.unsplash.com/photo-1620325867502-221cfb5faa5f?w=1600&q=80',
  'regulatory-compliance': 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=1600&q=80',
};

@Component({
  selector: 'app-pa-detail',
  standalone: true,
  imports: [RouterLink, TranslatePipe, TranslateDirective, CommonModule],
  template: `
    <div class="pt-16 min-h-screen">
      @if (loading()) {
        <div class="flex justify-center py-40">
          <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (pa()) {
        <!-- Hero image -->
        <div class="h-64 md:h-96 overflow-hidden">
          <img [src]="getImage(pa()!.slug)" [alt]="pa()!.title"
               class="w-full h-full object-cover"
               style="filter: grayscale(100%) contrast(1.1);" />
        </div>

        <!-- Content -->
        <div class="max-w-4xl mx-auto px-6 py-16">
          <a routerLink="/practice-areas"
             class="text-xs uppercase tracking-widest text-accent hover:underline mb-8 inline-block">
            ← {{ 'pa.heading' | translate }}
          </a>
          <div class="flex items-center gap-3 mb-4">
            <span class="text-3xl">{{ pa()!.icon_emoji }}</span>
            <h1 class="font-serif text-4xl md:text-5xl font-light text-text-primary">{{ pa()!.title }}</h1>
          </div>
          <p class="font-sans text-lg text-accent mb-8 font-light">{{ pa()!.tagline }}</p>
          <hr class="gold-rule" />
          <div class="prose-legal" [innerHTML]="pa()!.body_html"></div>

          <!-- Related publications -->
          @if (pa()!.publications?.length) {
            <div class="mt-16 pt-8 border-t border-white/10">
              <p class="text-xs uppercase tracking-[0.2em] text-accent mb-8">Related Publications</p>
              <div class="space-y-6">
                @for (pub of pa()!.publications; track pub.id) {
                  <a [routerLink]="['/publications', pub.slug]"
                     class="group block border-l-2 border-white/10 pl-6 hover:border-accent transition-colors">
                    <p class="text-xs text-text-secondary mb-2">{{ pub.published_at | date:'MMMM d, yyyy' }}</p>
                    <h3 class="font-serif text-xl font-light text-text-primary group-hover:text-accent transition-colors">{{ pub.title }}</h3>
                  </a>
                }
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="flex justify-center items-center py-40 text-text-secondary">Practice area not found.</div>
      }
    </div>
  `
})
export class PaDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  pa = signal<any>(null);
  loading = signal(true);

  getImage(slug: string) { return PA_IMAGES[slug] || PA_IMAGES['corporate-transactions']; }

  async ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    await this.load(slug, this.translate.currentLang() || 'en');
    this.translate.onLangChange.subscribe(e => this.load(slug, e.lang));
  }

  private async load(slug: string, locale: string) {
    this.loading.set(true);
    try { this.pa.set(await this.api.getPracticeArea(slug, locale)); }
    catch { this.pa.set(null); }
    finally { this.loading.set(false); }
  }
}
