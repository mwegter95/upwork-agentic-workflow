import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NavbarComponent } from './components/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <app-navbar />
    <router-outlet />
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: var(--bg-base); }
  `]
})
export class AppComponent implements OnInit {
  private translate = inject(TranslateService);

  ngOnInit() {
    this.translate.addLangs(['en', 'es', 'fr']);
    const saved = localStorage.getItem('sl_lang') || 'en';
    this.translate.use(saved);
  }
}
