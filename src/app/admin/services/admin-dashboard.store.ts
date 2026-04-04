import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AdminDashboardStore {
  private dashboardSubject = new BehaviorSubject<any>(null);
  dashboard$ = this.dashboardSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadDashboard() {
    this.http.get<any>(`${environment.apiBaseUrl}/admin/dashboard`).subscribe({
      next: (res) => {
        this.dashboardSubject.next(res.data);
      },
      error: (err) => {
        console.error('Dashboard load failed', err);
      },
    });
  }
}
