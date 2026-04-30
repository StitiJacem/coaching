import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';

  constructor(private http: HttpClient) { }

  signup(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup`, user);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        if (response && response.token) {
          localStorage.setItem('auth_token', response.token);
          if (response.user) {
            // Build avatar URL from photo_url
            const user = response.user;
            if (user.photo_url && !user.avatar) {
              user.avatar = user.photo_url.startsWith('http')
                ? user.photo_url
                : `http://localhost:3000${user.photo_url}`;
            }
            localStorage.setItem('user', JSON.stringify(user));
          }
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  verifyEmail(email: string, code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-email`, { email, code });
  }

  resendCode(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/resend-code`, { email });
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, data);
  }
}
