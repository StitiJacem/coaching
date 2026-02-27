import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Exercise {
    id: string;
    name: string;
    target: string;
    bodyPart: string;
    equipment: string;
    gifUrl: string;
}

@Injectable({
    providedIn: 'root'
})
export class ExerciseService {
    private apiUrl = 'http://localhost:3000/api/exercises';

    constructor(private http: HttpClient) { }

    getAllExercises(limit: number = 20): Observable<Exercise[]> {
        return this.http.get<Exercise[]>(`${this.apiUrl}?limit=${limit}`);
    }

    searchExercises(name: string): Observable<Exercise[]> {
        return this.http.get<Exercise[]>(`${this.apiUrl}/search?name=${name}`);
    }

    getByBodyPart(bodyPart: string): Observable<Exercise[]> {
        return this.http.get<Exercise[]>(`${this.apiUrl}/bodypart/${bodyPart}`);
    }
}
