import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface NutritionPlanDay {
    id?: string;
    dayName: string;
    caloriesTarget: number;
    proteinTarget: number;
    carbsTarget: number;
    fatTarget: number;
    notes?: string;
}

export interface NutritionPlan {
    id?: string;
    athleteId: number;
    nutritionistId?: number;
    name: string;
    description?: string;
    startDate: string | Date;
    endDate?: string | Date;
    isActive?: boolean;
    days: NutritionPlanDay[];
    athlete?: any;
}

export interface MealLog {
    id?: string;
    athleteId?: number;
    mealName: string;
    logTime: string | Date;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    foodItems?: string;
}


export interface MacroCompliance {
    athleteId: number;
    planName: string;
    date: string | Date;
    target: NutritionPlanDay;
    actual: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
}

@Injectable({
    providedIn: 'root'
})
export class NutritionService {
    private apiUrl = 'http://localhost:3000/api/diet';

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


    createPlan(plan: NutritionPlan): Observable<NutritionPlan> {
        return this.http.post<NutritionPlan>(`${this.apiUrl}/plans`, plan, {
            headers: this.getHeaders()
        });
    }

    getMyActivePlan(): Observable<NutritionPlan> {
        return this.http.get<NutritionPlan>(`${this.apiUrl}/my-plan`, {
            headers: this.getHeaders()
        });
    }

    getNutritionistPlans(): Observable<NutritionPlan[]> {
        return this.http.get<NutritionPlan[]>(`${this.apiUrl}/nutritionist/plans`, {
            headers: this.getHeaders()
        });
    }


    logMeal(log: MealLog): Observable<MealLog> {
        return this.http.post<MealLog>(`${this.apiUrl}/logs`, log, {
            headers: this.getHeaders()
        });
    }

    getLogs(athleteId?: number): Observable<MealLog[]> {
        const url = athleteId ? `${this.apiUrl}/logs/${athleteId}` : `${this.apiUrl}/logs`;
        return this.http.get<MealLog[]>(url, {
            headers: this.getHeaders()
        });
    }

    getCompliance(athleteId: number): Observable<MacroCompliance> {
        return this.http.get<MacroCompliance>(`${this.apiUrl}/compliance/${athleteId}`, {
            headers: this.getHeaders()
        });
    }
}
