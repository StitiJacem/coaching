import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface CoachOverview {
    period: string;
    totalAthletes: number;
    totalWorkouts: number;
    completedWorkouts: number;
    adherencePercent: number;
    totalVolumeMinutes: number;
    maxStreak: number;
}

export interface AthleteProgress {
    athleteId: number;
    period: string;
    totalWorkouts: number;
    completedWorkouts: number;
    adherencePercent: number;
    totalVolumeMinutes: number;
    currentStreak: number;
    weeklyBreakdown: { week: number; label: string; completed: number; minutes: number }[];
}

@Injectable({
    providedIn: 'root'
})
export class ReportService {
    private apiUrl = 'http://localhost:3000/api/reports';

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

    getCoachOverview(): Observable<CoachOverview> {
        return this.http.get<CoachOverview>(`${this.apiUrl}/coach/overview`, {
            headers: this.getHeaders()
        });
    }

    getAthleteProgress(athleteId: number): Observable<AthleteProgress> {
        return this.http.get<AthleteProgress>(`${this.apiUrl}/athlete/${athleteId}/progress`, {
            headers: this.getHeaders()
        });
    }
}
