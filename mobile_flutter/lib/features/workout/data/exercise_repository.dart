import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:coaching_mobile/features/auth/data/auth_repository.dart';
import '../../../core/api/api_client.dart';
import '../../../core/errors/api_exception.dart';
import './exercise_model.dart';

final exerciseRepositoryProvider = Provider<ExerciseRepository>((ref) {
  final api = ref.watch(apiClientProvider);
  return ExerciseRepository(api);
});

class ExerciseRepository {
  final ApiClient _api;
  ExerciseRepository(this._api);

  Future<List<Exercise>> getAll({int limit = 50, int offset = 0}) async {
    try {
      final resp = await _api.get('/exercises', queryParameters: {
        'limit': limit,
        'offset': offset,
      });
      final List data = resp.data ?? [];
      return data.map((e) => Exercise.fromJson(e)).toList();
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<List<Exercise>> search(String query) async {
    try {
      final resp = await _api.get('/exercises/search', queryParameters: {
        'q': query,
      });
      final List data = resp.data ?? [];
      return data.map((e) => Exercise.fromJson(e)).toList();
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<List<Exercise>> getByBodyPart(String bodyPart) async {
    try {
      final resp = await _api.get('/exercises/bodyPart/$bodyPart');
      final List data = resp.data ?? [];
      return data.map((e) => Exercise.fromJson(e)).toList();
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
