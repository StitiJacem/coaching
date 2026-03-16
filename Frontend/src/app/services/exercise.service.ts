import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Exercise {
    id: string;
    name: string;
    target: string;
    secondaryMuscles?: string[];
    instructions?: string[];
    bodyPart: string;
    equipment: string;
    gifUrl: string;
    videoId?: string;
    videoTitle?: string;
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

    getById(id: string): Observable<Exercise> {
        return this.http.get<Exercise>(`${this.apiUrl}/${id}`);
    }

    getVideoForExercise(name: string): Observable<{ videoId?: string; videoTitle?: string }> {
        return this.http.get<{ videoId?: string; videoTitle?: string }>(`${this.apiUrl}/video?name=${encodeURIComponent(name)}`);
    }
}
