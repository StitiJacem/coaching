import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/data/auth_repository.dart';
import '../../../core/api/api_client.dart';
import '../../../core/errors/api_exception.dart';

final athletesRepositoryProvider = Provider<AthletesRepository>((ref) {
  return AthletesRepository(ref.watch(apiClientProvider));
});

class AthletesRepository {
  final ApiClient _api;
  AthletesRepository(this._api);

  /// GET /api/athletes — list of coach's connected athletes
  Future<List<dynamic>> getMyAthletes() async {
    try {
      final resp = await _api.get('/athletes');
      return (resp.data as List?) ?? [];
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// GET /api/athletes/:id — single athlete profile
  Future<Map<String, dynamic>> getById(int id) async {
    try {
      final resp = await _api.get('/athletes/$id');
      return resp.data as Map<String, dynamic>;
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// GET /api/coaches/all — searchable coach directory (for athletes)
  Future<List<dynamic>> searchCoaches({String? query}) async {
    try {
      final resp = await _api.get('/coaches/all', queryParameters: {
        if (query != null && query.isNotEmpty) 'q': query,
      });
      return (resp.data as List?) ?? [];
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// POST /api/coaching-requests — athlete sends connection request to a coach
  Future<void> sendConnectionRequest(int coachId, {String? message}) async {
    try {
      await _api.post('/coaching-requests', data: {
        'coachId': coachId,
        if (message != null) 'message': message,
      });
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

  /// DELETE /api/coaching-requests/:id — disconnect from coach/athlete
  Future<void> disconnect(String requestId) async {
    try {
      await _api.delete('/coaching-requests/$requestId');
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// POST /api/coaching-requests/invite — coach invites athlete by email
  Future<void> inviteAthlete(String email) async {
    try {
      await _api.post('/coaching-requests/invite', data: {'email': email});
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// PATCH /api/athletes/:id — update athlete goals/profile
  Future<void> updateGoals(int athleteId, Map<String, dynamic> data) async {
    try {
      await _api.patch('/athletes/$athleteId', data: data);
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// GET /api/users/me — current user's full profile
  Future<Map<String, dynamic>> getMyProfile() async {
    try {
      final resp = await _api.get('/users/me');
      return resp.data as Map<String, dynamic>;
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// PATCH /api/users/me — update current user's profile
  Future<void> updateMyProfile(Map<String, dynamic> data) async {
    try {
      await _api.patch('/users/me', data: data);
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
