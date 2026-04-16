import { Injectable } from '@angular/core';
import { AuthService } from 'src/app/core/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  constructor(private authService: AuthService) {}

  private getUser(): any {
    return this.authService.getUser();
  }

  private getPermissions(): string[] {
    const user = this.getUser();

    if (!user?.permissions || !Array.isArray(user.permissions)) {
      return [];
    }

    return user.permissions;
  }

  isAdmin(): boolean {
    return this.getUser()?.role === 'admin';
  }

  isSuperAdmin(): boolean {
    const user = this.getUser();

    return user?.role === 'admin' && !user?.adminRole;
  }

  has(permission: string): boolean {
    if (!this.isAdmin()) return false;

    if (this.isSuperAdmin()) return true;

    return this.getPermissions().includes(permission);
  }

  hasAny(permissions: string[]): boolean {
    return permissions.some((p) => this.has(p));
  }

  hasAll(permissions: string[]): boolean {
    return permissions.every((p) => this.has(p));
  }
}
