import "reflect-metadata";
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import path from 'path';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import athleteRoutes from './routes/athletes';
import programRoutes from './routes/programs';
import goalRoutes from './routes/goals';
import exerciseRoutes from './routes/exercises';
import workoutLogRoutes from './routes/workoutLogs';
import coachRoutes from './routes/coaches';
import coachingRequestRoutes from './routes/coachingRequests';
import notificationRoutes from './routes/notifications';
import reportRoutes from './routes/reports';
import userRoutes from './routes/users';
import dietRoutes from './routes/diet';
import nutritionRoutes from './routes/nutrition';
import aiRoutes from './routes/ai';
import chatRoutes from './routes/chat';
import adminRoutes from './routes/admin';
import sessionRoutes from './routes/sessions';
import { apiRateLimiter } from './middleware/rateLimiter';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(logger(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true
}));

app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '1mb' }));
app.use(express.urlencoded({ extended: false, limit: process.env.URLENCODED_BODY_LIMIT || '1mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads'), {
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
    immutable: process.env.NODE_ENV === 'production'
}));

app.use('/api', apiRateLimiter());

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/athletes', athleteRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/workout-logs', workoutLogRoutes);
app.use('/api/coaches', coachRoutes);
app.use('/api/coaching-requests', coachingRequestRoutes);
app.use('/api/notifications', notificationRoutes);

app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/diet', dietRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sessions', sessionRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Global Error Handler:", err);
    if (res.headersSent) {
        return next(err);
    }
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
});

export default app;
