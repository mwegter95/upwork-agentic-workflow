import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'practice-areas',
    loadComponent: () => import('./pages/practice-areas/pa-list.component').then(m => m.PaListComponent)
  },
  {
    path: 'practice-areas/:slug',
    loadComponent: () => import('./pages/practice-areas/pa-detail.component').then(m => m.PaDetailComponent)
  },
  {
    path: 'publications',
    loadComponent: () => import('./pages/publications/pub-list.component').then(m => m.PubListComponent)
  },
  {
    path: 'publications/:slug',
    loadComponent: () => import('./pages/publications/pub-detail.component').then(m => m.PubDetailComponent)
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent)
  },
  {
    path: 'cms/login',
    loadComponent: () => import('./pages/cms/login/cms-login.component').then(m => m.CmsLoginComponent)
  },
  {
    path: 'cms',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/cms/cms-shell.component').then(m => m.CmsShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/cms/dashboard/cms-dashboard.component').then(m => m.CmsDashboardComponent)
      },
      {
        path: 'practice-areas',
        loadComponent: () => import('./pages/cms/pa/cms-pa-list.component').then(m => m.CmsPaListComponent)
      },
      {
        path: 'practice-areas/edit/:id',
        loadComponent: () => import('./pages/cms/pa/cms-pa-edit.component').then(m => m.CmsPaEditComponent)
      },
      {
        path: 'publications',
        loadComponent: () => import('./pages/cms/pub/cms-pub-list.component').then(m => m.CmsPubListComponent)
      },
      {
        path: 'publications/edit/:id',
        loadComponent: () => import('./pages/cms/pub/cms-pub-edit.component').then(m => m.CmsPubEditComponent)
      },
      {
        path: 'brand-assets',
        loadComponent: () => import('./pages/cms/brand/cms-brand.component').then(m => m.CmsBrandComponent)
      },
      {
        path: 'i18n',
        loadComponent: () => import('./pages/cms/i18n/cms-i18n.component').then(m => m.CmsI18nComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];
