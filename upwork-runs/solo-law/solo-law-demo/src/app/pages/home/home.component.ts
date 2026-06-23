import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, TranslatePipe, TranslateDirective, CommonModule],
  template: `
    <!-- Hero -->
    <section class="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <!-- Background -->
      <div class="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1920&q=80"
             alt="" class="w-full h-full object-cover"
             style="filter: grayscale(100%) contrast(1.05); opacity: 0.18;" />
        <div class="absolute inset-0"
             style="background: linear-gradient(160deg, #0D0D0D 0%, rgba(13,13,13,0.7) 60%, #0D0D0D 100%);"></div>
      </div>

      <!-- Content -->
      <div class="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <p class="text-xs font-sans tracking-[0.25em] uppercase text-accent mb-8 animate-fade-up">
          Boutique Law Practice
        </p>
        <h1 class="font-serif text-5xl md:text-7xl font-light text-text-primary leading-tight mb-6 animate-fade-up delay-80">
          {{ 'hero.tagline' | translate }}
        </h1>
        <p class="font-sans text-text-secondary text-lg font-light leading-relaxed mb-10 animate-fade-up delay-160">
          {{ 'hero.subhead' | translate }}
        </p>
        <a routerLink="/practice-areas"
           class="btn-gold inline-block no-underline animate-fade-up delay-240">
          {{ 'hero.cta' | translate }}
        </a>
      </div>

      <!-- Scroll indicator -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in delay-240">
        <div class="w-px h-12 bg-accent opacity-40"></div>
      </div>
    </section>

    <!-- Practice areas preview -->
    <section class="py-24 px-6 max-w-7xl mx-auto">
      <div class="mb-16 text-center">
        <p class="text-xs uppercase tracking-[0.2em] text-accent mb-4">{{ 'pa.heading' | translate }}</p>
        <h2 class="font-serif text-4xl font-light text-text-primary">{{ 'pa.subhead' | translate }}</h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5">
        @for (pa of practiceAreas(); track pa.id) {
          <a [routerLink]="['/practice-areas', pa.slug]"
             class="group block bg-bg-base p-10 hover:bg-bg-surface transition-colors border-b border-white/5">
            <div class="flex items-start gap-4">
              <span class="text-2xl">{{ pa.icon_emoji }}</span>
              <div>
                <h3 class="font-serif text-2xl font-light text-text-primary mb-3 group-hover:text-accent transition-colors">
                  {{ pa.title }}
                </h3>
                <p class="font-sans text-sm text-text-secondary leading-relaxed">{{ pa.tagline }}</p>
                <div class="mt-6 flex items-center gap-2 text-xs uppercase tracking-widest text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Learn more</span>
                  <span>→</span>
                </div>
              </div>
            </div>
          </a>
        }
      </div>
    </section>

    <!-- Publications teaser -->
    <section class="py-24 border-t border-white/5" style="background: var(--bg-surface);">
      <div class="px-6 max-w-7xl mx-auto">
        <div class="flex items-end justify-between mb-12">
          <div>
            <p class="text-xs uppercase tracking-[0.2em] text-accent mb-4">{{ 'pub.heading' | translate }}</p>
            <h2 class="font-serif text-4xl font-light text-text-primary">Recent Thought Leadership</h2>
          </div>
          <a routerLink="/publications" class="btn-outline hidden md:block">View All</a>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          @for (pub of recentPubs(); track pub.id) {
            <a [routerLink]="['/publications', pub.slug]"
               class="group block border-t border-white/10 pt-6 hover:border-accent transition-colors">
              <p class="text-xs uppercase tracking-widest text-text-secondary mb-3">{{ pub.published_at | date:'MMM d, yyyy' }}</p>
              <h3 class="font-serif text-xl font-light text-text-primary mb-3 group-hover:text-accent transition-colors leading-snug">
                {{ pub.title }}
              </h3>
              <p class="font-sans text-sm text-text-secondary leading-relaxed line-clamp-3">{{ pub.excerpt }}</p>
            </a>
          }
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-white/10 py-12 px-6">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p class="font-serif text-lg text-text-primary">Wegter Law</p>
        <div class="text-center md:text-right">
          <p class="text-xs text-text-secondary">© 2026 Wegter Law. {{ 'footer.rights' | translate }}</p>
          <p class="text-xs text-text-secondary mt-1 max-w-sm">{{ 'footer.disclaimer' | translate }}</p>
        </div>
      </div>
    </footer>
  `
})
export class HomeComponent implements OnInit {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  practiceAreas = signal<any[]>([]);
  recentPubs = signal<any[]>([]);

  async ngOnInit() {
    await this.loadData(this.translate.currentLang() || 'en');
    this.translate.onLangChange.subscribe(e => this.loadData(e.lang));
  }

  private async loadData(locale: string) {
    try {
      const [pas, pubsRes] = await Promise.all([
        this.api.getPracticeAreas(locale),
        this.api.getPublications({ locale, page: 1 })
      ]);
      this.practiceAreas.set(pas);
      this.recentPubs.set((pubsRes.items || pubsRes || []).slice(0, 3));
    } catch {
      // graceful degradation
    }
  }
}
