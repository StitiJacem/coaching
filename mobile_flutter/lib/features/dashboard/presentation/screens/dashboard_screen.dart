import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../shared/providers/auth_provider.dart';
import '../../../../shared/widgets/stat_card.dart';
import '../widgets/today_workout_card.dart';
import '../widgets/coach_overview_card.dart';
import '../../data/dashboard_repository.dart';
import '../../../notifications/data/notifications_repository.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  Map<String, dynamic>? _stats;
  Map<String, dynamic>? _todayWorkout;
  int _unreadCount = 0;
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
      final notifRepo = ref.read(notificationsRepositoryProvider);

      final futures = await Future.wait([
        repo.getStats(role: user.role),
        notifRepo.getUnreadCount(),
        if (user.role == AppConstants.roleAthlete)
          repo.getTodayWorkout(userId: user.id),
      ]);

      _stats = futures[0] as Map<String, dynamic>;
      _unreadCount = futures[1] as int;
      if (user.role == AppConstants.roleAthlete && futures.length > 2) {
        _todayWorkout = futures[2] as Map<String, dynamic>?;
      }
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
                title: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _greeting(),
                      style: const TextStyle(
                          color: AppColors.textMuted, fontSize: 13),
                    ),
                    Text(
                      user?.fullName ?? 'Athlete',
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
                actions: [

                  Stack(
                    alignment: Alignment.center,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.notifications_outlined,
                            color: AppColors.textPrimary),
                        onPressed: () => context.push('/notifications'),
                      ),
                      if (_unreadCount > 0)
                        Positioned(
                          top: 8,
                          right: 8,
                          child: Container(
                            width: 18,
                            height: 18,
                            decoration: const BoxDecoration(
                              color: AppColors.error,
                              shape: BoxShape.circle,
                            ),
                            child: Center(
                              child: Text(
                                _unreadCount > 9 ? '9+' : '$_unreadCount',
                                style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700),
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                  IconButton(
                    icon: CircleAvatar(
                      radius: 16,
                      backgroundColor: AppColors.primary.withValues(alpha: 0.2),
                      child: Text(
                        user?.firstName.isNotEmpty == true
                            ? user!.firstName[0].toUpperCase()
                            : 'U',
                        style: const TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w700,
                            fontSize: 13),
                      ),
                    ),
                    onPressed: () => context.push('/profile'),
                  ),
                  const SizedBox(width: 8),
                ],
              ),

              if (_loading)
                const SliverFillRemaining(
                  child: Center(
                    child: CircularProgressIndicator(color: AppColors.primary),
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 8),
                  sliver: SliverList(
                    delegate: SliverChildListDelegate([

                      _RoleBadge(role: user?.role ?? 'athlete'),
                      const SizedBox(height: 20),


                      if (isCoach) ...[
                        _CoachStats(stats: _stats),
                      ] else ...[
                        _AthleteStats(stats: _stats),
                      ],
                      const SizedBox(height: 24),


                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            isCoach ? "Today's Sessions" : "Today's Workout",
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          TextButton(
                            onPressed: () => context.push(
                                isCoach ? '/schedule' : '/schedule'),
                            child: const Text('See all',
                                style: TextStyle(color: AppColors.primary)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      if (!isCoach && _todayWorkout != null)
                        TodayWorkoutCard(data: _todayWorkout!)
                      else if (!isCoach)
                        _RestDayCard()
                      else
                        CoachOverviewCard(stats: _stats),

                      const SizedBox(height: 24),


                      Text('Quick Actions',
                          style: Theme.of(context).textTheme.titleLarge),
                      const SizedBox(height: 12),
                      _QuickActions(isCoach: isCoach),
                      const SizedBox(height: 32),
                    ]),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good morning 👋';
    if (h < 17) return 'Good afternoon 👋';
    return 'Good evening 👋';
  }
}



class _RoleBadge extends StatelessWidget {
  final String role;
  const _RoleBadge({required this.role});

  @override
  Widget build(BuildContext context) {
    Color color;
    switch (role) {
      case AppConstants.roleCoach:
        color = AppColors.roleCoach;
        break;
      case AppConstants.roleDoctor:
        color = AppColors.roleDoctor;
        break;
      case AppConstants.roleNutritionist:
        color = AppColors.roleNutritionist;
        break;
      default:
        color = AppColors.roleAthlete;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        role.toUpperCase(),
        style: TextStyle(
            color: color, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1),
      ),
    );
  }
}

class _CoachStats extends StatelessWidget {
  final Map<String, dynamic>? stats;
  const _CoachStats({this.stats});

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
        StatCard(
          label: 'Athletes',
          value: '${stats?['totalAthletes'] ?? 0}',
          icon: Icons.people_alt_rounded,
          color: AppColors.primary,
        ),
        StatCard(
          label: 'Programs',
          value: '${stats?['totalPrograms'] ?? 0}',
          icon: Icons.fitness_center_rounded,
          color: AppColors.accent,
        ),
        StatCard(
          label: 'Adherence',
          value: '${stats?['adherencePercent'] ?? 0}%',
          icon: Icons.trending_up_rounded,
          color: AppColors.success,
        ),
        StatCard(
          label: 'Today',
          value: '${stats?['todaySessions'] ?? 0} sessions',
          icon: Icons.today_rounded,
          color: AppColors.info,
        ),
      ],
    );
  }
}

class _AthleteStats extends StatelessWidget {
  final Map<String, dynamic>? stats;
  const _AthleteStats({this.stats});

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
        StatCard(
          label: 'Workouts',
          value: '${stats?['totalWorkouts'] ?? 0}',
          icon: Icons.fitness_center_rounded,
          color: AppColors.primary,
        ),
        StatCard(
          label: 'Adherence',
          value: '${stats?['adherencePercent'] ?? 0}%',
          icon: Icons.trending_up_rounded,
          color: AppColors.success,
        ),
        StatCard(
          label: 'Streak',
          value: '${stats?['currentStreak'] ?? 0} days',
          icon: Icons.local_fire_department_rounded,
          color: AppColors.warning,
        ),
        StatCard(
          label: 'Volume',
          value: '${stats?['totalVolumeKg'] ?? 0} kg',
          icon: Icons.speed_rounded,
          color: AppColors.roleNutritionist,
        ),
      ],
    );
  }
}

class _RestDayCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppColors.success.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.self_improvement_rounded,
                color: AppColors.success),
          ),
          const SizedBox(width: 16),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Rest Day',
                    style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary)),
                SizedBox(height: 4),
                Text('No workout scheduled. Recover well!',
                    style: TextStyle(
                        color: AppColors.textSecondary, fontSize: 13)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickActions extends StatelessWidget {
  final bool isCoach;
  const _QuickActions({required this.isCoach});

  @override
  Widget build(BuildContext context) {
    final actions = isCoach
        ? [
            _Action(Icons.person_add_rounded, 'Invite Athlete', '/athletes'),
            _Action(Icons.add_box_rounded, 'New Program', '/programs'),
            _Action(Icons.bar_chart_rounded, 'Analytics', '/analytics'),
          ]
        : [
            _Action(Icons.play_circle_filled_rounded, 'Start Workout', '/schedule'),
            _Action(Icons.history_rounded, 'History', '/workout-history'),
            _Action(Icons.flag_rounded, 'My Goals', '/goals'),
          ];

    return Row(
      children: actions.map((a) {
        return Expanded(
          child: GestureDetector(
            onTap: () => context.push(a.path),
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 4),
              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: Column(
                children: [
                  Icon(a.icon, color: AppColors.primary, size: 26),
                  const SizedBox(height: 8),
                  Text(
                    a.label,
                    style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 11,
                        fontWeight: FontWeight.w500),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _Action {
  final IconData icon;
  final String label;
  final String path;
  _Action(this.icon, this.label, this.path);
}
