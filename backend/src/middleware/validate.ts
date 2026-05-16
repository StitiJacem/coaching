import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

/**
 * Middleware to validate incoming requests against a Zod schema.
 * Sends a 400 Bad Request with detailed errors if validation fails.
 */
export const validate = (schema: AnyZodObject) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error: any) {
            if (error instanceof ZodError) {
                const errorMessages = error.errors.map((err: any) => ({
                    field: err.path.join('.'),
                    message: err.message
                }));
                return res.status(400).json({
                    message: "Validation failed",
                    errors: errorMessages
                });
            }
            return res.status(500).json({ message: "Internal server error during validation" });
        }
    };
};
