import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private apiUrl = 'http://localhost:3000/api/dashboard';

    constructor(
        private http: HttpClient,
        private authService: AuthService
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
        return this.http.get<any[]>(`${this.apiUrl}/sessions/today`, { headers: this.getHeaders() });
    }

    getRecentPRs(role: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/prs/recent?role=${role}`, { headers: this.getHeaders() });
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