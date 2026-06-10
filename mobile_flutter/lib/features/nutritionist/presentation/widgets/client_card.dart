import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

/// Card for displaying a nutritionist client with compliance info.
class ClientCard extends StatelessWidget {
  final Map<String, dynamic> client;
  final VoidCallback onTap;

  const ClientCard({super.key, required this.client, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final athlete = client['athlete'] as Map<String, dynamic>?;
    final user = athlete?['user'] as Map<String, dynamic>? ??
        client['user'] as Map<String, dynamic>? ??
        client;
    final firstName = user['first_name'] ?? user['firstName'] ?? '';
    final lastName = user['last_name'] ?? user['lastName'] ?? '';
    final name =
        '$firstName $lastName'.trim().isEmpty ? 'Client' : '$firstName $lastName';
    final email = user['email'] ?? '';
    final photoUrl = user['photo_url'] ?? user['photoUrl'];
    final initial = firstName.isNotEmpty ? firstName[0].toUpperCase() : 'C';

    final compliance = client['compliance'] as Map<String, dynamic>?;
    final complianceRate =
        (compliance?['adherenceRate'] as num?)?.toDouble() ?? 0.0;

    final activePlan = client['activePlan'] as Map<String, dynamic>?;
    final planName = activePlan?['name'] ?? 'No active plan';
    final hasPlan = activePlan != null;

    final complianceColor = complianceRate >= 80
        ? AppColors.success
        : complianceRate >= 50
            ? AppColors.warning
            : AppColors.error;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.cardBorder),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.15),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          children: [
            // ── Avatar ──────────────────────────────────────────────────────
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                    color: AppColors.roleNutritionist.withValues(alpha: 0.4),
                    width: 2),
                image: photoUrl != null
                    ? DecorationImage(
                        image: NetworkImage(photoUrl), fit: BoxFit.cover)
                    : null,
                color: AppColors.roleNutritionist.withValues(alpha: 0.15),
              ),
              child: photoUrl == null
                  ? Center(
                      child: Text(
                        initial,
                        style: const TextStyle(
                          color: AppColors.roleNutritionist,
                          fontWeight: FontWeight.w800,
                          fontSize: 18,
                        ),
                      ),
                    )
                  : null,
            ),
            const SizedBox(width: 14),

            // ── Info ─────────────────────────────────────────────────────────
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    email,
                    style: const TextStyle(
                        color: AppColors.textMuted, fontSize: 11),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: hasPlan
                              ? AppColors.roleNutritionist.withValues(alpha: 0.1)
                              : AppColors.cardBorder.withValues(alpha: 0.3),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          planName,
                          style: TextStyle(
                            color: hasPlan
                                ? AppColors.roleNutritionist
                                : AppColors.textMuted,
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // ── Compliance badge ─────────────────────────────────────────────
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${complianceRate.toInt()}%',
                  style: TextStyle(
                    color: complianceColor,
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const Text(
                  'compliance',
                  style: TextStyle(
                      color: AppColors.textMuted,
                      fontSize: 9,
                      fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 6),
                // Mini compliance bar
                Container(
                  width: 48,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.cardBorder,
                    borderRadius: BorderRadius.circular(2),
                  ),
                  child: FractionallySizedBox(
                    alignment: Alignment.centerLeft,
                    widthFactor: (complianceRate / 100).clamp(0.0, 1.0),
                    child: Container(
                      decoration: BoxDecoration(
                        color: complianceColor,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 4),
            const Icon(Icons.chevron_right_rounded,
                color: AppColors.textMuted, size: 20),
          ],
        ),
      ),
    );
  }
}
