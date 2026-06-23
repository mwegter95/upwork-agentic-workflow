import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { lastValueFrom } from 'rxjs';

export const API_BASE = 'https://api.michaelwegter.com/solo-law';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private authHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  // Health
  health() { return lastValueFrom(this.http.get(`${API_BASE}/health`)); }

  // Practice Areas (public)
  getPracticeAreas(locale = 'en') {
    return lastValueFrom(this.http.get<any[]>(`${API_BASE}/practice-areas?locale=${locale}`));
  }
  getPracticeArea(slug: string, locale = 'en') {
    return lastValueFrom(this.http.get<any>(`${API_BASE}/practice-areas/${slug}?locale=${locale}`));
  }

  // Publications (public)
  getPublications(params: {locale?: string; practice_area?: string; page?: number} = {}) {
    const q = new URLSearchParams({
      locale: params.locale || 'en',
      ...(params.practice_area ? { practice_area: params.practice_area } : {}),
      page: String(params.page || 1),
    });
    return lastValueFrom(this.http.get<any>(`${API_BASE}/publications?${q}`));
  }
  getPublication(slug: string, locale = 'en') {
    return lastValueFrom(this.http.get<any>(`${API_BASE}/publications/${slug}?locale=${locale}`));
  }

  // Brand assets (public)
  getBrandAssets() {
    return lastValueFrom(this.http.get<any[]>(`${API_BASE}/brand-assets`));
  }

  // CMS – Practice Areas
  cmsGetPracticeAreas(locale = 'en') {
    return lastValueFrom(this.http.get<any[]>(`${API_BASE}/cms/practice-areas?locale=${locale}`, { headers: this.authHeaders() }));
  }
  cmsGetPracticeArea(id: number) {
    return lastValueFrom(this.http.get<any>(`${API_BASE}/cms/practice-areas/${id}`, { headers: this.authHeaders() }));
  }
  cmsCreatePracticeArea(data: any) {
    return lastValueFrom(this.http.post<any>(`${API_BASE}/cms/practice-areas`, data, { headers: this.authHeaders() }));
  }
  cmsUpdatePracticeArea(id: number, data: any) {
    return lastValueFrom(this.http.put<any>(`${API_BASE}/cms/practice-areas/${id}`, data, { headers: this.authHeaders() }));
  }
  cmsDeletePracticeArea(id: number) {
    return lastValueFrom(this.http.delete<any>(`${API_BASE}/cms/practice-areas/${id}`, { headers: this.authHeaders() }));
  }

  // CMS – Publications
  cmsGetPublications(locale = 'en') {
    return lastValueFrom(this.http.get<any[]>(`${API_BASE}/cms/publications?locale=${locale}`, { headers: this.authHeaders() }));
  }
  cmsGetPublication(id: number) {
    return lastValueFrom(this.http.get<any>(`${API_BASE}/cms/publications/${id}`, { headers: this.authHeaders() }));
  }
  cmsCreatePublication(data: any) {
    return lastValueFrom(this.http.post<any>(`${API_BASE}/cms/publications`, data, { headers: this.authHeaders() }));
  }
  cmsUpdatePublication(id: number, data: any) {
    return lastValueFrom(this.http.put<any>(`${API_BASE}/cms/publications/${id}`, data, { headers: this.authHeaders() }));
  }
  cmsDeletePublication(id: number) {
    return lastValueFrom(this.http.delete<any>(`${API_BASE}/cms/publications/${id}`, { headers: this.authHeaders() }));
  }

  // CMS – Brand Assets
  cmsCreateBrandAsset(data: any) {
    return lastValueFrom(this.http.post<any>(`${API_BASE}/cms/brand-assets`, data, { headers: this.authHeaders() }));
  }
  cmsDeleteBrandAsset(id: number) {
    return lastValueFrom(this.http.delete<any>(`${API_BASE}/cms/brand-assets/${id}`, { headers: this.authHeaders() }));
  }

  // CMS – i18n
  getI18nStrings(locale = 'en') {
    return lastValueFrom(this.http.get<any>(`${API_BASE}/i18n?locale=${locale}`));
  }
  cmsUpsertI18n(data: any) {
    return lastValueFrom(this.http.post<any>(`${API_BASE}/cms/i18n`, data, { headers: this.authHeaders() }));
  }

  // Dashboard
  cmsDashboardStats() {
    return lastValueFrom(this.http.get<any>(`${API_BASE}/cms/stats`, { headers: this.authHeaders() }));
  }
}
