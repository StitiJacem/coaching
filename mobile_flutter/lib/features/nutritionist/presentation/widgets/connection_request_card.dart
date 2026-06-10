import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

/// Card shown on the dashboard for pending nutritionist connection requests.
class ConnectionRequestCard extends StatelessWidget {
  final Map<String, dynamic> request;
  final VoidCallback onAccept;
  final VoidCallback onReject;
  final bool isLoading;

  const ConnectionRequestCard({
    super.key,
    required this.request,
    required this.onAccept,
    required this.onReject,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final athlete = request['athlete'] as Map<String, dynamic>?;
    final user = athlete?['user'] as Map<String, dynamic>? ??
        request['user'] as Map<String, dynamic>? ??
        {};
    final firstName = user['first_name'] ?? user['firstName'] ?? '';
    final lastName = user['last_name'] ?? user['lastName'] ?? '';
    final name = '$firstName $lastName'.trim().isEmpty
        ? 'Athlete'
        : '$firstName $lastName';
    final photoUrl = user['photo_url'] ?? user['photoUrl'] ?? user['profilePicture'];
    final initial = firstName.isNotEmpty ? firstName[0].toUpperCase() : 'A';
    final message = request['message'] as String? ?? '';
    final createdAt = request['createdAt']?.toString() ?? '';
    final dateStr =
        createdAt.length >= 10 ? createdAt.substring(0, 10) : createdAt;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
            color: AppColors.roleNutritionist.withValues(alpha: 0.3), width: 1),
        boxShadow: [
          BoxShadow(
            color: AppColors.roleNutritionist.withValues(alpha: 0.05),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Avatar
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                      color: AppColors.roleNutritionist.withValues(alpha: 0.4),
                      width: 2),
                  color:
                      AppColors.roleNutritionist.withValues(alpha: 0.1),
                  image: photoUrl != null
                      ? DecorationImage(
                          image: NetworkImage(photoUrl), fit: BoxFit.cover)
                      : null,
                ),
                child: photoUrl == null
                    ? Center(
                        child: Text(initial,
                            style: const TextStyle(
                              color: AppColors.roleNutritionist,
                              fontWeight: FontWeight.w800,
                              fontSize: 16,
                            )))
                    : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                    if (dateStr.isNotEmpty)
                      Text(
                        'Requested $dateStr',
                        style: const TextStyle(
                            color: AppColors.textMuted, fontSize: 11),
                      ),
                  ],
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.warning.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                      color: AppColors.warning.withValues(alpha: 0.2)),
                ),
                child: const Text(
                  'PENDING',
                  style: TextStyle(
                    color: AppColors.warning,
                    fontSize: 9,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ],
          ),
          if (message.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              '"$message"',
              style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 12,
                  fontStyle: FontStyle.italic,
                  height: 1.4),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
          const SizedBox(height: 14),
          if (isLoading)
            const Center(
              child: SizedBox(
                  height: 24,
                  width: 24,
                  child: CircularProgressIndicator(
                      color: AppColors.roleNutritionist, strokeWidth: 2)),
            )
          else
            Row(
              children: [
                // Reject button
                Expanded(
                  child: OutlinedButton(
                    onPressed: onReject,
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      side: BorderSide(
                          color: AppColors.error.withValues(alpha: 0.5)),
                      foregroundColor: AppColors.error,
                      minimumSize: Size.zero,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('DECLINE',
                        style: TextStyle(
                            fontSize: 11, fontWeight: FontWeight.w800)),
                  ),
                ),
                const SizedBox(width: 10),
                // Accept button
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: onAccept,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      backgroundColor: AppColors.roleNutritionist,
                      minimumSize: Size.zero,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('ACCEPT',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w800)),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }
}
