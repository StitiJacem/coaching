import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:io';
import '../../auth/data/auth_repository.dart';

class NutritionRepository {
  final Dio _dio;

  NutritionRepository(this._dio);

  Future<Map<String, dynamic>> analyzeMeal(File imageFile) async {
    final formData = FormData.fromMap({
      'image': await MultipartFile.fromFile(imageFile.path),
    });

    final response = await _dio.post('/ai/analyze-food', data: formData);
    return response.data;
  }

  Future<void> logMeal(int athleteId, Map<String, dynamic> mealData) async {
    await _dio.post('/nutrition/athletes/$athleteId/log', data: mealData);
  }

  Future<List<dynamic>> getMealLogs(int athleteId, {String? date}) async {
    final response = await _dio.get('/nutrition/athletes/$athleteId/logs-by-date', queryParameters: {
      if (date != null) 'date': date,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> getNutritionSummary(int athleteId) async {
    final response = await _dio.get('/nutrition/athletes/$athleteId/nutrition-summary');
    return response.data;
  }

  Future<Map<String, dynamic>?> getActivePlan(int athleteId) async {
    final response = await _dio.get('/nutrition/athletes/$athleteId/active-plan');
    return response.data;
  }
}

final nutritionRepositoryProvider = Provider<NutritionRepository>((ref) {
  return NutritionRepository(ref.watch(apiClientProvider).dio);
});
