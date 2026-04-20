import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/data/auth_repository.dart';
import '../../../core/api/api_client.dart';
import '../../../core/errors/api_exception.dart';

final dashboardRepositoryProvider = Provider<DashboardRepository>((ref) {
  final api = ref.watch(apiClientProvider);
  return DashboardRepository(api);
});

class DashboardRepository {
  final ApiClient _api;
  DashboardRepository(this._api);

  /// GET /api/dashboard/stats?role=coach|athlete
  Future<Map<String, dynamic>> getStats({required String role}) async {
    try {
      final resp = await _api.get('/dashboard/stats',
          queryParameters: {'role': role});
      return (resp.data as Map<String, dynamic>?) ?? {};
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// GET /api/dashboard/today-sessions (coach)
  Future<List<dynamic>> getTodaySessions() async {
    try {
      final resp = await _api.get('/dashboard/today-sessions');
      return (resp.data as List?) ?? [];
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// GET /api/programs/today/:userId   (athlete today's workout)
  Future<Map<String, dynamic>?> getTodayWorkout({required int userId}) async {
    try {
      final resp = await _api.get('/programs/today/$userId');
      if (resp.data == null) return null;
      return resp.data as Map<String, dynamic>;
    } catch (_) {
      return null; // rest day
    }
  }

  /// GET /api/dashboard/recent-athletes (coach)
  Future<List<dynamic>> getRecentAthletes() async {
    try {
      final resp = await _api.get('/dashboard/recent-athletes');
      return (resp.data as List?) ?? [];
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// GET /api/dashboard/prs/recent
  Future<List<dynamic>> getRecentPRs({required String role}) async {
    try {
      final resp = await _api.get('/dashboard/prs/recent',
          queryParameters: {'role': role});
      return (resp.data as List?) ?? [];
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// GET /api/coaching-requests/me
  Future<List<dynamic>> getMyRequests() async {
    try {
      final resp = await _api.get('/coaching-requests/me');
      return (resp.data as List?) ?? [];
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// PATCH /api/coaching-requests/:id/status
  Future<void> updateRequestStatus(String id, String status) async {
    try {
      await _api.patch('/coaching-requests/$id/status', data: {'status': status});
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// GET /api/programs?status=assigned&athleteId=X
  Future<List<dynamic>> getPendingPrograms(int athleteId) async {
    try {
      final resp = await _api.get('/programs', queryParameters: {
        'status': 'assigned',
        'athleteId': athleteId
      });
      return (resp.data as List?) ?? [];
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// GET /api/sessions?athleteId=X&startDate=Y&endDate=Z
  Future<List<dynamic>> getWeeklySessions(int athleteId, String startDate, String endDate) async {
    try {
      final resp = await _api.get('/sessions', queryParameters: {
        'athleteId': athleteId,
        'startDate': startDate,
        'endDate': endDate,
      });
      return (resp.data as List?) ?? [];
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
