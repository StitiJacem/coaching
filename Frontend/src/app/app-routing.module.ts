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
import { MessagingComponent } from './pages/dashboard/messaging/messaging.component';
import { AnalyticsComponent } from './pages/dashboard/analytics/analytics.component';
import { NutritionComponent } from './pages/dashboard/nutrition/nutrition.component';
import { DiscoveryComponent } from './pages/dashboard/discovery/discovery.component';
import { WorkoutPlayerComponent } from './pages/dashboard/workout-player/workout-player.component';
import { WorkoutHistoryComponent } from './pages/dashboard/workout-history/workout-history.component';
import { MyCoachesComponent } from './pages/dashboard/coaches/my-coaches.component';
import { TrainingCalendarComponent } from './pages/dashboard/athletes/training-calendar/training-calendar.component';
import { ProfileComponent } from './pages/dashboard/profile/profile.component';
import { CompleteProfileComponent } from './pages/complete-profile/complete-profile.component';
import { AthleteScheduleComponent } from './pages/dashboard/athlete-schedule/athlete-schedule.component';
import { ProfileViewComponent } from './pages/dashboard/profile-view/profile-view.component';
import { AthleteOverviewComponent } from './pages/dashboard/athletes/athlete-overview/athlete-overview.component';
import { DietaryProfileComponent } from './pages/dashboard/athletes/dietary-profile/dietary-profile.component';
import { DietBuilderComponent } from './pages/dashboard/programs/diet-builder/diet-builder.component';
import { AdminDashboardComponent } from './pages/dashboard/admin/admin-dashboard.component';
import { UserManagementComponent } from './pages/dashboard/admin/user-management.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'complete-profile', component: CompleteProfileComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'dashboard/athletes', component: AthletesComponent, canActivate: [authGuard] },
  { path: 'dashboard/programs', component: ProgramsComponent, canActivate: [authGuard] },
  { path: 'dashboard/exercises', component: ExercisesComponent, canActivate: [authGuard] },
  { path: 'dashboard/goals', component: GoalsComponent, canActivate: [authGuard] },
  { path: 'dashboard/messaging', component: MessagingComponent, canActivate: [authGuard] },
  { path: 'dashboard/analytics', component: AnalyticsComponent, canActivate: [authGuard] },
  { path: 'dashboard/nutrition', component: NutritionComponent, canActivate: [authGuard] },
  { path: 'dashboard/discovery', component: DiscoveryComponent, canActivate: [authGuard] },
  { path: 'dashboard/coaches', component: MyCoachesComponent, canActivate: [authGuard] },
  { path: 'dashboard/profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'dashboard/profile-view/:type/:id', component: ProfileViewComponent, canActivate: [authGuard] },
  { path: 'dashboard/athletes/:id/overview', component: AthleteOverviewComponent, canActivate: [authGuard] },
  { path: 'dashboard/athletes/:id/dietary-profile', component: DietaryProfileComponent, canActivate: [authGuard] },
  { path: 'dashboard/diet-builder', component: DietBuilderComponent, canActivate: [authGuard] },
  { path: 'dashboard/athletes/:id/calendar', component: TrainingCalendarComponent, canActivate: [authGuard] },
  { path: 'dashboard/program-preview/:id', component: TrainingCalendarComponent, canActivate: [authGuard] },
  { path: 'dashboard/master-planner', component: TrainingCalendarComponent, canActivate: [authGuard] },
  { path: 'dashboard/master-planner/:id', component: TrainingCalendarComponent, canActivate: [authGuard] },
  { path: 'dashboard/workout/:id', component: WorkoutPlayerComponent, canActivate: [authGuard] },
  { path: 'dashboard/workout-history', component: WorkoutHistoryComponent, canActivate: [authGuard] },
  { path: 'dashboard/schedule', component: AthleteScheduleComponent, canActivate: [authGuard] },
  { path: 'dashboard/admin', component: AdminDashboardComponent, canActivate: [authGuard] },
  { path: 'dashboard/admin/users', component: UserManagementComponent, canActivate: [authGuard] },
  { path: 'dashboard/admin/stats', component: AdminDashboardComponent, canActivate: [authGuard] },
  { path: 'dashboard/admin/settings', component: AdminDashboardComponent, canActivate: [authGuard] },
  { path: 'home', component: HomeComponent },
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
