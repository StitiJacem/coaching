import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class RecentAthletesCard extends StatelessWidget {
  final List<dynamic> athletes;
  const RecentAthletesCard({super.key, required this.athletes});

  @override
  Widget build(BuildContext context) {
    if (athletes.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: const Center(
          child: Text('No athletes yet',
              style: TextStyle(color: AppColors.textMuted)),
        ),
      );
    }
    return Column(
      children: athletes.take(3).map((a) {
        final name = '${a['first_name'] ?? ''} ${a['last_name'] ?? ''}'.trim();
        final sport = a['sport'] ?? a['sportType'] ?? 'Athlete';
        return ListTile(
          contentPadding: EdgeInsets.zero,
          leading: CircleAvatar(
            backgroundColor: AppColors.primary.withValues(alpha: 0.15),
            child: Text(
              name.isNotEmpty ? name[0].toUpperCase() : 'A',
              style: const TextStyle(
                  color: AppColors.primary, fontWeight: FontWeight.w700),
            ),
          ),
          title: Text(name,
              style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w500)),
          subtitle: Text(sport,
              style: const TextStyle(
                  color: AppColors.textMuted, fontSize: 12)),
          trailing: const Icon(Icons.chevron_right_rounded,
              color: AppColors.textMuted),
        );
      }).toList(),
    );
  }
}
