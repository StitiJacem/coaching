import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:coaching_mobile/features/auth/data/auth_repository.dart';
import '../../../core/api/api_client.dart';
import '../../../core/errors/api_exception.dart';

final workoutLogRepositoryProvider = Provider<WorkoutLogRepository>((ref) {
  final api = ref.watch(apiClientProvider);
  return WorkoutLogRepository(api);
});

class WorkoutLogRepository {
  final ApiClient _api;
  WorkoutLogRepository(this._api);

  Future<Map<String, dynamic>> getById(int id) async {
    try {
      final resp = await _api.get('/workout-logs/$id');
      return resp.data as Map<String, dynamic>;
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<Map<String, dynamic>> create(Map<String, dynamic> data) async {
    try {
      final resp = await _api.post('/workout-logs', data: data);
      return resp.data as Map<String, dynamic>;
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<Map<String, dynamic>> startWorkout(int id) async {
    try {
      final resp = await _api.post('/workout-logs/$id/start');
      return resp.data as Map<String, dynamic>;
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> logExercise(int workoutLogId, Map<String, dynamic> data) async {
    try {
      await _api.post('/workout-logs/$workoutLogId/exercises', data: data);
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> emitEvent(int workoutLogId, String type, Map<String, dynamic> payload) async {
    try {
      await _api.post('/workout-logs/$workoutLogId/event', data: {
        'type': type,
        'payload': payload,
      });
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> updateWorkout(int id, Map<String, dynamic> data) async {
    try {
      await _api.put('/workout-logs/$id', data: data);
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> quitWorkout(int id) async {
    try {
      await _api.post('/workout-logs/$id/quit');
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
