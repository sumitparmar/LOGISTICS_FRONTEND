import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AdminUsersService {
  private apiUrl = `${environment.apiBaseUrl}/admin/users`;
  constructor(private http: HttpClient) {}

  getUsers(page: number = 1, limit: number = 10, search: string = '') {
    let url = `${this.apiUrl}?page=${page}&limit=${limit}`;

    if (search) {
      url += `&search=${search}`;
    }

    return this.http.get<any>(url);
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
}
