import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { PermissionService } from 'src/app/admin/services/permission.service';

@Injectable({
  providedIn: 'root',
})
export class PermissionGuard implements CanActivate {
  constructor(
    private permissionService: PermissionService,
    private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const permission = route.data['permission'];

    if (!permission) {
      return true;
    }

    if (this.permissionService.has(permission)) {
      return true;
    }

    this.router.navigate(['/admin']);
    return false;
  }
}
