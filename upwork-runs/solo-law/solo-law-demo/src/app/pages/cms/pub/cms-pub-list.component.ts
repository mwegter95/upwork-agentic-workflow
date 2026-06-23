import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-cms-pub-list',
  standalone: true,
  imports: [RouterLink, TranslatePipe, TranslateDirective, CommonModule],
  template: `
    <div class="p-8 min-h-screen">
      <div class="flex items-center justify-between mb-8">
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-accent mb-1">{{ 'cms.publications' | translate }}</p>
          <h1 class="font-serif text-3xl font-light text-text-primary">Manage Publications</h1>
        </div>
        <a routerLink="/cms/publications/edit/new" class="btn-gold text-xs">+ {{ 'cms.new' | translate }}</a>
      </div>

      <div class="flex gap-2 mb-6">
        @for (l of ['en','es']; track l) {
          <button (click)="locale.set(l); load()"
                  [class.btn-gold]="locale() === l"
                  [class.btn-ghost]="locale() !== l"
                  class="text-xs">{{ l.toUpperCase() }}</button>
        }
      </div>

      @if (loading()) {
        <div class="flex justify-center py-20">
          <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else {
        <div class="space-y-2">
          @for (pub of items(); track pub.id) {
            <div class="flex items-center justify-between p-5 border border-white/10 hover:border-accent/30 transition-colors"
                 style="background: var(--bg-surface);">
              <div>
                <p class="font-serif text-lg text-text-primary">{{ pub.title }}</p>
                <p class="text-xs text-text-secondary mt-1">{{ pub.published_at | date:'MMM d, yyyy' }} · {{ pub.author }}</p>
              </div>
              <div class="flex gap-2">
                <a [routerLink]="['/cms/publications/edit', pub.id]" class="btn-outline text-xs">{{ 'cms.edit' | translate }}</a>
                <button (click)="delete(pub.id)" class="btn-ghost text-xs text-danger hover:border-danger">{{ 'cms.delete' | translate }}</button>
              </div>
            </div>
          }
          @if (!items().length) {
            <p class="text-text-secondary py-8 text-center">{{ 'cms.no_items' | translate }}</p>
          }
        </div>
      }
    </div>
  `
})
export class CmsPubListComponent implements OnInit {
  private api = inject(ApiService);
  items = signal<any[]>([]);
  loading = signal(true);
  locale = signal('en');

  ngOnInit() { this.load(); }

  async load() {
    this.loading.set(true);
    try { this.items.set(await this.api.cmsGetPublications(this.locale())); }
    catch { this.items.set([]); }
    finally { this.loading.set(false); }
  }

  async delete(id: number) {
    if (!confirm('Delete this publication?')) return;
    await this.api.cmsDeletePublication(id);
    await this.load();
  }
}
