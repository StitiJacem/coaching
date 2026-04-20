import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/models/user_model.dart';
import '../../features/auth/data/auth_repository.dart';

// ── Auth State ────────────────────────────────────────────────────────────────

enum AuthStatus { loading, unauthenticated, authenticated }

class AuthState {
  final AuthStatus status;
  final UserModel? user;
  final String? error;

  const AuthState({
    this.status = AuthStatus.loading,
    this.user,
    this.error,
  });

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get needsOnboarding =>
      isAuthenticated && user != null && !user!.onboardingCompleted;
  bool get needsEmailVerification =>
      isAuthenticated && user != null && !user!.emailVerified;

  AuthState copyWith({
    AuthStatus? status,
    UserModel? user,
    String? error,
  }) =>
      AuthState(
        status: status ?? this.status,
        user: user ?? this.user,
        error: error,
      );
}

// ── Auth Notifier ─────────────────────────────────────────────────────────────

class AuthNotifier extends AsyncNotifier<AuthState> {
  @override
  Future<AuthState> build() async {
    debugPrint('[AUTH] build() STARTED');
    // On startup: try to restore session from local storage
    // Timeout guards against FlutterSecureStorage hanging on some devices
    final repo = ref.read(authRepositoryProvider);
    try {
      debugPrint('[AUTH] calling getStoredUser()...');
      final user = await repo.getStoredUser().timeout(
        const Duration(seconds: 3),
      );
      debugPrint('[AUTH] getStoredUser() returned: ${user?.email}');
      if (user != null) {
        debugPrint('[AUTH] → authenticated');
        return AuthState(status: AuthStatus.authenticated, user: user);
      }
    } catch (e) {
      debugPrint('[AUTH] ERROR/TIMEOUT: $e');
      // Timeout or storage error → treat as fresh start
    }
    debugPrint('[AUTH] → unauthenticated');
    return const AuthState(status: AuthStatus.unauthenticated);
  }

  Future<void> login(String email, String password) async {
    state = const AsyncValue.loading();
    final repo = ref.read(authRepositoryProvider);
    try {
      final result = await repo.login(email: email, password: password);
      state = AsyncValue.data(
        AuthState(status: AuthStatus.authenticated, user: result.user),
      );
    } catch (e) {
      state = AsyncValue.data(
        AuthState(status: AuthStatus.unauthenticated, error: e.toString()),
      );
    }
  }

  Future<void> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    required String role,
  }) async {
    state = const AsyncValue.loading();
    final repo = ref.read(authRepositoryProvider);
    try {
      await repo.register(
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
        role: role,
      );
      // Registration succeeded — user must verify email next
      state = AsyncValue.data(
        AuthState(
          status: AuthStatus.unauthenticated,
          error: null,
          user: UserModel(
            id: 0,
            email: email,
            username: '',
            firstName: firstName,
            lastName: lastName,
            role: role,
            emailVerified: false,
            onboardingCompleted: false,
          ),
        ),
      );
    } catch (e) {
      state = AsyncValue.data(
        AuthState(status: AuthStatus.unauthenticated, error: e.toString()),
      );
    }
  }

  Future<void> logout() async {
    final repo = ref.read(authRepositoryProvider);
    await repo.logout();
    state = const AsyncValue.data(
      AuthState(status: AuthStatus.unauthenticated),
    );
  }

  void updateUser(UserModel user) {
    state = AsyncValue.data(
      state.valueOrNull?.copyWith(user: user) ??
          AuthState(status: AuthStatus.authenticated, user: user),
    );
  }

  void clearError() {
    final current = state.valueOrNull;
    if (current != null) {
      state = AsyncValue.data(current.copyWith(error: null));
    }
  }
}

final authProvider =
    AsyncNotifierProvider<AuthNotifier, AuthState>(() => AuthNotifier());

// Convenience selector for just the current user
final currentUserProvider = Provider<UserModel?>((ref) {
  return ref.watch(authProvider).valueOrNull?.user;
});

// Role convenience
final userRoleProvider = Provider<String>((ref) {
  return ref.watch(currentUserProvider)?.role ?? 'athlete';
});
