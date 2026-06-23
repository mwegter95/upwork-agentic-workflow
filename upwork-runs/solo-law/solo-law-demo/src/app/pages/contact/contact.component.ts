import { Component, signal } from '@angular/core';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [TranslatePipe, TranslateDirective, FormsModule, CommonModule],
  template: `
    <div class="pt-16 min-h-screen">
      <!-- Header -->
      <div class="py-20 px-6 border-b border-white/10" style="background: var(--bg-surface);">
        <div class="max-w-3xl mx-auto">
          <p class="text-xs uppercase tracking-[0.2em] text-accent mb-4">{{ 'contact.heading' | translate }}</p>
          <h1 class="font-serif text-5xl font-light text-text-primary mb-4">{{ 'contact.subhead' | translate }}</h1>
        </div>
      </div>

      <div class="max-w-2xl mx-auto px-6 py-16">
        @if (!sent()) {
          <form (ngSubmit)="submit()" class="space-y-6 animate-fade-up">
            <div>
              <label class="block text-xs uppercase tracking-widest text-text-secondary mb-2">{{ 'contact.name' | translate }}</label>
              <input type="text" [(ngModel)]="form.name" name="name" required class="sl-input" />
            </div>
            <div>
              <label class="block text-xs uppercase tracking-widest text-text-secondary mb-2">{{ 'contact.email' | translate }}</label>
              <input type="email" [(ngModel)]="form.email" name="email" required class="sl-input" />
            </div>
            <div>
              <label class="block text-xs uppercase tracking-widest text-text-secondary mb-2">{{ 'contact.matter' | translate }}</label>
              <input type="text" [(ngModel)]="form.matter" name="matter" class="sl-input" />
            </div>
            <div>
              <label class="block text-xs uppercase tracking-widest text-text-secondary mb-2">{{ 'contact.message' | translate }}</label>
              <textarea [(ngModel)]="form.message" name="message" rows="6" class="sl-input resize-none"></textarea>
            </div>
            <button type="submit" class="btn-gold w-full">{{ 'contact.send' | translate }}</button>
            <p class="text-xs text-text-secondary text-center">{{ 'contact.disclaimer' | translate }}</p>
          </form>
        } @else {
          <div class="text-center py-16 animate-fade-up">
            <div class="text-accent text-4xl mb-4">✓</div>
            <p class="font-serif text-2xl text-text-primary">{{ 'contact.sent' | translate }}</p>
          </div>
        }
      </div>
    </div>
  `
})
export class ContactComponent {
  form = { name: '', email: '', matter: '', message: '' };
  sent = signal(false);

  submit() {
    // Demo: simulate submission
    this.sent.set(true);
  }
}
