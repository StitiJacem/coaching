import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://localhost:3000/api/admin';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getUsers(filters?: { role?: string; search?: string }): Observable<any[]> {
    let params: any = {};
    if (filters?.role) params.role = filters.role;
    if (filters?.search) params.search = filters.search;

    return this.http.get<any[]>(`${this.apiUrl}/users`, {
      headers: this.getHeaders(),
      params
    });
  }

  updateUserRole(userId: number, newRole: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/role`, { userId, newRole }, {
      headers: this.getHeaders()
    });
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${userId}`, {
      headers: this.getHeaders()
    });
  }

  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`, {
      headers: this.getHeaders()
    });
  }
}
