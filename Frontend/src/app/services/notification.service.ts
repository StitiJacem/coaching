import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Notification {
    id: number;
    userId: number;
    type: string;
    title: string;
    body?: string;
    payload?: Record<string, unknown>;
    read: boolean;
    created_at: string;
}

export interface NotificationsResponse {
    notifications: Notification[];
    total: number;
    limit: number;
    offset: number;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private apiUrl = 'http://localhost:3000/api/notifications';

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

    getAll(limit = 20, offset = 0, unreadOnly = false): Observable<NotificationsResponse> {
        let params: any = { limit, offset };
        if (unreadOnly) params.unread = 'true';
        return this.http.get<NotificationsResponse>(this.apiUrl, {
            headers: this.getHeaders(),
            params
        });
    }

    markRead(ids: number[]): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.apiUrl}/read`, { ids }, {
            headers: this.getHeaders()
        });
    }
}
