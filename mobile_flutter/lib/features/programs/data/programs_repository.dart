import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/data/auth_repository.dart';
import '../../../core/api/api_client.dart';
import '../../../core/errors/api_exception.dart';

final programsRepositoryProvider = Provider<ProgramsRepository>((ref) {
  return ProgramsRepository(ref.watch(apiClientProvider));
});

class ProgramsRepository {
  final ApiClient _api;
  ProgramsRepository(this._api);

  Future<List<dynamic>> getAll({
    String? status,
    int? athleteId,
  }) async {
    try {
      final resp = await _api.get('/programs', queryParameters: {
        if (status != null) 'status': status,
        if (athleteId != null) 'athleteId': athleteId,
      });
      return (resp.data as List?) ?? [];
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<Map<String, dynamic>> getById(int id) async {
    try {
      final resp = await _api.get('/programs/$id');
      return resp.data as Map<String, dynamic>;
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<Map<String, dynamic>> create(Map<String, dynamic> data) async {
    try {
      final resp = await _api.post('/programs', data: data);
      return resp.data as Map<String, dynamic>;
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> assignToAthletes(int programId, List<int> athleteIds) async {
    try {
      // For now, we call the API multiple times since the backend expects one at a time.
      // If we update the backend later to accept a list, we can optimize this.
      await Future.wait(
        athleteIds.map((id) => _api.post('/programs/$programId/assign', data: {'athleteId': id}))
      );
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> updateStatus(int programId, String status) async {
    try {
      await _api.patch('/programs/$programId/status', data: {'status': status});
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> quitProgram(int programId) async {
    try {
      await _api.patch('/programs/$programId/quit');
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> acceptProgram(int id) async {
    try {
      await _api.patch('/programs/$id/accept');
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
