import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/data/auth_repository.dart';
import '../../../core/api/api_client.dart';
import '../../../core/errors/api_exception.dart';

final nutritionistRepositoryProvider = Provider<NutritionistRepository>((ref) {
  final api = ref.watch(apiClientProvider);
  return NutritionistRepository(api);
});

class NutritionistRepository {
  final ApiClient _api;
  NutritionistRepository(this._api);

  // ── Profile ────────────────────────────────────────────────────────────────

  /// GET /api/nutrition/nutritionists/me/profile
  Future<Map<String, dynamic>> getMyProfile() async {
    try {
      final resp = await _api.get('/nutrition/nutritionists/me/profile');
      return (resp.data as Map<String, dynamic>?) ?? {};
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// PUT /api/nutrition/nutritionists/:userId/profile
  Future<void> updateProfile(int userId, Map<String, dynamic> data) async {
    try {
      await _api.put('/nutrition/nutritionists/$userId/profile', data: data);
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  // ── Connection Requests ────────────────────────────────────────────────────

  /// GET /api/nutrition/my-requests  — incoming requests from athletes
  Future<List<dynamic>> getMyRequests() async {
    try {
      final resp = await _api.get('/nutrition/my-requests');
      return (resp.data as List?) ?? [];
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// PATCH /api/nutrition/connection/:connectionId
  Future<void> respondToRequest(String connectionId, String status) async {
    try {
      await _api.patch('/nutrition/connection/$connectionId', data: {'status': status});
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  // ── Clients ────────────────────────────────────────────────────────────────

  /// GET /api/nutrition/nutritionists/:id/clients
  Future<List<dynamic>> getClients(String nutritionistId) async {
    try {
      final resp = await _api.get('/nutrition/nutritionists/$nutritionistId/clients');
      return (resp.data as List?) ?? [];
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// GET /api/nutrition/nutritionists/:id/clients/:athleteId/compliance
  Future<Map<String, dynamic>> getClientCompliance(
      String nutritionistId, int athleteId) async {
    try {
      final resp = await _api.get(
          '/nutrition/nutritionists/$nutritionistId/clients/$athleteId/compliance');
      return (resp.data as Map<String, dynamic>?) ?? {};
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// GET /api/nutrition/nutritionists/:id/clients/:athleteId/plans
  Future<List<dynamic>> getClientPlans(
      String nutritionistId, int athleteId) async {
    try {
      final resp = await _api.get(
          '/nutrition/nutritionists/$nutritionistId/clients/$athleteId/plans');
      return (resp.data as List?) ?? [];
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  // ── Plans ──────────────────────────────────────────────────────────────────

  /// GET /api/nutrition/my-plans
  Future<List<dynamic>> getMyPlans() async {
    try {
      final resp = await _api.get('/nutrition/my-plans');
      return (resp.data as List?) ?? [];
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// GET /api/nutrition/plans/:id
  Future<Map<String, dynamic>> getPlanById(int planId) async {
    try {
      final resp = await _api.get('/nutrition/plans/$planId');
      return (resp.data as Map<String, dynamic>?) ?? {};
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// POST /api/nutrition/plans
  Future<Map<String, dynamic>> createPlan(Map<String, dynamic> data) async {
    try {
      final resp = await _api.post('/nutrition/plans', data: data);
      return (resp.data as Map<String, dynamic>?) ?? {};
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// PUT /api/nutrition/plans/:planId/build
  Future<void> savePlan(int planId, Map<String, dynamic> data) async {
    try {
      await _api.put('/nutrition/plans/$planId/build', data: data);
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// DELETE /api/nutrition/plans/:id
  Future<void> deletePlan(int planId) async {
    try {
      await _api.delete('/nutrition/plans/$planId');
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// POST /api/nutrition/plans/:planId/assign
  Future<void> assignPlan(int planId, List<int> athleteIds) async {
    try {
      await _api.post('/nutrition/plans/$planId/assign',
          data: {'athleteIds': athleteIds});
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  // ── Athlete Nutrition Data (read-only for nutritionist) ───────────────────

  /// GET /api/nutrition/athletes/:athleteId/nutrition-summary
  Future<Map<String, dynamic>> getAthleteSummary(int athleteId) async {
    try {
      final resp =
          await _api.get('/nutrition/athletes/$athleteId/nutrition-summary');
      return (resp.data as Map<String, dynamic>?) ?? {};
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// GET /api/nutrition/athletes/:athleteId/dietary-profile
  Future<Map<String, dynamic>> getAthleteDietaryProfile(int athleteId) async {
    try {
      final resp =
          await _api.get('/nutrition/athletes/$athleteId/dietary-profile');
      return (resp.data as Map<String, dynamic>?) ?? {};
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// GET /api/nutrition/athletes/:athleteId/compliance
  Future<Map<String, dynamic>> getAthleteCompliance(int athleteId) async {
    try {
      final resp =
          await _api.get('/nutrition/athletes/$athleteId/compliance');
      return (resp.data as Map<String, dynamic>?) ?? {};
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// GET /api/nutrition/athletes/:athleteId/logs-by-date
  Future<List<dynamic>> getAthleteLogs(int athleteId, {String? date}) async {
    try {
      final resp = await _api.get(
        '/nutrition/athletes/$athleteId/logs-by-date',
        queryParameters: date != null ? {'date': date} : null,
      );
      return (resp.data as List?) ?? [];
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
