import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/providers/auth_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../features/auth/presentation/screens/splash_screen.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/signup_screen.dart';
import '../../features/auth/presentation/screens/verify_email_screen.dart';
import '../../features/auth/presentation/screens/forgot_password_screen.dart';
import '../../features/auth/presentation/screens/reset_password_screen.dart';
import '../../features/onboarding/presentation/screens/onboarding_screen.dart';
import '../../features/dashboard/presentation/screens/app_shell.dart';
import '../../features/dashboard/presentation/screens/dashboard_screen.dart';
import '../../features/programs/presentation/screens/programs_screen.dart';
import '../../features/sessions/presentation/screens/sessions_screen.dart';
import '../../features/sessions/presentation/screens/calendar_screen.dart';
import '../../features/workout/presentation/screens/workout_player_screen.dart';
import '../../features/workout/presentation/screens/workout_history_screen.dart';
import '../../features/goals/presentation/screens/goals_screen.dart';
import '../../features/notifications/presentation/screens/notifications_screen.dart';
import '../../features/profile/presentation/screens/profile_screen.dart';
import '../../features/connections/presentation/screens/athletes_screen.dart';
import '../../features/connections/presentation/screens/coaches_screen.dart';
import '../../features/connections/presentation/screens/discovery_screen.dart';
import '../../features/analytics/presentation/screens/analytics_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) {
      debugPrint('[ROUTER] redirect — authState: $authState');
      final isLoading = authState.isLoading;
      final auth = authState.valueOrNull ??
          const AuthState(status: AuthStatus.unauthenticated);
      final isAuthed = auth.isAuthenticated;
      final needsVerify = auth.needsEmailVerification;
      final needsOnboarding = auth.needsOnboarding;
      final location = state.uri.toString();

      if (isLoading) return '/splash';
      if (location.startsWith('/splash')) return isAuthed ? '/dashboard' : '/login';

      final publicRoutes = [
        '/login', '/signup', '/verify-email', '/forgot-password', '/reset-password'
      ];
      final isPublic = publicRoutes.any((r) => location.startsWith(r));
      if (!isAuthed) return isPublic ? null : '/login';

      if (needsVerify && !location.startsWith('/verify-email')) return '/verify-email';
      if (needsOnboarding &&
          !location.startsWith('/onboarding') &&
          !location.startsWith('/verify-email')) {
        return '/onboarding';
      }
      if (isAuthed && isPublic) {
        if (needsVerify || needsOnboarding) return null;
        return '/dashboard';
      }
      return null;
    },

    routes: [
      // ── Public ────────────────────────────────────────────────────────────
      GoRoute(path: '/splash', builder: (_, _) => const SplashScreen()),
      GoRoute(path: '/login',  builder: (_, _) => const LoginScreen()),
      GoRoute(path: '/signup', builder: (_, _) => const SignupScreen()),
      GoRoute(
        path: '/verify-email',
        builder: (context, state) =>
            VerifyEmailScreen(email: state.uri.queryParameters['email'] ?? ''),
      ),
      GoRoute(path: '/forgot-password', builder: (_, _) => const ForgotPasswordScreen()),
      GoRoute(
        path: '/reset-password',
        builder: (context, state) =>
            ResetPasswordScreen(token: state.uri.queryParameters['token'] ?? ''),
      ),
      GoRoute(path: '/onboarding', builder: (_, _) => const OnboardingScreen()),

      // ── Protected shell (with bottom nav) ──────────────────────────────────
      ShellRoute(
        builder: (context, state, child) => AppShell(child: child),
        routes: [
          GoRoute(path: '/dashboard',     builder: (_, _) => const DashboardScreen()),
          GoRoute(path: '/programs',      builder: (_, _) => const ProgramsScreen()),
          GoRoute(path: '/schedule',      builder: (_, _) => const CalendarScreen()),
          GoRoute(path: '/goals',         builder: (_, _) => const GoalsScreen()),
          GoRoute(path: '/analytics',     builder: (_, _) => const AnalyticsScreen()),
          GoRoute(path: '/athletes',      builder: (_, _) => const AthletesScreen()),
          GoRoute(path: '/coaches',       builder: (_, _) => const CoachesScreen()),
          GoRoute(path: '/discovery',     builder: (_, _) => const DiscoveryScreen()),
          GoRoute(path: '/notifications', builder: (_, _) => const NotificationsScreen()),
          GoRoute(path: '/profile',       builder: (_, _) => const ProfileScreen()),
        ],
      ),

      // ── Full-screen (no bottom nav) ────────────────────────────────────────
      GoRoute(path: '/sessions',       builder: (_, _) => const SessionsScreen()),
      GoRoute(path: '/workout-history', builder: (_, _) => const WorkoutHistoryScreen()),
      GoRoute(
        path: '/workout/:id',
        builder: (context, state) => WorkoutPlayerScreen(
          workoutLogId: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
        ),
      ),
      GoRoute(
        path: '/athletes/:id',
        builder: (context, state) => _AthleteDetailPlaceholder(
          athleteId: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
        ),
      ),
      GoRoute(
        path: '/athletes/:id/calendar',
        builder: (context, state) => CalendarScreen(
          athleteId: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
        ),
      ),
      GoRoute(
        path: '/programs/create',
        builder: (_, _) => const _ProgramBuilderPlaceholder(),
      ),
      GoRoute(
        path: '/programs/:id',
        builder: (context, state) => _ProgramDetailPlaceholder(
          programId: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
        ),
      ),
      GoRoute(
        path: '/programs/:id/edit',
        builder: (context, state) => _ProgramDetailPlaceholder(
          programId: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
          editMode: true,
        ),
      ),
    ],
  );
});

// ─── Placeholder detail screens (expanded in later sprints) ──────────────────

class _AthleteDetailPlaceholder extends StatelessWidget {
  final int athleteId;
  const _AthleteDetailPlaceholder({required this.athleteId});

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.background,
          surfaceTintColor: Colors.transparent,
          title: const Text('Athlete Profile'),
        ),
        body: Center(
          child: Text('Athlete #$athleteId — full profile coming soon',
              style: const TextStyle(color: AppColors.textMuted)),
        ),
      );
}

class _ProgramDetailPlaceholder extends StatelessWidget {
  final int programId;
  final bool editMode;
  const _ProgramDetailPlaceholder({required this.programId, this.editMode = false});

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.background,
          surfaceTintColor: Colors.transparent,
          title: Text(editMode ? 'Edit Program' : 'Program Detail'),
        ),
        body: Center(
          child: Text('Program #$programId — coming soon',
              style: const TextStyle(color: AppColors.textMuted)),
        ),
      );
}

class _ProgramBuilderPlaceholder extends StatelessWidget {
  const _ProgramBuilderPlaceholder();

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.background,
          surfaceTintColor: Colors.transparent,
          title: const Text('Create Program'),
        ),
        body: const Center(
          child: Text('Program builder — coming in next sprint',
              style: TextStyle(color: AppColors.textMuted)),
        ),
      );
}
