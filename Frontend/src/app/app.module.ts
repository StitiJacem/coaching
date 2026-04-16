import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { DashboardLayoutComponent } from './components/dashboard-layout/dashboard-layout.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { SignupComponent } from './pages/signup/signup.component';
import { VerifyEmailComponent } from './pages/verify-email/verify-email.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { CompleteProfileComponent } from './pages/complete-profile/complete-profile.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AthletesComponent } from './pages/dashboard/athletes/athletes.component';
import { ProgramsComponent } from './pages/dashboard/programs/programs.component';
import { ExercisesComponent } from './pages/dashboard/exercises/exercises.component';
import { GoalsComponent } from './pages/dashboard/goals/goals.component';
import { MessagingComponent } from './pages/dashboard/messaging/messaging.component';
import { AnalyticsComponent } from './pages/dashboard/analytics/analytics.component';
import { NutritionComponent } from './pages/dashboard/nutrition/nutrition.component';
import { StatsCardComponent } from './components/ui/stats-card/stats-card.component';
import { CardComponent } from './components/ui/card/card.component';
import { BadgeComponent } from './components/ui/badge/badge.component';
import { ButtonComponent } from './components/ui/button/button.component';
import { AvatarComponent } from './components/ui/avatar/avatar.component';
import { LucideAngularModule, Plus, ArrowRight, ArrowLeft, Clock, Search, User, LogOut, AlertCircle, MapPin, Activity, Edit2, AlertTriangle, Star, Award, CheckCircle } from 'lucide-angular';
import { DiscoveryComponent } from './pages/dashboard/discovery/discovery.component';
import { WorkoutPlayerComponent } from './pages/dashboard/workout-player/workout-player.component';
import { WorkoutHistoryComponent } from './pages/dashboard/workout-history/workout-history.component';
import { InviteModalComponent } from './pages/dashboard/athletes/invite-modal/invite-modal.component';
import { ProgramConfigModalComponent } from './pages/dashboard/programs/program-config-modal.component';
import { MyCoachesComponent } from './pages/dashboard/coaches/my-coaches.component';
import { TrainingCalendarComponent } from './pages/dashboard/athletes/training-calendar/training-calendar.component';
import { WorkoutBuilderModalComponent } from './components/workout-builder/workout-builder-modal.component';
import { ProfileViewComponent } from './pages/dashboard/profile-view/profile-view.component';
import { AthleteOverviewComponent } from './pages/dashboard/athletes/athlete-overview/athlete-overview.component';
import { DietaryProfileComponent } from './pages/dashboard/athletes/dietary-profile/dietary-profile.component';
import { DietBuilderComponent } from './pages/dashboard/programs/diet-builder/diet-builder.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    HomeComponent,
    LoginComponent,
    VerifyEmailComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    CompleteProfileComponent,
    ExercisesComponent,
    GoalsComponent,
    MessagingComponent,
    AnalyticsComponent,
    NutritionComponent,
    DiscoveryComponent,
    WorkoutPlayerComponent,
    WorkoutHistoryComponent,
    MyCoachesComponent,
    ProfileViewComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    SignupComponent,
    LucideAngularModule.pick({
      Plus,
      ArrowRight,
      Clock,
      Search,
      User,
      ArrowLeft,
      LogOut,
      AlertCircle,
      MapPin,
      Activity,
      Edit2,
      AlertTriangle,
      Star,
      Award,
      CheckCircle
    }),
    StatsCardComponent,
    CardComponent,
    BadgeComponent,
    ButtonComponent,
    AvatarComponent,
    ProgramConfigModalComponent,
    SidebarComponent,
    DashboardLayoutComponent,
    AthletesComponent,
    TrainingCalendarComponent,
    WorkoutBuilderModalComponent,
    InviteModalComponent,
    ProgramsComponent,
    DashboardComponent,
    AthleteOverviewComponent,
    DietaryProfileComponent,
    DietBuilderComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
