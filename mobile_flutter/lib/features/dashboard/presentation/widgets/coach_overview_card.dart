import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class CoachOverviewCard extends StatelessWidget {
  final Map<String, dynamic>? stats;
  const CoachOverviewCard({super.key, this.stats});

  @override
  Widget build(BuildContext context) {
    final total = stats?['totalWorkouts'] ?? 0;
    final completed = stats?['completedWorkouts'] ?? 0;
    final adherence = stats?['adherencePercent'] ?? 0;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Team Overview (Last 4 Weeks)',
              style: TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 12,
                  fontWeight: FontWeight.w500)),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _Metric('$total', 'Scheduled'),
              _Divider(),
              _Metric('$completed', 'Completed'),
              _Divider(),
              _Metric('$adherence%', 'Adherence'),
            ],
          ),
          const SizedBox(height: 16),
          // Adherence progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: (adherence as num).toDouble() / 100,
              backgroundColor: AppColors.cardBorder,
              valueColor:
                  const AlwaysStoppedAnimation<Color>(AppColors.success),
              minHeight: 6,
            ),
          ),
        ],
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  final String value;
  final String label;
  const _Metric(this.value, this.label);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value,
            style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary)),
        const SizedBox(height: 4),
        Text(label,
            style: const TextStyle(
                fontSize: 11, color: AppColors.textMuted)),
      ],
    );
  }
}

class _Divider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(width: 1, height: 40, color: AppColors.cardBorder);
  }
}
