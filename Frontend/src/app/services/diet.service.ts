import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Meal {
  id?: string;
  mealType: string;
  timeOfDay: string;
  instructions: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface DietDay {
  id?: string;
  day_number: number;
  title?: string;
  isRestDay: boolean;
  meals: Meal[];
}

export interface DietPlan {
  id?: string;
  name: string;
  description?: string;
  goal: string;
  isTemplate: boolean;
  athleteId?: number;
  nutritionistProfileId?: string;
  days: DietDay[];
}

export interface DietaryProfile {
  id?: string;
  athleteId: number;
  bmr?: number;
  tdee?: number;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFats?: number;
  allergies?: string[];
  dietaryPreferences?: string[];
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DietService {
  private apiUrl = `${environment.apiUrl}/nutrition`;

  constructor(private http: HttpClient) {}

  // --- Diet Plans ---

  createPlan(planData: Partial<DietPlan>): Observable<DietPlan> {
    return this.http.post<DietPlan>(`${this.apiUrl}/plans`, planData);
  }

  getPlan(planId: string): Observable<DietPlan> {
    return this.http.get<DietPlan>(`${this.apiUrl}/plans/${planId}`);
  }

  saveFullPlan(planId: string, name: string, days: DietDay[]): Observable<DietPlan> {
    return this.http.put<DietPlan>(`${this.apiUrl}/plans/${planId}/build`, { name, days });
  }

  // --- Athlete Side ---

  getAthleteActivePlan(athleteId: number): Observable<DietPlan | null> {
    return this.http.get<DietPlan | null>(`${this.apiUrl}/athletes/${athleteId}/active-plan`);
  }

  getAthleteDietaryProfile(athleteId: number): Observable<DietaryProfile> {
    return this.http.get<DietaryProfile>(`${this.apiUrl}/athletes/${athleteId}/dietary-profile`);
  }

  updateAthleteDietaryProfile(athleteId: number, data: Partial<DietaryProfile>): Observable<DietaryProfile> {
    return this.http.put<DietaryProfile>(`${this.apiUrl}/athletes/${athleteId}/dietary-profile`, data);
  }

  // --- AI & LOGGING ---

  analyzeFood(image: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/ai/analyze-food`, { image });
  }

  logMeal(athleteId: number, logData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/athletes/${athleteId}/log`, logData);
  }

  getTodayLogs(athleteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/athletes/${athleteId}/today-logs`);
  }
}
