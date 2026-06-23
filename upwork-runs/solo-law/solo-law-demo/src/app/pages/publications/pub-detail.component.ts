import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateDirective, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-pub-detail',
  standalone: true,
  imports: [RouterLink, TranslatePipe, TranslateDirective, CommonModule],
  template: `
    <div class="pt-16 min-h-screen">
      @if (loading()) {
        <div class="flex justify-center py-40">
          <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (pub()) {
        <div class="max-w-3xl mx-auto px-6 py-16">
          <a routerLink="/publications"
             class="text-xs uppercase tracking-widest text-accent hover:underline mb-8 inline-block">
            ← {{ 'pub.heading' | translate }}
          </a>
          <p class="text-xs font-mono text-text-secondary mb-4">
            {{ pub()!.published_at | date:'MMMM d, yyyy' }} &nbsp;·&nbsp; {{ pub()!.author }}
          </p>
          <h1 class="font-serif text-4xl md:text-5xl font-light text-text-primary leading-tight mb-6">
            {{ pub()!.title }}
          </h1>
          <p class="font-sans text-lg text-accent font-light mb-8">{{ pub()!.excerpt }}</p>
          <hr class="gold-rule" />
          <div class="prose-legal" [innerHTML]="pub()!.body_html"></div>

          <div class="mt-12 pt-8 border-t border-white/10">
            <p class="text-xs text-text-secondary italic">
              This article is for informational purposes only and does not constitute legal advice.
              Contacting Wegter Law does not create an attorney-client relationship.
            </p>
          </div>
        </div>
      } @else {
        <div class="flex justify-center items-center py-40 text-text-secondary">Publication not found.</div>
      }
    </div>
  `
})
export class PubDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  pub = signal<any>(null);
  loading = signal(true);

  async ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    await this.load(slug, this.translate.currentLang() || 'en');
    this.translate.onLangChange.subscribe(e => this.load(slug, e.lang));
  }

  private async load(slug: string, locale: string) {
    this.loading.set(true);
    try { this.pub.set(await this.api.getPublication(slug, locale)); }
    catch { this.pub.set(null); }
    finally { this.loading.set(false); }
  }
}
