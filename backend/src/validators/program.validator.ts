import { z } from 'zod';

const exerciseSchema = z.object({
    exercise_name: z.string().min(1, "Exercise name is required"),
    sets: z.number().int().positive().optional(),
    reps: z.number().int().positive().optional(),
    rest_seconds: z.number().int().nonnegative().optional(),
});

const daySchema = z.object({
    day_number: z.number().int().positive(),
    title: z.string().optional(),
    focus_area: z.string().optional(),
    is_rest_day: z.boolean().optional(),
    exercises: z.array(exerciseSchema).optional(),
});

export const createProgramSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Program name is required"),
        description: z.string().optional(),
        type: z.enum(['strength', 'hypertrophy', 'endurance', 'weight_loss', 'general_fitness', 'custom']).optional(),
        difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
        startDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
        athleteId: z.number().int().positive().optional(),
        days: z.array(daySchema).min(1, "At least one day is required to create a program").optional()
    })
});

export const updateProgramSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Program name is required").optional(),
        description: z.string().optional(),
        type: z.enum(['strength', 'hypertrophy', 'endurance', 'weight_loss', 'general_fitness', 'custom']).optional(),
        difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
        startDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
        status: z.enum(['draft', 'active', 'completed', 'archived', 'assigned', 'pending_acceptance']).optional(),
        days: z.array(daySchema).optional()
    })
});
