import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

// ===== INTERFACES =====

export interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RolesResponse {
  success: boolean;
  data: Role[];
}

export interface SingleRoleResponse {
  success: boolean;
  data: Role;
}

// ===== SERVICE =====

@Injectable({
  providedIn: 'root',
})
export class AdminRolesService {
  private apiUrl = `${environment.apiBaseUrl}/admin/roles`;
  private permissionsUrl = `${environment.apiBaseUrl}/admin/permissions`;
  constructor(private http: HttpClient) {}

  // ===== GET ALL ROLES =====
  getRoles(page: number = 1, limit: number = 10, search: string = '') {
    const params: any = {
      page,
      limit,
    };

    if (search) {
      params.search = search;
    }

    return this.http.get<any>(this.apiUrl, { params });
  }

  // ===== GET SINGLE ROLE =====
  getRoleById(id: string) {
    return this.http.get<SingleRoleResponse>(`${this.apiUrl}/${id}`);
  }

  // ===== CREATE ROLE =====
  createRole(payload: {
    name: string;
    description: string;
    permissions: string[];
  }) {
    return this.http.post<SingleRoleResponse>(this.apiUrl, payload);
  }

  // ===== UPDATE ROLE =====
  updateRole(
    id: string,
    payload: {
      name?: string;
      description?: string;
      permissions?: string[];
    },
  ) {
    return this.http.put<SingleRoleResponse>(`${this.apiUrl}/${id}`, payload);
  }

  // ===== DELETE ROLE =====
  deleteRole(id: string) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getPermissions() {
    return this.http.get<any>(this.permissionsUrl);
  }
}
