import "reflect-metadata";
import app from './app';
import debugLib from 'debug';
import http from 'http';
import { AppDataSource } from './orm/data-source';
import { seedDatabase } from './utils/seeder';

const debug = debugLib('backend:server');

console.log(`[DEBUG] Index file loaded. PID: ${process.pid}`);

const startServer = async () => {
    try {
        console.log(`[DEBUG] Starting server initialization... PID: ${process.pid}`);

        console.log("Initializing Data Source...");
        await AppDataSource.initialize();
        console.log("Data Source has been initialized!");

        console.log("Running database seeder...");
        try {
            await seedDatabase();
            console.log("Database seeding completed.");
        } catch (seedError) {
            console.error("Seeding failed (non-fatal):", seedError);
        }

        const port = normalizePort(process.env.PORT || '3000');
        app.set('port', port);

        const server = http.createServer(app);

        server.listen(port as number, '0.0.0.0');
        server.on('error', (error: any) => onError(error, port));
        server.on('listening', () => onListening(server));
    } catch (err) {
        console.error("FATAL ERROR during server startup:", err);
        process.exit(1);
    }
};

if (require.main === module) {
    startServer().catch(err => {
        console.error("Unhandled error in startServer:", err);
        process.exit(1);
    });
}

function normalizePort(val: string) {
    const port = parseInt(val, 10);
    if (isNaN(port)) return val;
    if (port >= 0) return port;
    return false;
}

function onError(error: any, port: any) {
    if (error.syscall !== 'listen') throw error;
    const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

function onListening(server: http.Server) {
    const addr = server.address();
    const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr?.port;
    debug('Listening on ' + bind);
    console.log('Server listening on ' + bind);
}

