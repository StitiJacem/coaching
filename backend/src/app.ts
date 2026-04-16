import "reflect-metadata";
import express from 'express';
import cors from 'cors';
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


const app = express();

app.use(logger('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

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


export default app;
