import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

export interface ExerciseData {
    id: string;
    name: string;
    bodyPart: string;
    equipment: string;
    target: string;
    secondaryMuscles?: string[];
    instructions?: string[];
    gifUrl: string;
    category: string;
    difficulty: string;
    mechanic: string;
    force: string;
    met: number;
    caloriesPerMinute: number;
    description: string;
}

const BODY_PART_ALIASES: Record<string, string[]> = {
    'chest': ['chest'],
    'back': ['back'],
    'upper legs': ['upper legs', 'legs', 'quads', 'hamstrings', 'glutes'],
    'lower legs': ['lower legs', 'calves'],
    'shoulders': ['shoulders'],
    'upper arms': ['upper arms', 'arms', 'biceps', 'triceps'],
    'lower arms': ['lower arms', 'forearms'],
    'waist': ['waist', 'abs', 'core'],
    'cardio': ['cardio'],
    'neck': ['neck'],
};

export class ExerciseService {
    private readonly workoutXKey = process.env.WORKOUTX_API_KEY || 'wx_628a805f4e4ff753270efd2f64a2d4a2e95930ed71af37543868bdad';
    private _libraryCache: ExerciseData[] = [];
    private _cacheTimestamp: number = 0;
    private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
    private _isFetching = false;

    private async _ensureLibraryLoaded(): Promise<void> {
        if (this._libraryCache.length > 0 && (Date.now() - this._cacheTimestamp < this.CACHE_TTL_MS)) {
            return;
        }

        if (this._isFetching) {
           
            await new Promise(resolve => setTimeout(resolve, 500));
            if (this._libraryCache.length > 0) return;
        }

        this._isFetching = true;
        try {
            console.log('[ExerciseService] Fetching library from WorkoutX API...');
            const response = await axios.get('https://api.workoutxapp.com/v1/exercises?limit=2000', {
                headers: { 'X-WorkoutX-Key': this.workoutXKey }
            });
            
            if (response.data && Array.isArray(response.data.data)) {
                this._libraryCache = response.data.data.map((ex: any) => ({
                    ...ex,
                    gifUrl: `/api/exercises/gif/${ex.id}`
                }));
                this._cacheTimestamp = Date.now();
                console.log(`[ExerciseService] Successfully loaded ${this._libraryCache.length} exercises into cache.`);
            } else {
                console.warn('[ExerciseService] Invalid response format from WorkoutX API');
            }
        } catch (error: any) {
            console.error('[ExerciseService] Failed to load from WorkoutX API:', error?.message);
        } finally {
            this._isFetching = false;
        }
    }

    async getAllExercises(limit: number = 50): Promise<ExerciseData[]> {
        await this._ensureLibraryLoaded();
        return this._libraryCache.slice(0, limit);
    }

    async searchExercises(name: string): Promise<ExerciseData[]> {
        await this._ensureLibraryLoaded();
        if (!name || name.trim() === '') return this.getAllExercises();
        
        const q = name.toLowerCase().trim();
        return this._libraryCache.filter(ex =>
            ex.name?.toLowerCase().includes(q) ||
            ex.target?.toLowerCase().includes(q) ||
            ex.equipment?.toLowerCase().includes(q) ||
            ex.bodyPart?.toLowerCase().includes(q)
        );
    }

    async getByBodyPart(bodyPart: string): Promise<ExerciseData[]> {
        await this._ensureLibraryLoaded();
        if (bodyPart === 'ALL') return this.getAllExercises();
        
        const bp = bodyPart.toLowerCase();

        for (const [canonical, aliases] of Object.entries(BODY_PART_ALIASES)) {
            if (aliases.includes(bp) || canonical === bp) {
                return this._libraryCache.filter(ex => ex.bodyPart?.toLowerCase() === canonical);
            }
        }

        return this._libraryCache.filter(ex => ex.bodyPart?.toLowerCase().includes(bp));
    }

    async getById(id: string): Promise<ExerciseData | null> {
        await this._ensureLibraryLoaded();
        return this._libraryCache.find(ex => ex.id === id) ?? null;
    }
}
