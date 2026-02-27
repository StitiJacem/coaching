import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

export interface ExerciseData {
    id: string;
    name: string;
    target: string;
    bodyPart: string;
    equipment: string;
    gifUrl: string;
}

export class ExerciseService {
    private readonly apiKey = process.env.RAPIDAPI_KEY || 'YOUR_RAPIDAPI_KEY_HERE';
    private readonly apiHost = 'exercisedb.p.rapidapi.com';
    private readonly baseUrl = 'https://exercisedb.p.rapidapi.com/exercises';

    private get headers() {
        return {
            'x-rapidapi-key': this.apiKey,
            'x-rapidapi-host': this.apiHost
        };
    }

    async getAllExercises(limit: number = 20): Promise<ExerciseData[]> {
        try {
            const response = await axios.get(this.baseUrl, {
                params: { limit },
                headers: this.headers
            });
            return response.data;
        } catch (error: any) {
            // Totally silent fallback for development
            return this.getMockExercises();
        }
    }

    async searchExercises(name: string): Promise<ExerciseData[]> {
        try {
            const response = await axios.get(`${this.baseUrl}/name/${name}`, {
                headers: this.headers
            });
            return response.data;
        } catch (error: any) {
            return this.getMockExercises().filter(ex => ex.name.toLowerCase().includes(name.toLowerCase()));
        }
    }

    async getByBodyPart(bodyPart: string): Promise<ExerciseData[]> {
        try {
            const response = await axios.get(`${this.baseUrl}/bodyPart/${bodyPart}`, {
                headers: this.headers
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching body part: ${bodyPart}`, error);
            return [];
        }
    }

    private getMockExercises(): ExerciseData[] {
        return [
            { id: '0001', name: '3/4 sit-up', target: 'abs', bodyPart: 'waist', equipment: 'body weight', gifUrl: 'https://v2.exercisedb.io/image/pYfM1uCjL2e8Vn' },
            { id: '0002', name: '45 degree side bend', target: 'abs', bodyPart: 'waist', equipment: 'body weight', gifUrl: 'https://v2.exercisedb.io/image/z2b6r0wB0i2XvA' },
            { id: '0003', name: 'air bike', target: 'abs', bodyPart: 'waist', equipment: 'body weight', gifUrl: 'https://v2.exercisedb.io/image/f6mN9uCjL2e8Vn' },
            // ... more can be added later or returned from the API
        ];
    }
}
