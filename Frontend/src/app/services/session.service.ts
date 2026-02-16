import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Session {
  id?: number;
  athleteId: number;
  programId?: number;
  date: Date | string;
  time: string;
  type: string;
  status: string;
  duration?: number;
  notes?: string;
  athlete?: any;
  program?: any;
}

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private apiUrl = 'http://localhost:3000/api/sessions';

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

  getAll(filters?: { athleteId?: number; programId?: number; date?: string; status?: string }): Observable<Session[]> {
    let params: any = {};
    if (filters?.athleteId) params.athleteId = filters.athleteId;
    if (filters?.programId) params.programId = filters.programId;
    if (filters?.date) params.date = filters.date;
    if (filters?.status) params.status = filters.status;

    return this.http.get<Session[]>(this.apiUrl, {
      headers: this.getHeaders(),
      params
    });
  }

  getById(id: number): Observable<Session> {
    return this.http.get<Session>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  create(session: Partial<Session>): Observable<Session> {
    return this.http.post<Session>(this.apiUrl, session, {
      headers: this.getHeaders()
    });
  }

  update(id: number, session: Partial<Session>): Observable<Session> {
    return this.http.put<Session>(`${this.apiUrl}/${id}`, session, {
      headers: this.getHeaders()
    });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  getToday(): Observable<Session[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getAll({ date: today });
  }
}
