import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/api/api_client.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/errors/api_exception.dart';
import '../../../shared/models/user_model.dart';

// ── Providers ─────────────────────────────────────────────────────────────────

final secureStorageProvider = Provider<FlutterSecureStorage>(
  (_) => const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  ),
);

final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(secureStorageProvider);
  return ApiClient(storage);
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final api = ref.watch(apiClientProvider);
  final storage = ref.watch(secureStorageProvider);
  return AuthRepository(api, storage);
});

// ── Repository ────────────────────────────────────────────────────────────────

class AuthRepository {
  final ApiClient _api;
  final FlutterSecureStorage _storage;

  AuthRepository(this._api, this._storage);

  /// Register a new user — mirrors web SignupComponent
  Future<void> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    required String role,
  }) async {
    try {
      await _api.post('/auth/signup', data: {
        'first_name': firstName,
        'last_name': lastName,
        'username': email,
        'email': email,
        'password': password,
        'role': role,
      });
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Login — mirrors web AuthService.login → POST /api/auth/login
  Future<({String token, UserModel user})> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _api.post('/auth/login', data: {
        'email': email,
        'password': password,
      });
      final data = response.data as Map<String, dynamic>;
      final token = data['token'] as String;
      final user = UserModel.fromJson(data['user'] as Map<String, dynamic>);

      // Persist token securely + user in SharedPreferences
      await _storage.write(key: AppConstants.tokenKey, value: token);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(AppConstants.userKey, jsonEncode(user.toJson()));

      return (token: token, user: user);
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Email verification with 6-digit code
  Future<void> verifyEmail({
    required String email,
    required String code,
  }) async {
    try {
      await _api.post('/auth/verify-email', data: {
        'email': email,
        'code': code,
      });
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Resend verification code
  Future<void> resendCode(String email) async {
    try {
      await _api.post('/auth/resend-code', data: {'email': email});
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Forgot password — sends reset email
  Future<void> forgotPassword(String email) async {
    try {
      await _api.post('/auth/forgot-password', data: {'email': email});
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Reset password with token
  Future<void> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    try {
      await _api.post('/auth/reset-password', data: {
        'token': token,
        'password': newPassword,
      });
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Restore session from local storage (used at app startup)
  Future<UserModel?> getStoredUser() async {
    try {
      final token = await _storage.read(key: AppConstants.tokenKey);
      if (token == null || token.isEmpty) return null;
      final prefs = await SharedPreferences.getInstance();
      final userStr = prefs.getString(AppConstants.userKey);
      if (userStr == null) return null;
      return UserModel.fromJson(jsonDecode(userStr) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  /// Logout — clear all stored credentials
  Future<void> logout() async {
    await _storage.delete(key: AppConstants.tokenKey);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.userKey);
  }

  bool get hasStoredToken => true; // validated async via getStoredUser
}
