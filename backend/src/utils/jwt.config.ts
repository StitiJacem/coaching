

let _jwtSecret: string | null = null;


export function getJwtSecret(): string {
    if (_jwtSecret) return _jwtSecret;

    const secret = process.env.JWT_SECRET;

    if (!secret || secret.trim() === '' || secret === 'your-secret-key') {
        const msg =
            '[SECURITY] JWT_SECRET is not set or is using the default insecure value.\n' +
            'Set a strong random secret in your .env file:\n' +
            '  JWT_SECRET=<run: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))">\n' +
            'Server will NOT start without a secure JWT_SECRET.';

        
        if (process.env.NODE_ENV === 'production') {
            console.error(msg);
            process.exit(1);
        } else {
            console.warn('\n⚠️  ' + msg + '\n');
            _jwtSecret = require('crypto').randomBytes(64).toString('hex');
            return _jwtSecret as string;
        }
    }

    _jwtSecret = secret;
    return _jwtSecret as string;
}
