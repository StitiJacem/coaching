import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FoodNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodPortion {
  estimate: 'small' | 'medium' | 'large';
  grams: number;
}

export interface FoodAnalysisResult {
  detectedFoods: string[];
  portion: FoodPortion;
  nutrition: FoodNutrition;
  confidence: 'high' | 'medium' | 'low';
  source: string;
  imagePath?: string;
  error?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private apiUrl = 'http://localhost:3000/api/ai';

  constructor(private http: HttpClient) {}

  /**
   * Uploads a food image file and returns the nutritional analysis.
   * Uses multipart/form-data — do NOT set Content-Type manually.
   */
  analyzeFood(imageFile: File): Observable<FoodAnalysisResult> {
    const formData = new FormData();
    formData.append('image', imageFile);

    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : ''
      // Content-Type is intentionally omitted — browser sets it with correct boundary
    });

    return this.http.post<FoodAnalysisResult>(
      `${this.apiUrl}/analyze-food`,
      formData,
      { headers }
    );
  }
}
