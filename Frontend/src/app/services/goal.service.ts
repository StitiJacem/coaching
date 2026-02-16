import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Goal {
  id?: number;
  athleteId: number;
  name: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  deadline?: Date | string;
  status: string;
  athlete?: any;
}

@Injectable({
  providedIn: 'root'
})
export class GoalService {
  private apiUrl = 'http://localhost:3000/api/goals';

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

  getAll(filters?: { athleteId?: number; status?: string }): Observable<Goal[]> {
    let params: any = {};
    if (filters?.athleteId) params.athleteId = filters.athleteId;
    if (filters?.status) params.status = filters.status;

    return this.http.get<Goal[]>(this.apiUrl, {
      headers: this.getHeaders(),
      params
    });
  }

  getById(id: number): Observable<Goal> {
    return this.http.get<Goal>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  create(goal: Partial<Goal>): Observable<Goal> {
    return this.http.post<Goal>(this.apiUrl, goal, {
      headers: this.getHeaders()
    });
  }

  update(id: number, goal: Partial<Goal>): Observable<Goal> {
    return this.http.put<Goal>(`${this.apiUrl}/${id}`, goal, {
      headers: this.getHeaders()
    });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }
}
