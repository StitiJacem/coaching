import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Athlete } from './athlete.service';

export interface NutritionistProfile {
    id: string;
    userId: number;
    bio?: string;
    profilePicture?: string;
    experience_years: number;
    rating: number;
    total_clients: number;
    verified?: boolean;
    user: {
        first_name: string;
        last_name: string;
        email: string;
    };
}

export interface NutritionConnection {
    id: string;
    athleteId: number;
    nutritionistProfileId: string;
    status: 'pending' | 'accepted' | 'rejected';
    message?: string;
    athlete?: Athlete;
    nutritionistProfile?: NutritionistProfile;
}

@Injectable({
    providedIn: 'root'
})
export class NutritionistService {
    private apiUrl = `${environment.apiUrl}/nutrition`;

    constructor(private http: HttpClient) {}


    getAllNutritionists(): Observable<NutritionistProfile[]> {
        return this.http.get<NutritionistProfile[]>(`${this.apiUrl}/nutritionists`);
    }


    sendConnectionRequest(athleteId: number, nutritionistProfileId: string, message?: string): Observable<NutritionConnection> {
        return this.http.post<NutritionConnection>(`${this.apiUrl}/connection`, {
            athleteId, nutritionistProfileId, message
        });
    }


    getClients(nutritionistProfileId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/nutritionists/${nutritionistProfileId}/clients`);
    }


    getMyRequests(): Observable<NutritionConnection[]> {
        return this.http.get<NutritionConnection[]>(`${this.apiUrl}/my-requests`);
    }


    respondToRequest(connectionId: string, status: 'accepted' | 'rejected'): Observable<NutritionConnection> {
        return this.http.patch<NutritionConnection>(`${this.apiUrl}/connection/${connectionId}`, { status });
    }


    updateProfile(userId: number, data: any): Observable<NutritionistProfile> {
        return this.http.put<NutritionistProfile>(`${this.apiUrl}/nutritionists/${userId}/profile`, data);
    }
}
