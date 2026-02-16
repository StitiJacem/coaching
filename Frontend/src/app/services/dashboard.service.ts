import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { AthleteService } from './athlete.service';

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private apiUrl = 'http://localhost:3000/api/dashboard';

    constructor(
        private http: HttpClient,
        private authService: AuthService,
        private sessionService: SessionService,
        private athleteService: AthleteService
    ) { }

    private getHeaders(): HttpHeaders {
        const token = this.authService.getToken();
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });
    }

    getStats(role: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/stats?role=${role}`, { headers: this.getHeaders() });
    }

    getTodaySessions(): Observable<any> {
        // Use the session service to get today's sessions with proper formatting
        return this.sessionService.getToday().pipe(
            map(sessions => sessions.map(session => ({
                id: session.id,
                time: session.time,
                athlete: session.athlete?.user 
                    ? `${session.athlete.user.first_name} ${session.athlete.user.last_name}`
                    : 'Unknown',
                type: session.type,
                status: session.status,
                date: session.date
            })))
        );
    }

    getRecentAthletes(): Observable<any> {
        return this.http.get<any[]>(`${this.apiUrl}/athletes/recent`, { headers: this.getHeaders() }).pipe(
            map((athletes: any[]) => athletes.map(athlete => ({
                id: athlete.id,
                name: athlete.name,
                program: athlete.program || 'No Program',
                lastActive: athlete.lastActive,
                avatar: athlete.avatar,
                status: this.getAthleteStatus(athlete.lastActive)
            })))
        );
    }

    private getAthleteStatus(lastActive: any): 'online' | 'offline' {
        if (!lastActive) return 'offline';
        const lastActiveDate = new Date(lastActive);
        const now = new Date();
        const hoursSinceActive = (now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60);
        return hoursSinceActive < 2 ? 'online' : 'offline';
    }
}