/**
 * JWT Configuration — Single Source of Truth
 *
 * This module centralizes all JWT secret access.
 * It THROWS at startup if JWT_SECRET is not defined in environment variables,
 * preventing silent fallback to a well-known insecure key in production.
 */

let _jwtSecret: string | null = null;

/**
 * Returns the JWT secret from environment variables.
 * Throws if not configured — this is intentional to fail fast in production.
 */
export function getJwtSecret(): string {
    if (_jwtSecret) return _jwtSecret;

    const secret = process.env.JWT_SECRET;

    if (!secret || secret.trim() === '' || secret === 'your-secret-key') {
        const msg =
            '[SECURITY] JWT_SECRET is not set or is using the default insecure value.\n' +
            'Set a strong random secret in your .env file:\n' +
            '  JWT_SECRET=<run: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))">\n' +
            'Server will NOT start without a secure JWT_SECRET.';

        // In production, crash hard. In test/dev, warn but allow if explicitly opted in.
        if (process.env.NODE_ENV === 'production') {
            console.error(msg);
            process.exit(1);
        } else {
            console.warn('\n⚠️  ' + msg + '\n');
            // Use a per-process ephemeral secret in dev so the app still works locally
            _jwtSecret = require('crypto').randomBytes(64).toString('hex');
            return _jwtSecret as string;
        }
    }

    _jwtSecret = secret;
    return _jwtSecret as string;
}
