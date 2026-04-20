import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../shared/providers/auth_provider.dart';
import '../../../dashboard/data/dashboard_repository.dart';

class AnalyticsScreen extends ConsumerStatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  ConsumerState<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends ConsumerState<AnalyticsScreen> {
  Map<String, dynamic>? _stats;
  List<dynamic> _recentPRs = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final user = ref.read(currentUserProvider)!;
      final repo = ref.read(dashboardRepositoryProvider);
      final results = await Future.wait([
        repo.getStats(role: user.role),
        repo.getRecentPRs(role: user.role),
      ]);
      _stats = results[0] as Map<String, dynamic>;
      _recentPRs = results[1] as List<dynamic>;
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final isCoach = user?.role == AppConstants.roleCoach;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.primary,
          backgroundColor: AppColors.surface,
          onRefresh: _load,
          child: CustomScrollView(
            slivers: [
              SliverAppBar(
                floating: true,
                backgroundColor: AppColors.background,
                surfaceTintColor: Colors.transparent,
                titleSpacing: 16,
                title: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(isCoach ? 'TEAM OVERVIEW' : 'MY PERFORMANCE',
                        style: const TextStyle(
                            color: AppColors.textMuted,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 1.5)),
                    const Text('ANALYTICS',
                        style: TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 22,
                            fontWeight: FontWeight.w800)),
                  ],
                ),
              ),
              if (_loading)
                const SliverFillRemaining(
                  child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.all(16),
                  sliver: SliverList(
                    delegate: SliverChildListDelegate([
                      // ── Key Metrics ────────────────────────────────────
                      if (isCoach)
                        _CoachMetrics(stats: _stats)
                      else
                        _AthleteMetrics(stats: _stats),
                      const SizedBox(height: 24),

                      // ── Adherence visual ───────────────────────────────
                      _AdherenceBar(
                        percent: (_stats?['adherencePercent'] as num?)?.toDouble() ?? 0,
                        label: isCoach ? 'Team Adherence' : 'My Adherence',
                      ),
                      const SizedBox(height: 24),

                      // ── PR Feed / Activity Log ─────────────────────────
                      const _SectionHeader(title: 'Activity Log — Recent PRs'),
                      const SizedBox(height: 12),
                      _PRFeed(prs: _recentPRs, isCoach: isCoach),
                      const SizedBox(height: 40),
                    ]),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Coach metrics
// ─────────────────────────────────────────────────────────────────────────────
class _CoachMetrics extends StatelessWidget {
  final Map<String, dynamic>? stats;
  const _CoachMetrics({this.stats});

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.6,
      children: [
        _MetricTile(
          value: '${stats?['totalAthletes'] ?? 0}',
          label: 'Total Athletes',
          icon: Icons.people_alt_rounded,
          color: AppColors.primary,
        ),
        _MetricTile(
          value: '${stats?['totalPrograms'] ?? 0}',
          label: 'Programs Created',
          icon: Icons.fitness_center_rounded,
          color: AppColors.accent,
        ),
        _MetricTile(
          value: '${stats?['adherencePercent'] ?? 0}%',
          label: 'Team Adherence',
          icon: Icons.trending_up_rounded,
          color: AppColors.success,
        ),
        _MetricTile(
          value: '${stats?['todaySessions'] ?? 0}',
          label: 'Sessions Today',
          icon: Icons.today_rounded,
          color: AppColors.info,
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Athlete metrics
// ─────────────────────────────────────────────────────────────────────────────
class _AthleteMetrics extends StatelessWidget {
  final Map<String, dynamic>? stats;
  const _AthleteMetrics({this.stats});

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.6,
      children: [
        _MetricTile(
          value: '${stats?['completedSessions'] ?? stats?['totalWorkouts'] ?? 0}',
          label: 'Sessions Done',
          icon: Icons.check_circle_rounded,
          color: AppColors.primary,
        ),
        _MetricTile(
          value: '${stats?['currentStreak'] ?? 0} days',
          label: 'Current Streak',
          icon: Icons.local_fire_department_rounded,
          color: AppColors.warning,
        ),
        _MetricTile(
          value: '${stats?['adherencePercent'] ?? 0}%',
          label: 'Adherence',
          icon: Icons.trending_up_rounded,
          color: AppColors.success,
        ),
        _MetricTile(
          value: '${stats?['totalVolumeKg'] ?? 0} kg',
          label: 'Total Volume',
          icon: Icons.speed_rounded,
          color: AppColors.roleNutritionist,
        ),
      ],
    );
  }
}

class _MetricTile extends StatelessWidget {
  final String value;
  final String label;
  final IconData icon;
  final Color color;
  const _MetricTile({
    required this.value,
    required this.label,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(7),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(9),
            ),
            child: Icon(icon, color: color, size: 17),
          ),
          const SizedBox(height: 10),
          Text(value,
              style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  height: 1.1)),
          const SizedBox(height: 2),
          Text(label,
              style: const TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 11,
                  fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _AdherenceBar extends StatelessWidget {
  final double percent;
  final String label;
  const _AdherenceBar({required this.percent, required this.label});

  @override
  Widget build(BuildContext context) {
    final pct = percent.clamp(0, 100);
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label,
                  style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w700,
                      fontSize: 15)),
              Text('${pct.toInt()}%',
                  style: const TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w800,
                      fontSize: 18)),
            ],
          ),
          const SizedBox(height: 14),
          Stack(
            children: [
              Container(
                height: 10,
                decoration: BoxDecoration(
                  color: AppColors.surfaceVariant,
                  borderRadius: BorderRadius.circular(5),
                ),
              ),
              FractionallySizedBox(
                widthFactor: pct / 100,
                child: Container(
                  height: 10,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                        colors: [Color(0xFFE8621A), Color(0xFFFFA05A)]),
                    borderRadius: BorderRadius.circular(5),
                    boxShadow: [
                      BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.4),
                          blurRadius: 6),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            pct >= 80
                ? '🔥 Excellent consistency!'
                : pct >= 50
                    ? '💪 Good — keep pushing!'
                    : '⚠️ Needs improvement.',
            style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) => Text(title,
      style: const TextStyle(
          color: AppColors.textPrimary,
          fontSize: 17,
          fontWeight: FontWeight.w700));
}

class _PRFeed extends StatelessWidget {
  final List<dynamic> prs;
  final bool isCoach;
  const _PRFeed({required this.prs, required this.isCoach});

  @override
  Widget build(BuildContext context) {
    if (prs.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: const Center(
          child: Text('No recent PRs to show.',
              style: TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 13,
                  fontStyle: FontStyle.italic)),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        children: prs.take(10).map((pr) {
          final athleteName = pr['athleteName'] ?? '';
          final exercise = pr['exercise'] ?? pr['exerciseName'] ?? 'Exercise';
          final weight = pr['weight'] ?? 0;
          final date = pr['date']?.toString() ?? '';
          final dateStr = date.length > 10 ? date.substring(0, 10) : date;

          return Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  margin: const EdgeInsets.only(top: 5),
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.primary,
                    boxShadow: [
                      BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.5),
                          blurRadius: 6,
                          spreadRadius: 1),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      RichText(
                        text: TextSpan(
                          style: const TextStyle(
                              color: AppColors.textPrimary, fontSize: 13),
                          children: [
                            TextSpan(
                              text: isCoach && athleteName.isNotEmpty
                                  ? athleteName
                                  : 'You',
                              style: const TextStyle(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w700),
                            ),
                            const TextSpan(text: ' hit a PR in '),
                            TextSpan(
                              text: exercise.toString().toUpperCase(),
                              style: const TextStyle(
                                  color: AppColors.accent,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 12),
                            ),
                            TextSpan(
                              text: '  (${weight}kg)',
                              style: const TextStyle(
                                  color: AppColors.textMuted, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(dateStr,
                          style: const TextStyle(
                              color: AppColors.textMuted,
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 0.5)),
                    ],
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}
