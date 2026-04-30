import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

// ─── Interfaces aligned with backend entities ────────────────────────────────

export interface Meal {
    id?: string;
    dietDayId?: string;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    timeOfDay: string;
    instructions: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    order?: number;
}

export interface DietDay {
    id?: string;
    dietPlanId?: string;
    day_number: number;
    title?: string;
    isRestDay: boolean;
    meals: Meal[];
}

export interface DietPlan {
    id?: string;
    name: string;
    description?: string;
    goal: 'bulking' | 'cutting' | 'maintenance' | 'performance' | 'custom';
    isTemplate: boolean;
    nutritionistProfileId?: string;
    athleteId?: number;
    startDate?: string;
    days: DietDay[];
    nutritionistProfile?: {
        id: string;
        user: { first_name: string; last_name: string };
    };
    athlete?: {
        id: number;
        user: { first_name: string; last_name: string };
    };
    created_at?: string;
}

export interface MealLog {
    id?: string;
    athleteId?: number;
    foodName: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    mealType?: string;
    imagePath?: string;
    loggedAt?: string | Date;
}

export interface MacroTotals {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
}

export interface MacroCompliance {
    athleteId: number;
    hasPlan: boolean;
    planId?: string;
    planName?: string;
    date: string | Date;
    todayDay?: DietDay | null;
    target: MacroTotals;
    actual: MacroTotals;
    percent?: {
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
    };
}

export interface ClientCompliance {
    hasPlan: boolean;
    planId?: string;
    planName?: string;
    todayDay?: DietDay | null;
    target: MacroTotals | null;
    actual: MacroTotals;
    logs: MealLog[];
    percent?: {
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
    };
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable({
    providedIn: 'root'
})
export class NutritionService {
    private apiUrl = `${environment.apiUrl}/api/nutrition`;

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

    // ── Connection Management ──────────────────────────────────────────────────
    respondToConnectionRequest(connectionId: string, status: 'accepted' | 'rejected'): Observable<any> {
        return this.http.patch(`${this.apiUrl}/connection/${connectionId}`, { status }, {
            headers: this.getHeaders()
        });
    }

    // ── Diet Plans ────────────────────────────────────────────────────────────

    createPlan(plan: Partial<DietPlan>): Observable<DietPlan> {
        return this.http.post<DietPlan>(`${this.apiUrl}/plans`, plan, {
            headers: this.getHeaders()
        });
    }

    getPlan(planId: string): Observable<DietPlan> {
        return this.http.get<DietPlan>(`${this.apiUrl}/plans/${planId}`, {
            headers: this.getHeaders()
        });
    }

    saveFullPlan(planId: string, name: string, days: DietDay[]): Observable<DietPlan> {
        return this.http.put<DietPlan>(`${this.apiUrl}/plans/${planId}/build`, { name, days }, {
            headers: this.getHeaders()
        });
    }

    getMyNutritionistPlans(): Observable<DietPlan[]> {
        return this.http.get<DietPlan[]>(`${this.apiUrl}/my-plans`, {
            headers: this.getHeaders()
        });
    }

    // ── Athlete Endpoints ─────────────────────────────────────────────────────

    getAthleteActivePlan(athleteId: number): Observable<DietPlan | null> {
        return this.http.get<DietPlan | null>(`${this.apiUrl}/athletes/${athleteId}/active-plan`, {
            headers: this.getHeaders()
        });
    }

    getCompliance(athleteId: number, date?: string): Observable<MacroCompliance> {
        let params = new HttpParams();
        if (date) params = params.set('date', date);
        return this.http.get<MacroCompliance>(`${this.apiUrl}/athletes/${athleteId}/compliance`, {
            headers: this.getHeaders(),
            params
        });
    }

    getTodayLogs(athleteId: number): Observable<MealLog[]> {
        return this.http.get<MealLog[]>(`${this.apiUrl}/athletes/${athleteId}/today-logs`, {
            headers: this.getHeaders()
        });
    }

    getLogsByDate(athleteId: number, date?: string): Observable<MealLog[]> {
        let params = new HttpParams();
        if (date) params = params.set('date', date);
        return this.http.get<MealLog[]>(`${this.apiUrl}/athletes/${athleteId}/logs-by-date`, {
            headers: this.getHeaders(),
            params
        });
    }

    logMeal(athleteId: number, logData: Partial<MealLog>): Observable<MealLog> {
        return this.http.post<MealLog>(`${this.apiUrl}/athletes/${athleteId}/log`, logData, {
            headers: this.getHeaders()
        });
    }

    deleteMealLog(athleteId: number, logId: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/athletes/${athleteId}/log/${logId}`, {
            headers: this.getHeaders()
        });
    }

    // ── Nutritionist Client Management ────────────────────────────────────────

    getClients(nutritionistProfileId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/nutritionists/${nutritionistProfileId}/clients`, {
            headers: this.getHeaders()
        });
    }

    getClientPlans(nutritionistProfileId: string, athleteId: number): Observable<DietPlan[]> {
        return this.http.get<DietPlan[]>(`${this.apiUrl}/nutritionists/${nutritionistProfileId}/clients/${athleteId}/plans`, {
            headers: this.getHeaders()
        });
    }

    getClientCompliance(nutritionistProfileId: string, athleteId: number, date?: string): Observable<ClientCompliance> {
        let params = new HttpParams();
        if (date) params = params.set('date', date);
        return this.http.get<ClientCompliance>(`${this.apiUrl}/nutritionists/${nutritionistProfileId}/clients/${athleteId}/compliance`, {
            headers: this.getHeaders(),
            params
        });
    }

    // ── Nutritionist Profile ──────────────────────────────────────────────────

    getMyProfile(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/nutritionists/me/profile`, {
            headers: this.getHeaders()
        });
    }

    getAllNutritionists(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/nutritionists`, {
            headers: this.getHeaders()
        });
    }

    sendConnectionRequest(nutritionistProfileId: string, message?: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/connection`, { nutritionistProfileId, message }, {
            headers: this.getHeaders()
        });
    }

    getMyRequests(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/my-requests`, {
            headers: this.getHeaders()
        });
    }

    respondToRequest(connectionId: string, status: 'accepted' | 'rejected'): Observable<any> {
        return this.http.patch<any>(`${this.apiUrl}/connection/${connectionId}`, { status }, {
            headers: this.getHeaders()
        });
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    getPercent(actual: number, target: number): number {
        if (!target || target === 0) return 0;
        return Math.min(Math.round((actual / target) * 100), 100);
    }
}
