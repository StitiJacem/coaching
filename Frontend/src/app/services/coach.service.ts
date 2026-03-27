import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Coach {
    id: string;
    name: string;
    avatar: string;
    specializations: string[];
    bio: string;
    rating: number;
    price?: number;
    experience_years: number;
    verified: boolean;
}

export interface CoachingRequest {
    id?: string;
    athleteId: number;
    coachProfileId: string;
    status: 'pending' | 'accepted' | 'rejected';
    message?: string;
    created_at?: Date;
    coachProfile?: any;
    athlete?: any;
    initiator?: 'coach' | 'athlete';
}

@Injectable({
    providedIn: 'root'
})
export class CoachService {
    private coachUrl = 'http://localhost:3000/api/coaches';
    private requestUrl = 'http://localhost:3000/api/coaching-requests';

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

    getCoaches(specialization?: string): Observable<Coach[]> {
        let url = this.coachUrl;
        if (specialization && specialization !== 'ALL') {
            url += `?specialization=${specialization}`;
        }
        return this.http.get<Coach[]>(url, { headers: this.getHeaders() });
    }

    getById(id: string): Observable<Coach> {
        return this.http.get<Coach>(`${this.coachUrl}/${id}`, { headers: this.getHeaders() });
    }

    getMyRequests(): Observable<CoachingRequest[]> {
        return this.http.get<CoachingRequest[]>(`${this.requestUrl}/me`, { headers: this.getHeaders() });
    }

    sendConnectionRequest(coachProfileId: string, message?: string): Observable<any> {
        return this.http.post(this.requestUrl, { coachProfileId, message }, { headers: this.getHeaders() });
    }

    getAthleteRequests(athleteId: number): Observable<CoachingRequest[]> {
        return this.http.get<CoachingRequest[]>(`${this.requestUrl}/athlete/${athleteId}`, { headers: this.getHeaders() });
    }

    getCoachRequests(coachProfileId: string): Observable<CoachingRequest[]> {
        return this.http.get<CoachingRequest[]>(`${this.requestUrl}/coach/${coachProfileId}`, { headers: this.getHeaders() });
    }

    updateRequestStatus(requestId: string, status: 'accepted' | 'rejected'): Observable<any> {
        return this.http.patch(`${this.requestUrl}/${requestId}`, { status }, { headers: this.getHeaders() });
    }

    terminateConnection(requestId: string): Observable<any> {
        return this.http.delete(`${this.requestUrl}/${requestId}`, { headers: this.getHeaders() });
    }

    disconnectAthlete(athleteId: number): Observable<any> {
        return this.http.delete(`${this.requestUrl}/disconnect-athlete/${athleteId}`, { headers: this.getHeaders() });
    }

    updateProfile(data: any): Observable<any> {
        return this.http.put(`${this.coachUrl}/me`, data, { headers: this.getHeaders() });
    }
}
