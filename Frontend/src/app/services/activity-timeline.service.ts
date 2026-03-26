import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface ActivityEvent {
    id: number;
    athleteId: number;
    type: string;
    payload?: Record<string, unknown>;
    created_at: string;
}

export interface TimelineResponse {
    events: ActivityEvent[];
    total: number;
    limit: number;
    offset: number;
    context?: {
        assignedProgramsPending: number;
        hasActiveProgram: boolean;
        recentWorkouts: { id: number; scheduledDate: string; status: string; programId?: number }[];
    };
}

@Injectable({
    providedIn: 'root'
})
export class ActivityTimelineService {
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

    getTimeline(athleteId: number, limit = 50, offset = 0): Observable<TimelineResponse> {
        return this.http.get<TimelineResponse>(
            `${this.apiUrl}/${athleteId}/timeline?limit=${limit}&offset=${offset}`,
            { headers: this.getHeaders() }
        );
    }

    createEvent(athleteId: number, type: string, payload?: Record<string, unknown>): Observable<ActivityEvent> {
        return this.http.post<ActivityEvent>(
            `${this.apiUrl}/${athleteId}/events`,
            { type, payload },
            { headers: this.getHeaders() }
        );
    }
}
