import rateLimit from 'express-rate-limit';

export function authRateLimiter(windowMs: number = 15 * 60 * 1000, maxRequests: number = 20) {
    return rateLimit({
        windowMs,
        limit: maxRequests,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: {
            message: 'Too many requests, please try again later.'
        }
    });
}

export function apiRateLimiter(windowMs: number = 15 * 60 * 1000, maxRequests: number = 300) {
    return rateLimit({
        windowMs,
        limit: maxRequests,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: {
            message: 'Too many API requests, please try again later.'
        }
    });
}
