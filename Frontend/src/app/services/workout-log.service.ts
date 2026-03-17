import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface WorkoutLog {
    id?: number;
    athleteId: number;
    programId?: number;
    programDayId?: number;
    scheduledDate: Date | string;
    completedAt?: Date | string;
    status: string;
    durationMinutes?: number;
    notes?: string;
    overallRating?: number;
    program?: any;
    programDay?: any;
}

export interface ExerciseLog {
    id?: number;
    workoutLogId: number;
    programExerciseId?: number;
    exercise_name: string;
    exercise_id?: string;
    setsCompleted: number;
    repsPerSet?: number[];
    weightKgPerSet?: number[];
    notes?: string;
}

export interface AthleteWorkoutStats {
    totalSessions: number;
    completedSessions: number;
    missedSessions: number;
    adherencePercent: number;
    currentStreak: number;
    totalMinutes: number;
}

export interface TodayWorkout {
    program: any | null;
    day: any | null;
    workoutLog: WorkoutLog | null;
    athleteId: number | null;
    daysSinceStart: number;
    message?: string;
}

@Injectable({
    providedIn: 'root'
})
export class WorkoutLogService {
    private apiUrl = 'http://localhost:3000/api/workout-logs';
    private programsUrl = 'http://localhost:3000/api/programs';

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

    getTodayWorkout(userId: number): Observable<TodayWorkout> {
        return this.http.get<TodayWorkout>(`${this.programsUrl}/athlete/${userId}/today`, {
            headers: this.getHeaders()
        });
    }

    getAthleteHistory(athleteId: number, limit = 20, offset = 0): Observable<{ logs: WorkoutLog[], total: number }> {
        return this.http.get<{ logs: WorkoutLog[], total: number }>(
            `${this.apiUrl}/athlete/${athleteId}?limit=${limit}&offset=${offset}`, {
            headers: this.getHeaders()
        }
        );
    }

    getAthleteStats(athleteId: number): Observable<AthleteWorkoutStats> {
        return this.http.get<AthleteWorkoutStats>(`${this.apiUrl}/athlete/${athleteId}/stats`, {
            headers: this.getHeaders()
        });
    }

    startWorkout(data: { athleteId: number; programId?: number; programDayId?: number; scheduledDate?: string }): Observable<WorkoutLog> {
        return this.http.post<WorkoutLog>(this.apiUrl, data, { headers: this.getHeaders() });
    }

    completeWorkout(id: number, durationMinutes: number, notes?: string, overallRating?: number): Observable<WorkoutLog> {
        return this.http.put<WorkoutLog>(`${this.apiUrl}/${id}`, {
            status: 'completed',
            durationMinutes,
            notes,
            overallRating
        }, { headers: this.getHeaders() });
    }

    markMissed(id: number): Observable<WorkoutLog> {
        return this.http.put<WorkoutLog>(`${this.apiUrl}/${id}`, { status: 'missed' }, { headers: this.getHeaders() });
    }

    logExercise(workoutLogId: number, data: Partial<ExerciseLog>): Observable<ExerciseLog> {
        return this.http.post<ExerciseLog>(`${this.apiUrl}/${workoutLogId}/exercises`, data, { headers: this.getHeaders() });
    }

    getById(id: number): Observable<WorkoutLog & { exerciseLogs: ExerciseLog[] }> {
        return this.http.get<WorkoutLog & { exerciseLogs: ExerciseLog[] }>(`${this.apiUrl}/${id}`, {
            headers: this.getHeaders()
        });
    }
}
