import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/data/auth_repository.dart';
import '../../../core/api/api_client.dart';
import '../../../core/errors/api_exception.dart';

final notificationsRepositoryProvider =
    Provider<NotificationsRepository>((ref) {
  final api = ref.watch(apiClientProvider);
  return NotificationsRepository(api);
});

class NotificationModel {
  final int id;
  final String type;
  final String message;
  final bool read;
  final DateTime createdAt;

  NotificationModel({
    required this.id,
    required this.type,
    required this.message,
    required this.read,
    required this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) =>
      NotificationModel(
        id: json['id'] as int,
        type: json['type'] as String? ?? '',
        message: json['message'] as String? ?? '',
        read: json['read'] as bool? ?? false,
        createdAt: DateTime.tryParse(json['created_at'] as String? ?? '') ??
            DateTime.now(),
      );
}

class NotificationsRepository {
  final ApiClient _api;
  NotificationsRepository(this._api);

  Future<({List<NotificationModel> notifications, int total})> getAll({
    int limit = 50,
    int offset = 0,
    bool unreadOnly = false,
  }) async {
    try {
      final resp = await _api.get('/notifications', queryParameters: {
        'limit': limit,
        'offset': offset,
        if (unreadOnly) 'unread': 'true',
      });
      final data = resp.data as Map<String, dynamic>;
      final items = (data['notifications'] as List? ?? [])
          .map((e) => NotificationModel.fromJson(e as Map<String, dynamic>))
          .toList();
      return (notifications: items, total: data['total'] as int? ?? 0);
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<int> getUnreadCount() async {
    try {
      final result = await getAll(limit: 1, unreadOnly: true);
      return result.total;
    } catch (_) {
      return 0;
    }
  }

  Future<void> markRead(List<int> ids) async {
    try {
      await _api.post('/notifications/mark-read', data: {'ids': ids});
    } catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
