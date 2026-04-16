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


  Future<Map<String, dynamic>> getStats({required String role}) async {
    try {
      final resp = await _api.get('/dashboard/stats',
          queryParameters: {'role': role});
      return (resp.data as Map<String, dynamic>?) ?? {};
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }


  Future<List<dynamic>> getTodaySessions() async {
    try {
      final resp = await _api.get('/dashboard/today-sessions');
      return (resp.data as List?) ?? [];
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }


  Future<Map<String, dynamic>?> getTodayWorkout({required int userId}) async {
    try {
      final resp = await _api.get('/programs/today/$userId');
      if (resp.data == null) return null;
      return resp.data as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }


  Future<List<dynamic>> getRecentAthletes() async {
    try {
      final resp = await _api.get('/dashboard/recent-athletes');
      return (resp.data as List?) ?? [];
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
