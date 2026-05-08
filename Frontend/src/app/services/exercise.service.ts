import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Exercise {
    id: string;
    name: string;
    target: string;
    secondaryMuscles?: string[];
    instructions?: string[];
    bodyPart: string;
    equipment: string;
    gifUrl: string;
    category: string;
    difficulty: string;
    mechanic: string;
    force: string;
    met: number;
    caloriesPerMinute: number;
    description: string;
}

@Injectable({
    providedIn: 'root'
})
export class ExerciseService {
    private apiUrl = `${environment.apiUrl}/exercises`;
    private baseHost = environment.apiUrl.replace('/api', '');

    constructor(private http: HttpClient) { }

    private resolveGifUrl(ex: Exercise): Exercise {
        if (ex.gifUrl && ex.gifUrl.startsWith('/api')) {
            ex.gifUrl = `${this.baseHost}${ex.gifUrl}`;
        }
        return ex;
    }

    getAllExercises(limit: number = 20): Observable<Exercise[]> {
        return this.http.get<Exercise[]>(`${this.apiUrl}?limit=${limit}`).pipe(
            map(exercises => exercises.map(ex => this.resolveGifUrl(ex)))
        );
    }

    searchExercises(name: string): Observable<Exercise[]> {
        return this.http.get<Exercise[]>(`${this.apiUrl}/search?name=${name}`).pipe(
            map(exercises => exercises.map(ex => this.resolveGifUrl(ex)))
        );
    }

    getByBodyPart(bodyPart: string): Observable<Exercise[]> {
        return this.http.get<Exercise[]>(`${this.apiUrl}/bodypart/${bodyPart}`).pipe(
            map(exercises => exercises.map(ex => this.resolveGifUrl(ex)))
        );
    }

    getById(id: string): Observable<Exercise> {
        return this.http.get<Exercise>(`${this.apiUrl}/${id}`).pipe(
            map(ex => this.resolveGifUrl(ex))
        );
    }
}
