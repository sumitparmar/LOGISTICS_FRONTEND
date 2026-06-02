import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AdminUsersService {
  private apiUrl = `${environment.apiBaseUrl}/admin/users`;
  constructor(private http: HttpClient) {}

  getUsers(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    status: string = '',
  ) {
    let params = new HttpParams().set('page', page).set('limit', limit);

    if (search) {
      params = params.set('search', search);
    }

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<any>(this.apiUrl, { params });
  }

  getUserById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  updateUser(id: string, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, payload);
  }

  createUser(payload: any) {
    return this.http.post<any>(this.apiUrl, payload);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  getRoles() {
    return this.http.get(`${environment.apiBaseUrl}/admin/roles`);
  }

  assignRole(payload: { userId: string; roleId: string }) {
    return this.http.post(
      `${environment.apiBaseUrl}/admin/users/assign-role`,
      payload,
    );
  }

  removeRole(userId: string) {
    return this.http.patch(
      `${environment.apiBaseUrl}/admin/users/${userId}/remove-role`,
      {},
    );
  }
}
