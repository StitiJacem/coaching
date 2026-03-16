import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

export interface ExerciseData {
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

// ─── Comprehensive Built-in Exercise Library ─────────────────────────────────
// Free, embedded, no API key required. GIF URLs from exercisedb.io public CDN.
const EXERCISE_LIBRARY: ExerciseData[] = [
    // Chest
    { id: 'chest_01', name: 'Barbell Bench Press', target: 'pectorals', bodyPart: 'chest', equipment: 'barbell', gifUrl: 'https://v2.exercisedb.io/image/9QuWpBSUXO9L-n', videoId: 'rT7DgCr-3pg', videoTitle: 'Barbell Bench Press - Proper Form' },
    { id: 'chest_02', name: 'Incline Dumbbell Press', target: 'pectorals', bodyPart: 'chest', equipment: 'dumbbell', gifUrl: 'https://v2.exercisedb.io/image/ceGa88Dp2hYYEX', videoId: 'IP4oeKh1Sd4', videoTitle: 'Incline Dumbbell Press Tutorial' },
    { id: 'chest_03', name: 'Push-Up', target: 'pectorals', bodyPart: 'chest', equipment: 'body weight', gifUrl: 'https://v2.exercisedb.io/image/iD3SkPdqBqSbsX', videoId: '_l3ySVKYVJ8', videoTitle: 'Perfect Push-Up Form' },
    { id: 'chest_04', name: 'Cable Fly', target: 'pectorals', bodyPart: 'chest', equipment: 'cable', gifUrl: 'https://v2.exercisedb.io/image/XKsxBSfSoEYL7N', videoId: 'Iwe6AmxVf7o', videoTitle: 'Cable Fly - Chest Exercise' },
    { id: 'chest_05', name: 'Dumbbell Fly', target: 'pectorals', bodyPart: 'chest', equipment: 'dumbbell', gifUrl: 'https://v2.exercisedb.io/image/tHtTnkAWCE-sek', videoId: 'eozdVDA78K0', videoTitle: 'Dumbbell Fly Proper Form' },
    { id: 'chest_06', name: 'Dips', target: 'pectorals', bodyPart: 'chest', equipment: 'body weight', gifUrl: 'https://v2.exercisedb.io/image/cxdcmqPgXIqJMb', videoId: 'yew6BTFGAU8', videoTitle: 'Chest Dips - Proper Technique' },
    { id: 'chest_07', name: 'Decline Bench Press', target: 'pectorals', bodyPart: 'chest', equipment: 'barbell', gifUrl: 'https://v2.exercisedb.io/image/lPNGa2j2lFqklS', videoId: 'LfyQBUKR8SE', videoTitle: 'Decline Barbell Bench Press' },

    // Back
    { id: 'back_01', name: 'Deadlift', target: 'spine', bodyPart: 'back', equipment: 'barbell', gifUrl: 'https://v2.exercisedb.io/image/PpAIMTFsrAZv7a', videoId: 'op9kVnSso6Q', videoTitle: 'Deadlift - Perfect Form Tutorial' },
    { id: 'back_02', name: 'Pull-Up', target: 'lats', bodyPart: 'back', equipment: 'body weight', gifUrl: 'https://v2.exercisedb.io/image/OiKsC25s4VjQFl', videoId: 'eGo4IYlbE5g', videoTitle: 'Pull-Ups - Proper Form Guide' },
    { id: 'back_03', name: 'Barbell Row', target: 'upper back', bodyPart: 'back', equipment: 'barbell', gifUrl: 'https://v2.exercisedb.io/image/w-C3WRRfJMSvYJ', videoId: 'FWJR5Ve8bnQ', videoTitle: 'Barbell Bent Over Row' },
    { id: 'back_04', name: 'Lat Pulldown', target: 'lats', bodyPart: 'back', equipment: 'cable', gifUrl: 'https://v2.exercisedb.io/image/xMBUQZPjLvW-J_', videoId: 'CAwf7n6Luuc', videoTitle: 'Lat Pulldown Proper Form' },
    { id: 'back_05', name: 'Seated Cable Row', target: 'upper back', bodyPart: 'back', equipment: 'cable', gifUrl: 'https://v2.exercisedb.io/image/GrVjSOe_DYPEbM', videoId: 'GZbfZ033f74', videoTitle: 'Seated Cable Row Tutorial' },
    { id: 'back_06', name: 'Dumbbell Row', target: 'upper back', bodyPart: 'back', equipment: 'dumbbell', gifUrl: 'https://v2.exercisedb.io/image/Xnl8N-h4AAnqA7', videoId: 'pYcpY20QaE8', videoTitle: 'One-Arm Dumbbell Row' },
    { id: 'back_07', name: 'Face Pull', target: 'delts', bodyPart: 'back', equipment: 'cable', gifUrl: 'https://v2.exercisedb.io/image/f4lOhFtrlhfMFd', videoId: '0Po47vvj9g4', videoTitle: 'Face Pull - Shoulder Health' },

    // Upper Legs / Legs
    { id: 'legs_01', name: 'Barbell Squat', target: 'quads', bodyPart: 'upper legs', equipment: 'barbell', gifUrl: 'https://v2.exercisedb.io/image/pYfM1uCjL2e8Vn', videoId: 'bEv6CCg2BC8', videoTitle: 'Barbell Back Squat Proper Form' },
    { id: 'legs_02', name: 'Romanian Deadlift', target: 'hamstrings', bodyPart: 'upper legs', equipment: 'barbell', gifUrl: 'https://v2.exercisedb.io/image/CuFKuX2llJq2IM', videoId: 'JCXUYuzwNrM', videoTitle: 'Romanian Deadlift Tutorial' },
    { id: 'legs_03', name: 'Leg Press', target: 'quads', bodyPart: 'upper legs', equipment: 'machine', gifUrl: 'https://v2.exercisedb.io/image/6cba2k3Fhd6MrC', videoId: 'IZxyjW7MPJQ', videoTitle: 'Leg Press - Proper Form' },
    { id: 'legs_04', name: 'Bulgarian Split Squat', target: 'quads', bodyPart: 'upper legs', equipment: 'dumbbell', gifUrl: 'https://v2.exercisedb.io/image/9UF3k3GmRlqPW2', videoId: 'vEJMmjSlGHo', videoTitle: 'Bulgarian Split Squat Tutorial' },
    { id: 'legs_05', name: 'Leg Extension', target: 'quads', bodyPart: 'upper legs', equipment: 'machine', gifUrl: 'https://v2.exercisedb.io/image/pnT3JH8b0T8pde', videoId: 'ljO4jkFAQrE', videoTitle: 'Leg Extension Machine' },
    { id: 'legs_06', name: 'Leg Curl', target: 'hamstrings', bodyPart: 'upper legs', equipment: 'machine', gifUrl: 'https://v2.exercisedb.io/image/YRiXBqzQ0L0sBK', videoId: '_OhkwVSHQn0', videoTitle: 'Lying Leg Curl Proper Form' },
    { id: 'legs_07', name: 'Goblet Squat', target: 'quads', bodyPart: 'upper legs', equipment: 'dumbbell', gifUrl: 'https://v2.exercisedb.io/image/pjBaT5Oy3SZ3fE', videoId: 'CcmvgDJzMTE', videoTitle: 'Goblet Squat Tutorial' },

    // Lower Legs
    { id: 'calves_01', name: 'Standing Calf Raise', target: 'calves', bodyPart: 'lower legs', equipment: 'body weight', gifUrl: 'https://v2.exercisedb.io/image/z2b6r0wB0i2XvA', videoId: 'gwLzBJYoWlI', videoTitle: 'Standing Calf Raise Form' },
    { id: 'calves_02', name: 'Seated Calf Raise', target: 'calves', bodyPart: 'lower legs', equipment: 'machine', gifUrl: 'https://v2.exercisedb.io/image/N1FIOlhcUzDzDW', videoId: 'JbyjNymZOt0', videoTitle: 'Seated Calf Raise Tutorial' },
    { id: 'calves_03', name: 'Jump Rope', target: 'calves', bodyPart: 'lower legs', equipment: 'body weight', gifUrl: 'https://v2.exercisedb.io/image/WDN0gLAVp-eLpS', videoId: 'hCuXYrYDjSE', videoTitle: 'Jump Rope Technique' },

    // Shoulders
    { id: 'shoulders_01', name: 'Overhead Press', target: 'delts', bodyPart: 'shoulders', equipment: 'barbell', gifUrl: 'https://v2.exercisedb.io/image/lPNGa2j2lFqklS', videoId: '_RlRDWO2jfg', videoTitle: 'Barbell Overhead Press Form' },
    { id: 'shoulders_02', name: 'Dumbbell Lateral Raise', target: 'delts', bodyPart: 'shoulders', equipment: 'dumbbell', gifUrl: 'https://v2.exercisedb.io/image/AcKEeQfD3TemAL', videoId: '3VcKaXpzqRo', videoTitle: 'Lateral Raise - Shoulder Exercise' },
    { id: 'shoulders_03', name: 'Arnold Press', target: 'delts', bodyPart: 'shoulders', equipment: 'dumbbell', gifUrl: 'https://v2.exercisedb.io/image/u3MDsOdgN4G7eH', videoId: '6Z15_WdXmVw', videoTitle: 'Arnold Press Tutorial' },
    { id: 'shoulders_04', name: 'Front Raise', target: 'delts', bodyPart: 'shoulders', equipment: 'dumbbell', gifUrl: 'https://v2.exercisedb.io/image/v76leh1mz0tI8d', videoId: 'PDFRsCbBGGM', videoTitle: 'Front Raise Proper Form' },
    { id: 'shoulders_05', name: 'Reverse Fly', target: 'delts', bodyPart: 'shoulders', equipment: 'dumbbell', gifUrl: 'https://v2.exercisedb.io/image/f4lOhFtrlhfMFd', videoId: 'ttvfGg9d76c', videoTitle: 'Reverse Fly Exercise' },
    { id: 'shoulders_06', name: 'Upright Row', target: 'delts', bodyPart: 'shoulders', equipment: 'barbell', gifUrl: 'https://v2.exercisedb.io/image/w-C3WRRfJMSvYJ', videoId: 'um3VQTOJjN8', videoTitle: 'Barbell Upright Row' },

    // Upper Arms
    { id: 'arms_01', name: 'Barbell Curl', target: 'biceps', bodyPart: 'upper arms', equipment: 'barbell', gifUrl: 'https://v2.exercisedb.io/image/XKsxBSfSoEYL7N', videoId: 'kwG2ipFRgfo', videoTitle: 'Barbell Curl Proper Form' },
    { id: 'arms_02', name: 'Tricep Pushdown', target: 'triceps', bodyPart: 'upper arms', equipment: 'cable', gifUrl: 'https://v2.exercisedb.io/image/iD3SkPdqBqSbsX', videoId: '2-LAMcpzODU', videoTitle: 'Tricep Pushdown Tutorial' },
    { id: 'arms_03', name: 'Hammer Curl', target: 'biceps', bodyPart: 'upper arms', equipment: 'dumbbell', gifUrl: 'https://v2.exercisedb.io/image/ceGa88Dp2hYYEX', videoId: 'zC3nLlEvin4', videoTitle: 'Hammer Curl Form' },
    { id: 'arms_04', name: 'Skull Crusher', target: 'triceps', bodyPart: 'upper arms', equipment: 'barbell', gifUrl: 'https://v2.exercisedb.io/image/tHtTnkAWCE-sek', videoId: 'd_KpJMKFMcc', videoTitle: 'Skull Crusher - Triceps Exercise' },
    { id: 'arms_05', name: 'Concentration Curl', target: 'biceps', bodyPart: 'upper arms', equipment: 'dumbbell', gifUrl: 'https://v2.exercisedb.io/image/cxdcmqPgXIqJMb', videoId: 'Jvj2wV0vOYU', videoTitle: 'Concentration Curl' },
    { id: 'arms_06', name: 'Overhead Tricep Extension', target: 'triceps', bodyPart: 'upper arms', equipment: 'dumbbell', gifUrl: 'https://v2.exercisedb.io/image/GrVjSOe_DYPEbM', videoId: '_gsUck-7M74', videoTitle: 'Overhead Tricep Extension' },
    { id: 'arms_07', name: 'Preacher Curl', target: 'biceps', bodyPart: 'upper arms', equipment: 'barbell', gifUrl: 'https://v2.exercisedb.io/image/xMBUQZPjLvW-J_', videoId: 'fIWP-FRFNU0', videoTitle: 'Preacher Curl Tutorial' },

    // Lower Arms
    { id: 'forearms_01', name: 'Wrist Curl', target: 'forearms', bodyPart: 'lower arms', equipment: 'barbell', gifUrl: 'https://v2.exercisedb.io/image/OiKsC25s4VjQFl', videoId: 'FWJR5Ve8bnQ', videoTitle: 'Wrist Curl Exercise' },
    { id: 'forearms_02', name: 'Reverse Wrist Curl', target: 'forearms', bodyPart: 'lower arms', equipment: 'barbell', gifUrl: 'https://v2.exercisedb.io/image/Xnl8N-h4AAnqA7', videoId: 'PMMSer0t-gs', videoTitle: 'Reverse Wrist Curl' },
    { id: 'forearms_03', name: 'Farmer Walk', target: 'forearms', bodyPart: 'lower arms', equipment: 'dumbbell', gifUrl: 'https://v2.exercisedb.io/image/w-C3WRRfJMSvYJ', videoId: 'rCRkWbJwIRE', videoTitle: 'Farmer Walk Exercise' },

    // Waist / Abs
    { id: 'abs_01', name: 'Plank', target: 'abs', bodyPart: 'waist', equipment: 'body weight', gifUrl: 'https://v2.exercisedb.io/image/f6mN9uCjL2e8Vn', videoId: 'B296mZDhrP4', videoTitle: 'Perfect Plank Form' },
    { id: 'abs_02', name: 'Crunch', target: 'abs', bodyPart: 'waist', equipment: 'body weight', gifUrl: 'https://v2.exercisedb.io/image/pYfM1uCjL2e8Vn', videoId: 'Xyd_fa5zoEU', videoTitle: 'Crunches - Proper Form' },
    { id: 'abs_03', name: 'Russian Twist', target: 'abs', bodyPart: 'waist', equipment: 'body weight', gifUrl: 'https://v2.exercisedb.io/image/CuFKuX2llJq2IM', videoId: 'JyUqwkVpsi8', videoTitle: 'Russian Twist Tutorial' },
    { id: 'abs_04', name: 'Leg Raise', target: 'abs', bodyPart: 'waist', equipment: 'body weight', gifUrl: 'https://v2.exercisedb.io/image/6cba2k3Fhd6MrC', videoId: 'l4kQd9eWclE', videoTitle: 'Hanging Leg Raise' },
    { id: 'abs_05', name: 'Cable Crunch', target: 'abs', bodyPart: 'waist', equipment: 'cable', gifUrl: 'https://v2.exercisedb.io/image/9UF3k3GmRlqPW2', videoId: 'AV5Ph6Dpbbs', videoTitle: 'Cable Crunch Tutorial' },
    { id: 'abs_06', name: 'Mountain Climber', target: 'abs', bodyPart: 'waist', equipment: 'body weight', gifUrl: 'https://v2.exercisedb.io/image/pnT3JH8b0T8pde', videoId: 'wQq3ybaLZeA', videoTitle: 'Mountain Climbers Proper Form' },
    { id: 'abs_07', name: 'Ab Wheel Rollout', target: 'abs', bodyPart: 'waist', equipment: 'wheel', gifUrl: 'https://v2.exercisedb.io/image/YRiXBqzQ0L0sBK', videoId: 'l358gPml4YA', videoTitle: 'Ab Wheel Rollout Tutorial' },
    { id: 'abs_08', name: 'Bicycle Crunch', target: 'abs', bodyPart: 'waist', equipment: 'body weight', gifUrl: 'https://v2.exercisedb.io/image/pjBaT5Oy3SZ3fE', videoId: '1we3bh9uhqY', videoTitle: 'Bicycle Crunch Proper Form' },

    // Cardio
    { id: 'cardio_01', name: 'Treadmill Run', target: 'cardiovascular system', bodyPart: 'cardio', equipment: 'cardio', gifUrl: 'https://v2.exercisedb.io/image/WDN0gLAVp-eLpS', videoId: 'zy7euMFvW7Q', videoTitle: 'Treadmill Running Form' },
    { id: 'cardio_02', name: 'Jump Rope', target: 'cardiovascular system', bodyPart: 'cardio', equipment: 'body weight', gifUrl: 'https://v2.exercisedb.io/image/z2b6r0wB0i2XvA', videoId: 'hCuXYrYDjSE', videoTitle: 'Jump Rope Workout Tutorial' },
    { id: 'cardio_03', name: 'Burpee', target: 'cardiovascular system', bodyPart: 'cardio', equipment: 'body weight', gifUrl: 'https://v2.exercisedb.io/image/N1FIOlhcUzDzDW', videoId: 'qLBImHhCXSw', videoTitle: 'How To Do A Burpee' },
    { id: 'cardio_04', name: 'Box Jump', target: 'cardiovascular system', bodyPart: 'cardio', equipment: 'body weight', gifUrl: 'https://v2.exercisedb.io/image/AcKEeQfD3TemAL', videoId: 'hxldG9BNabg', videoTitle: 'Box Jump Technique' },
    { id: 'cardio_05', name: 'Rowing Machine', target: 'cardiovascular system', bodyPart: 'cardio', equipment: 'cardio', gifUrl: 'https://v2.exercisedb.io/image/u3MDsOdgN4G7eH', videoId: 'H0r_jPpGFP0', videoTitle: 'Rowing Machine Proper Form' },
    { id: 'cardio_06', name: 'Jumping Jacks', target: 'cardiovascular system', bodyPart: 'cardio', equipment: 'body weight', gifUrl: 'https://v2.exercisedb.io/image/v76leh1mz0tI8d', videoId: 'iSSAk4XCsRA', videoTitle: 'Jumping Jacks Exercise' },
    { id: 'cardio_07', name: 'Battle Ropes', target: 'cardiovascular system', bodyPart: 'cardio', equipment: 'band', gifUrl: 'https://v2.exercisedb.io/image/lPNGa2j2lFqklS', videoId: 'TtHXhwFYUew', videoTitle: 'Battle Rope Workout' },

    // Neck
    { id: 'neck_01', name: 'Neck Flex', target: 'levator scapulae', bodyPart: 'neck', equipment: 'body weight', gifUrl: 'https://v2.exercisedb.io/image/9QuWpBSUXO9L-n', videoId: 'hOnVMVvz0dY', videoTitle: 'Neck Stretch Exercise' },
    { id: 'neck_02', name: 'Scapular Shrug', target: 'upper traps', bodyPart: 'neck', equipment: 'body weight', gifUrl: 'https://v2.exercisedb.io/image/PpAIMTFsrAZv7a', videoId: 'FgYoc4O-cF4', videoTitle: 'Scapular Shrug Tutorial' },
    { id: 'neck_03', name: 'Barbell Shrug', target: 'upper traps', bodyPart: 'neck', equipment: 'barbell', gifUrl: 'https://v2.exercisedb.io/image/w-C3WRRfJMSvYJ', videoId: 'NAqCVe2mwzM', videoTitle: 'Barbell Shrug Proper Form' },
];

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

// ─── Exercise Service ────────────────────────────────────────────────────────

export class ExerciseService {
    private readonly youtubeKey = process.env.YOUTUBE_API_KEY || '';
    // Additional video cache for on-demand lookups
    private videoCache: Map<string, { videoId: string; videoTitle: string; cachedAt: number }> = new Map();
    private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000;

    // ─── YouTube On-Demand Video Lookup ──────────────────────────────────────

    async getYoutubeVideoId(exerciseName: string): Promise<{ videoId: string; videoTitle: string } | null> {
        if (!this.youtubeKey) return null;
        const cached = this.videoCache.get(exerciseName);
        if (cached && Date.now() - cached.cachedAt < this.CACHE_TTL_MS) {
            return { videoId: cached.videoId, videoTitle: cached.videoTitle };
        }
        try {
            const query = `${exerciseName} exercise tutorial proper form`;
            const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
                params: {
                    part: 'snippet', q: query, type: 'video', maxResults: 1,
                    videoDuration: 'short', relevanceLanguage: 'en', safeSearch: 'strict',
                    key: this.youtubeKey
                }
            });
            const items = response.data?.items;
            if (items?.length > 0) {
                const video = items[0];
                const result = { videoId: video.id.videoId, videoTitle: video.snippet.title, cachedAt: Date.now() };
                this.videoCache.set(exerciseName, result);
                return { videoId: result.videoId, videoTitle: result.videoTitle };
            }
        } catch (err: any) {
            if (err?.response?.status === 403) console.warn('[YouTube] Quota exceeded or invalid key.');
        }
        return null;
    }

    async getVideoForExercise(exerciseName: string): Promise<{ videoId?: string; videoTitle?: string }> {
        // First check if we have it built-in
        const builtIn = EXERCISE_LIBRARY.find(e => e.name.toLowerCase() === exerciseName.toLowerCase());
        if (builtIn?.videoId) return { videoId: builtIn.videoId, videoTitle: builtIn.videoTitle };
        // Fall back to YouTube API
        const result = await this.getYoutubeVideoId(exerciseName);
        return result ?? {};
    }

    // ─── Query Methods ────────────────────────────────────────────────────────

    async getAllExercises(limit: number = 20): Promise<ExerciseData[]> {
        return EXERCISE_LIBRARY.slice(0, limit);
    }

    async searchExercises(name: string): Promise<ExerciseData[]> {
        const q = name.toLowerCase();
        return EXERCISE_LIBRARY.filter(ex =>
            ex.name.toLowerCase().includes(q) ||
            ex.target.toLowerCase().includes(q) ||
            ex.equipment.toLowerCase().includes(q)
        );
    }

    async getByBodyPart(bodyPart: string): Promise<ExerciseData[]> {
        const bp = bodyPart.toLowerCase();
        // Try aliases first
        for (const [canonical, aliases] of Object.entries(BODY_PART_ALIASES)) {
            if (aliases.includes(bp) || canonical === bp) {
                return EXERCISE_LIBRARY.filter(ex => ex.bodyPart === canonical);
            }
        }
        // Fallback: direct match
        return EXERCISE_LIBRARY.filter(ex => ex.bodyPart.toLowerCase().includes(bp));
    }

    async getById(id: string): Promise<ExerciseData | null> {
        return EXERCISE_LIBRARY.find(ex => ex.id === id) ?? null;
    }
}
