import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';



import '../../../notifications/data/notifications_repository.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  List<NotificationModel> _items = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final repo = ref.read(notificationsRepositoryProvider);
      final result = await repo.getAll();
      _items = result.notifications;

      final unread = _items.where((n) => !n.read).map((n) => n.id).toList();
      if (unread.isNotEmpty) await repo.markRead(unread);
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Notifications'),
        backgroundColor: AppColors.background,
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary))
          : _items.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.notifications_off_outlined,
                          color: AppColors.textMuted, size: 48),
                      const SizedBox(height: 12),
                      Text('No notifications',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppColors.textMuted)),
                    ],
                  ),
                )
              : RefreshIndicator(
                  color: AppColors.primary,
                  onRefresh: _load,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _items.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 8),
                    itemBuilder: (ctx, i) {
                      final n = _items[i];
                      return _NotifTile(notif: n);
                    },
                  ),
                ),
    );
  }
}

class _NotifTile extends StatelessWidget {
  final NotificationModel notif;
  const _NotifTile({required this.notif});

  @override
  Widget build(BuildContext context) {
    IconData icon;
    Color color;
    switch (notif.type) {
      case 'workout_completed':
        icon = Icons.fitness_center_rounded; color = AppColors.success; break;
      case 'program_assigned':
        icon = Icons.assignment_rounded; color = AppColors.primary; break;
      case 'athlete_connected':
      case 'coaching_accepted':
        icon = Icons.people_alt_rounded; color = AppColors.info; break;
      case 'new_pr':
        icon = Icons.emoji_events_rounded; color = AppColors.warning; break;
      case 'workout_missed':
        icon = Icons.warning_amber_rounded; color = AppColors.error; break;
      default:
        icon = Icons.notifications_rounded; color = AppColors.textMuted;
    }
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: notif.read ? AppColors.card : AppColors.primary.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
            color: notif.read ? AppColors.cardBorder : AppColors.primary.withValues(alpha: 0.2)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12), shape: BoxShape.circle),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(notif.message,
                    style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 13,
                        fontWeight: notif.read ? FontWeight.normal : FontWeight.w500)),
                const SizedBox(height: 4),
                Text(_timeAgo(notif.createdAt),
                    style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
              ],
            ),
          ),
          if (!notif.read)
            Container(
              width: 8, height: 8,
              decoration: const BoxDecoration(
                  color: AppColors.primary, shape: BoxShape.circle),
            ),
        ],
      ),
    );
  }

  String _timeAgo(DateTime t) {
    final diff = DateTime.now().difference(t);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}
