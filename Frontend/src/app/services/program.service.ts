import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface ProgramExercise {
  id?: number;
  exercise_id: string;
  exercise_name: string;
  exercise_gif?: string;
  sets: number;
  reps: number;
  rpe?: number;
  rest_seconds?: number;
  order: number;
}

export interface ProgramDay {
  id?: number;
  day_number: number;
  title: string;
  exercises: ProgramExercise[];
}

export interface Program {
  id?: number;
  name: string;
  description?: string;
  athleteId?: number;
  coachId: number;
  status: string;
  startDate: Date | string;
  endDate?: Date | string;
  type?: string;
  athlete?: any;
  coach?: any;
  days: ProgramDay[];
}

@Injectable({
  providedIn: 'root'
})
export class ProgramService {
  private apiUrl = 'http://localhost:3000/api/programs';

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

  getAll(filters?: { coachId?: number; athleteId?: number; status?: string }): Observable<Program[]> {
    let params: any = {};
    if (filters?.coachId) params.coachId = filters.coachId;
    if (filters?.athleteId) params.athleteId = filters.athleteId;
    if (filters?.status) params.status = filters.status;

    return this.http.get<Program[]>(this.apiUrl, {
      headers: this.getHeaders(),
      params
    });
  }

  getById(id: number): Observable<Program> {
    return this.http.get<Program>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  create(program: Partial<Program>): Observable<Program> {
    return this.http.post<Program>(this.apiUrl, program, {
      headers: this.getHeaders()
    });
  }

  update(id: number, program: Partial<Program>): Observable<Program> {
    return this.http.put<Program>(`${this.apiUrl}/${id}`, program, {
      headers: this.getHeaders()
    });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }
}
