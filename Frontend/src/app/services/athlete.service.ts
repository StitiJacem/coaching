import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Athlete {
  id?: number;
  userId: number;
  age?: number;
  height?: number;
  weight?: number;
  sport?: string;
  goals?: string;
  profilePicture?: string;
  lastActive?: Date | string;
  user?: {
    id: number;
    first_name?: string;
    last_name?: string;
    email: string;
    avatar?: string;
  };
}

export interface AthleteStats {
  totalPrograms: number;
  totalSessions: number;
  completedSessions: number;
  activeGoals: number;
  adherence: number;
}

@Injectable({
  providedIn: 'root'
})
export class AthleteService {
  private apiUrl = 'http://localhost:3000/api/athletes';

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

  getAll(filters?: { search?: string; sport?: string }): Observable<Athlete[]> {
    let params: any = {};
    if (filters?.search) params.search = filters.search;
    if (filters?.sport) params.sport = filters.sport;

    return this.http.get<Athlete[]>(this.apiUrl, {
      headers: this.getHeaders(),
      params
    });
  }

  invite(email: string, message?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/invite`, { email, message }, {
      headers: this.getHeaders()
    });
  }

  getById(id: number): Observable<Athlete> {
    return this.http.get<Athlete>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  update(id: number, athlete: Partial<Athlete>): Observable<Athlete> {
    return this.http.put<Athlete>(`${this.apiUrl}/${id}`, athlete, {
      headers: this.getHeaders()
    });
  }

  getStats(id: number): Observable<AthleteStats> {
    return this.http.get<AthleteStats>(`${this.apiUrl}/${id}/stats`, {
      headers: this.getHeaders()
    });
  }
}
