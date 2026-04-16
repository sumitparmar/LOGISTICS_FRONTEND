import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '../services/api.service';

@Injectable({
  providedIn: 'root',
})
export class MaintenanceGuard implements CanActivate {
  constructor(
    private api: ApiService,
    private router: Router,
  ) {}

  canActivate(): Observable<boolean> {
    return this.api.get<any>('/admin/settings').pipe(
      map((res) => {
        const isMaintenance = res?.data?.maintenanceMode;

        if (isMaintenance) {
          this.router.navigate(['/maintenance']);
          return false;
        }

        return true;
      }),
      catchError(() => {
        return of(true);
      }),
    );
  }
}
