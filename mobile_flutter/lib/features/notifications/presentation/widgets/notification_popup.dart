import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/notifications_repository.dart';

class NotificationPopup extends ConsumerStatefulWidget {
  const NotificationPopup({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.5),
      builder: (context) => const NotificationPopup(),
    );
  }

  @override
  ConsumerState<NotificationPopup> createState() => _NotificationPopupState();
}

class _NotificationPopupState extends ConsumerState<NotificationPopup> {
  List<NotificationModel> _items = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() => _loading = true);
    try {
      final repo = ref.read(notificationsRepositoryProvider);
      final result = await repo.getAll();
      if (mounted) {
        setState(() {
          _items = result.notifications;
          _loading = false;
        });
        
        // Mark as read after a short delay
        final unread = _items.where((n) => !n.read).map((n) => n.id).toList();
        if (unread.isNotEmpty) {
          await repo.markRead(unread);
        }
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.6, // Slightly more than half for better UX
      decoration: BoxDecoration(
        color: AppColors.background.withValues(alpha: 0.85),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        border: Border.all(color: AppColors.cardBorder.withValues(alpha: 0.5)),
      ),
      child: ClipRRect(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
          child: Column(
            children: [
              // Handle
              Center(
                child: Container(
                  margin: const EdgeInsets.symmetric(vertical: 12),
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.textMuted.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              
              // Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Notifications',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    if (_items.any((n) => !n.read))
                      TextButton(
                        onPressed: () {}, // Already handled by _load for all unread
                        child: const Text('Mark all as read',
                            style: TextStyle(fontSize: 12, color: AppColors.primary)),
                      ),
                  ],
                ),
              ),

              const Divider(height: 1),

              // Content
              Expanded(
                child: _loading
                    ? const Center(child: CircularProgressIndicator())
                    : _items.isEmpty
                        ? _buildEmptyState()
                        : ListView.separated(
                            padding: const EdgeInsets.all(20),
                            itemCount: _items.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (context, index) => _NotificationTile(notif: _items[index]),
                          ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.notifications_none_rounded, 
               size: 64, 
               color: AppColors.textMuted.withValues(alpha: 0.5)),
          const SizedBox(height: 16),
          const Text(
            'All caught up!',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'No new notifications to show.',
            style: TextStyle(
              fontSize: 13,
              color: AppColors.textMuted,
            ),
          ),
        ],
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  final NotificationModel notif;
  const _NotificationTile({required this.notif});

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
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.card.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: notif.read 
            ? AppColors.cardBorder.withValues(alpha: 0.3)
            : AppColors.primary.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  notif.message,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: notif.read ? FontWeight.w500 : FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _timeAgo(notif.createdAt),
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textMuted,
                  ),
                ),
              ],
            ),
          ),
          if (!notif.read)
            Container(
              margin: const EdgeInsets.only(top: 4, left: 8),
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
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
