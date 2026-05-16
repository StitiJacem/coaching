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
import aiRoutes from './routes/ai';
import chatRoutes from './routes/chat';
import adminRoutes from './routes/admin';
import sessionRoutes from './routes/sessions';
import stripeRoutes from './routes/stripe';

const app = express();

app.use(logger('dev'));
app.use(cors());

// Webhooks must be parsed as raw body
const rawParser = require('express').raw({ type: 'application/json' });
app.use('/api/stripe/webhook', rawParser);
app.use('/api/stripe', stripeRoutes);

const expressModule = require('express');
app.use(expressModule.json());
app.use(expressModule.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(expressModule.static(path.join(__dirname, '../public')));
app.use('/uploads', expressModule.static(path.join(__dirname, '../public/uploads')));

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

export default app;
