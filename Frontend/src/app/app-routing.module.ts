import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
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
import { TimelineComponent } from './pages/dashboard/timeline/timeline.component';
import { ProfileComponent } from './pages/dashboard/profile/profile.component';
import { CompleteProfileComponent } from './pages/complete-profile/complete-profile.component';
import { AthleteScheduleComponent } from './pages/dashboard/athlete-schedule/athlete-schedule.component';
import { ProfileViewComponent } from './pages/dashboard/profile-view/profile-view.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'welcome', component: CompleteProfileComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'dashboard/athletes', component: AthletesComponent, canActivate: [authGuard] },
  { path: 'dashboard/programs', component: ProgramsComponent, canActivate: [authGuard] },
  { path: 'dashboard/exercises', component: ExercisesComponent, canActivate: [authGuard] },
  { path: 'dashboard/goals', component: GoalsComponent, canActivate: [authGuard] },
  { path: 'dashboard/sessions', component: SessionsComponent, canActivate: [authGuard] },
  { path: 'dashboard/appointments', component: AppointmentsComponent, canActivate: [authGuard] },
  { path: 'dashboard/messaging', component: MessagingComponent, canActivate: [authGuard] },
  { path: 'dashboard/analytics', component: AnalyticsComponent, canActivate: [authGuard] },
  { path: 'dashboard/nutrition', component: NutritionComponent, canActivate: [authGuard] },
  { path: 'dashboard/medical', component: MedicalComponent, canActivate: [authGuard] },
  { path: 'dashboard/discovery', component: DiscoveryComponent, canActivate: [authGuard] },
  { path: 'dashboard/coaches', component: MyCoachesComponent, canActivate: [authGuard] },
  { path: 'dashboard/profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'dashboard/profile-view/:type/:id', component: ProfileViewComponent, canActivate: [authGuard] },
  { path: 'dashboard/athletes/:id/calendar', component: TrainingCalendarComponent, canActivate: [authGuard] },
  { path: 'dashboard/athletes/:id/timeline', component: TimelineComponent, canActivate: [authGuard] },
  { path: 'dashboard/timeline', component: TimelineComponent, canActivate: [authGuard] },
  { path: 'dashboard/program-preview/:id', component: TrainingCalendarComponent, canActivate: [authGuard] },
  { path: 'dashboard/master-planner', component: TrainingCalendarComponent, canActivate: [authGuard] },
  { path: 'dashboard/master-planner/:id', component: TrainingCalendarComponent, canActivate: [authGuard] },
  { path: 'dashboard/workout/:id', component: WorkoutPlayerComponent, canActivate: [authGuard] },
  { path: 'dashboard/workout-history', component: WorkoutHistoryComponent, canActivate: [authGuard] },
  { path: 'dashboard/schedule', component: AthleteScheduleComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
