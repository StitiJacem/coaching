import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:coaching_mobile/features/auth/data/auth_repository.dart';
import '../../../core/api/api_client.dart';
import '../../../core/errors/api_exception.dart';

final sessionsRepositoryProvider = Provider<SessionsRepository>((ref) {
  final api = ref.watch(apiClientProvider);
  return SessionsRepository(api);
});

class SessionsRepository {
  final ApiClient _api;
  SessionsRepository(this._api);

  /// GET /api/sessions/:id
  Future<Map<String, dynamic>> getById(int id) async {
    try {
      final resp = await _api.get('/sessions/$id');
      return resp.data as Map<String, dynamic>;
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// POST /api/sessions
  Future<Map<String, dynamic>> create(Map<String, dynamic> data) async {
    try {
      final resp = await _api.post('/sessions', data: data);
      return resp.data as Map<String, dynamic>;
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// PATCH /api/sessions/:id
  Future<Map<String, dynamic>> update(int id, Map<String, dynamic> data) async {
    try {
      final resp = await _api.patch('/sessions/$id', data: data);
      return resp.data as Map<String, dynamic>;
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// GET /api/sessions?athleteId=X&startDate=Y&endDate=Z
  Future<List<dynamic>> getSessions({
    required int athleteId,
    required String startDate,
    required String endDate,
  }) async {
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
