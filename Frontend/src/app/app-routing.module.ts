import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { SignupComponent } from './pages/signup/signup.component';
import { VerifyEmailComponent } from './pages/verify-email/verify-email.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AthletesComponent } from './pages/dashboard/athletes/athletes.component';
import { ProgramsComponent } from './pages/dashboard/programs/programs.component';
import { ExercisesComponent } from './pages/dashboard/exercises/exercises.component';
import { GoalsComponent } from './pages/dashboard/goals/goals.component';
import { SessionsComponent } from './pages/dashboard/sessions/sessions.component';
import { AppointmentsComponent } from './pages/dashboard/appointments/appointments.component';
import { MessagingComponent } from './pages/dashboard/messaging/messaging.component';
import { AnalyticsComponent } from './pages/dashboard/analytics/analytics.component';
import { NutritionComponent } from './pages/dashboard/nutrition/nutrition.component';
import { MedicalComponent } from './pages/dashboard/medical/medical.component';
import { DiscoveryComponent } from './pages/dashboard/discovery/discovery.component';
import { WorkoutPlayerComponent } from './pages/dashboard/workout-player/workout-player.component';
import { WorkoutHistoryComponent } from './pages/dashboard/workout-history/workout-history.component';
import { MyCoachesComponent } from './pages/dashboard/coaches/my-coaches.component';
import { TrainingCalendarComponent } from './pages/dashboard/athletes/training-calendar/training-calendar.component';

import { CompleteProfileComponent } from './pages/complete-profile/complete-profile.component';
import { AthleteScheduleComponent } from './pages/dashboard/athlete-schedule/athlete-schedule.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'complete-profile', component: CompleteProfileComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'dashboard/athletes', component: AthletesComponent },
  { path: 'dashboard/programs', component: ProgramsComponent },
  { path: 'dashboard/exercises', component: ExercisesComponent },
  { path: 'dashboard/goals', component: GoalsComponent },
  { path: 'dashboard/sessions', component: SessionsComponent },
  { path: 'dashboard/appointments', component: AppointmentsComponent },
  { path: 'dashboard/messaging', component: MessagingComponent },
  { path: 'dashboard/analytics', component: AnalyticsComponent },
  { path: 'dashboard/nutrition', component: NutritionComponent },
  { path: 'dashboard/medical', component: MedicalComponent },
  { path: 'dashboard/discovery', component: DiscoveryComponent },
  { path: 'dashboard/coaches', component: MyCoachesComponent },
  { path: 'dashboard/athletes/:id/calendar', component: TrainingCalendarComponent },
  { path: 'dashboard/program-preview/:id', component: TrainingCalendarComponent },
  { path: 'dashboard/master-planner', component: TrainingCalendarComponent },
  { path: 'dashboard/master-planner/:id', component: TrainingCalendarComponent },
  { path: 'dashboard/workout/:id', component: WorkoutPlayerComponent },
  { path: 'dashboard/workout-history', component: WorkoutHistoryComponent },
  { path: 'dashboard/schedule', component: AthleteScheduleComponent },
  { path: 'home', component: HomeComponent },
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
