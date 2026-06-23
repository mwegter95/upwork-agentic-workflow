import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateDirective, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-pub-list',
  standalone: true,
  imports: [RouterLink, TranslatePipe, TranslateDirective, CommonModule, FormsModule],
  template: `
    <div class="pt-16 min-h-screen">
      <!-- Header -->
      <div class="py-20 px-6 border-b border-white/10" style="background: var(--bg-surface);">
        <div class="max-w-7xl mx-auto">
          <p class="text-xs uppercase tracking-[0.2em] text-accent mb-4">{{ 'pub.heading' | translate }}</p>
          <h1 class="font-serif text-5xl font-light text-text-primary">Thought Leadership</h1>
        </div>
      </div>

      <div class="max-w-7xl mx-auto py-16 px-6">
        <!-- Filter bar -->
        <div class="flex flex-wrap gap-3 mb-12">
          @for (f of filters; track f.value) {
            <button (click)="setFilter(f.value)"
                    [class.btn-gold]="activeFilter() === f.value"
                    [class.btn-ghost]="activeFilter() !== f.value"
                    class="text-xs">
              {{ f.label | translate }}
            </button>
          }
        </div>

        @if (loading()) {
          <div class="flex justify-center py-20">
            <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        } @else {
          <div class="space-y-0 divide-y divide-white/5">
            @for (pub of publications(); track pub.id) {
              <a [routerLink]="['/publications', pub.slug]"
                 class="group grid grid-cols-1 md:grid-cols-4 gap-4 py-8 hover:bg-bg-surface px-4 -mx-4 transition-colors">
                <div class="md:col-span-1">
                  <p class="text-xs text-text-secondary font-mono">{{ pub.published_at | date:'MMM d, yyyy' }}</p>
                  <p class="text-xs text-accent mt-1 uppercase tracking-widest">{{ pub.author }}</p>
                </div>
                <div class="md:col-span-3">
                  <h2 class="font-serif text-2xl font-light text-text-primary mb-3 group-hover:text-accent transition-colors leading-snug">
                    {{ pub.title }}
                  </h2>
                  <p class="font-sans text-sm text-text-secondary leading-relaxed">{{ pub.excerpt }}</p>
                  <p class="mt-4 text-xs uppercase tracking-widest text-accent flex items-center gap-2">
                    <span>{{ 'pub.read_more' | translate }}</span><span>→</span>
                  </p>
                </div>
              </a>
            }
          </div>

          @if (!publications().length) {
            <p class="text-text-secondary text-center py-20">No publications found.</p>
          }
        }
      </div>
    </div>
  `
})
export class PubListComponent implements OnInit {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  publications = signal<any[]>([]);
  loading = signal(true);
  activeFilter = signal('all');

  filters = [
    { value: 'all', label: 'pub.filter_all' },
    { value: 'articles', label: 'pub.filter_articles' },
    { value: 'alerts', label: 'pub.filter_alerts' },
    { value: 'news', label: 'pub.filter_news' },
  ];

  setFilter(value: string) {
    this.activeFilter.set(value);
    this.load(this.translate.currentLang() || 'en');
  }

  async ngOnInit() {
    await this.load(this.translate.currentLang() || 'en');
    this.translate.onLangChange.subscribe(e => this.load(e.lang));
  }

  private async load(locale: string) {
    this.loading.set(true);
    try {
      const res = await this.api.getPublications({ locale });
      const items = res.items || res || [];
      this.publications.set(items);
    } catch { this.publications.set([]); }
    finally { this.loading.set(false); }
  }
}
