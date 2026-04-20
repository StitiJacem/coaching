import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'dart:math' as math;
import '../../../../core/theme/app_theme.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../shared/providers/auth_provider.dart';
import '../../../../shared/widgets/stat_card.dart';
import '../../data/dashboard_repository.dart';
import '../../../notifications/data/notifications_repository.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen>
    with SingleTickerProviderStateMixin {
  Map<String, dynamic>? _stats;
  Map<String, dynamic>? _todayWorkout;
  int _unreadCount = 0;
  bool _loading = true;
  List<dynamic> _recentPRs = [];
  List<dynamic> _pendingRequests = [];
  List<dynamic> _pendingPrograms = [];
  List<dynamic> _weeklySessions = [];
  List<dynamic> _recentAthletes = [];

  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 600));
    _fadeAnimation =
        CurvedAnimation(parent: _fadeController, curve: Curves.easeOut);
    _load();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final user = ref.read(currentUserProvider)!;
      final repo = ref.read(dashboardRepositoryProvider);
      final notifRepo = ref.read(notificationsRepositoryProvider);

      final isAthlete = user.role == AppConstants.roleAthlete;
      final isCoach = user.role == AppConstants.roleCoach;

      final results = await Future.wait([
        repo.getStats(role: user.role),
        notifRepo.getUnreadCount(),
        repo.getRecentPRs(role: user.role),
        if (isAthlete) repo.getTodayWorkout(userId: user.id),
        if (isAthlete) repo.getPendingPrograms(user.id),
        if (isAthlete)
          repo.getWeeklySessions(
            user.id,
            _weekStart().toIso8601String().split('T')[0],
            _weekEnd().toIso8601String().split('T')[0],
          ),
        if (isCoach) repo.getMyRequests(),
        if (isCoach) repo.getRecentAthletes(),
      ]);

      _stats = results[0] as Map<String, dynamic>;
      _unreadCount = results[1] as int;
      _recentPRs = results[2] as List<dynamic>;

      int idx = 3;
      if (isAthlete) {
        _todayWorkout = results[idx++] as Map<String, dynamic>?;
        _pendingPrograms = results[idx++] as List<dynamic>;
        _weeklySessions = results[idx++] as List<dynamic>;
      }
      if (isCoach) {
        final reqs = results[idx++] as List<dynamic>;
        _pendingRequests =
            reqs.where((r) => r['status'] == 'pending').toList();
        _recentAthletes = results[idx++] as List<dynamic>;
      }
    } catch (e) {
      debugPrint('[Dashboard] load error: $e');
    }
    if (mounted) {
      setState(() => _loading = false);
      _fadeController.forward(from: 0);
    }
  }

  DateTime _weekStart() {
    final now = DateTime.now();
    return now.subtract(Duration(days: now.weekday - 1));
  }

  DateTime _weekEnd() => _weekStart().add(const Duration(days: 6));

  Future<void> _handleRequest(String id, String status) async {
    try {
      await ref.read(dashboardRepositoryProvider).updateRequestStatus(id, status);
      setState(() =>
          _pendingRequests.removeWhere((r) => r['id'].toString() == id));
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final isCoach = user?.role == AppConstants.roleCoach;
    final isAthlete = user?.role == AppConstants.roleAthlete;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.primary,
          backgroundColor: AppColors.surface,
          onRefresh: _load,
          child: CustomScrollView(
            slivers: [
              // ─── App Bar ──────────────────────────────────────────────────
              SliverAppBar(
                floating: true,
                backgroundColor: AppColors.background,
                surfaceTintColor: Colors.transparent,
                titleSpacing: 16,
                title: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _greeting(),
                      style: const TextStyle(
                          color: AppColors.textMuted,
                          fontSize: 13,
                          fontWeight: FontWeight.w500),
                    ),
                    Text(
                      user?.fullName ?? 'Athlete',
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 19,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
                actions: [
                  // Notification bell
                  Stack(
                    alignment: Alignment.center,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.notifications_outlined,
                            color: AppColors.textPrimary, size: 24),
                        onPressed: () => context.push('/notifications'),
                      ),
                      if (_unreadCount > 0)
                        Positioned(
                          top: 8,
                          right: 8,
                          child: Container(
                            width: 16,
                            height: 16,
                            decoration: const BoxDecoration(
                                color: AppColors.error,
                                shape: BoxShape.circle),
                            child: Center(
                              child: Text(
                                _unreadCount > 9 ? '9+' : '$_unreadCount',
                                style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 9,
                                    fontWeight: FontWeight.w700),
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                  GestureDetector(
                    onTap: () => context.push('/profile'),
                    child: Container(
                      margin: const EdgeInsets.only(right: 16),
                      child: CircleAvatar(
                        radius: 18,
                        backgroundColor:
                            AppColors.primary.withValues(alpha: 0.2),
                        child: Text(
                          user?.firstName.isNotEmpty == true
                              ? user!.firstName[0].toUpperCase()
                              : 'U',
                          style: const TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w700,
                              fontSize: 14),
                        ),
                      ),
                    ),
                  ),
                ],
              ),

              if (_loading)
                const SliverFillRemaining(
                  child: Center(
                      child:
                          CircularProgressIndicator(color: AppColors.primary)),
                )
              else
                SliverFadeTransition(
                  opacity: _fadeAnimation,
                  sliver: SliverPadding(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    sliver: SliverList(
                      delegate: SliverChildListDelegate([
                        // ─── Role Badge ──────────────────────────────────
                        _RoleBadge(role: user?.role ?? 'athlete'),
                        const SizedBox(height: 20),

                        // ─── Hero Header ─────────────────────────────────
                        if (isAthlete) ...[
                          _AthleteHero(
                            firstName: user!.firstName,
                            streak: _stats?['currentStreak'] ?? 0,
                          ),
                          const SizedBox(height: 20),
                        ] else ...[
                          _CoachHero(name: user!.firstName),
                          const SizedBox(height: 20),
                        ],

                        // ─── Stats Grid ──────────────────────────────────
                        if (isCoach)
                          _CoachStatsGrid(stats: _stats)
                        else
                          _AthleteStatsGrid(stats: _stats),
                        const SizedBox(height: 28),

                        // ─── ATHLETE SECTION ─────────────────────────────
                        if (isAthlete) ...[
                          // Weekly schedule
                          _WeeklyScheduleCard(
                            sessions: _weeklySessions,
                            weekStart: _weekStart(),
                          ),
                          const SizedBox(height: 24),

                          // Pending invitations from coaches
                          if (_pendingRequests.isNotEmpty) ...[
                            _SectionHeader(
                              title: 'New Invitations',
                              badge: '${_pendingRequests.length} NEW',
                            ),
                            const SizedBox(height: 12),
                            ..._pendingRequests
                                .map((r) => _InvitationCard(
                                      request: r,
                                      isCoach: false,
                                      onAccept: () => _handleRequest(
                                          r['id'].toString(), 'accepted'),
                                      onReject: () => _handleRequest(
                                          r['id'].toString(), 'rejected'),
                                    ))
                                .toList(),
                            const SizedBox(height: 24),
                          ],

                          // Connect with specialist CTA
                          _ConnectSpecialistBanner(),
                          const SizedBox(height: 24),

                          // Today's workout
                          _SectionHeader(title: "Today's Workout"),
                          const SizedBox(height: 12),
                          _TodayWorkoutCard(data: _todayWorkout),
                          const SizedBox(height: 24),

                          // Pending programs from coach
                          if (_pendingPrograms.isNotEmpty) ...[
                            _SectionHeader(
                              title: 'Pending Programs',
                              actionLabel: 'View All',
                              onAction: () => context.push('/programs'),
                            ),
                            const SizedBox(height: 12),
                            ..._pendingPrograms
                                .take(3)
                                .map((p) => _PendingProgramTile(program: p))
                                .toList(),
                            const SizedBox(height: 24),
                          ],
                        ],

                        // ─── COACH SECTION ───────────────────────────────
                        if (isCoach) ...[
                          // Connection requests
                          if (_pendingRequests.isNotEmpty) ...[
                            _SectionHeader(
                              title: 'Connection Requests',
                              badge: '${_pendingRequests.length} NEW',
                            ),
                            const SizedBox(height: 12),
                            ..._pendingRequests
                                .map((r) => _InvitationCard(
                                      request: r,
                                      isCoach: true,
                                      onAccept: () => _handleRequest(
                                          r['id'].toString(), 'accepted'),
                                      onReject: () => _handleRequest(
                                          r['id'].toString(), 'rejected'),
                                    ))
                                .toList(),
                            const SizedBox(height: 24),
                          ],

                          // Recent athletes
                          if (_recentAthletes.isNotEmpty) ...[
                            _SectionHeader(
                              title: 'Recent Athletes',
                              actionLabel: 'View All',
                              onAction: () => context.push('/athletes'),
                            ),
                            const SizedBox(height: 12),
                            ..._recentAthletes
                                .take(4)
                                .map((a) => _RecentAthleteTile(athlete: a))
                                .toList(),
                            const SizedBox(height: 24),
                          ],
                        ],

                        // ─── Activity Log (PRs) — both roles ────────────
                        _SectionHeader(title: 'Activity Log'),
                        const SizedBox(height: 12),
                        _ActivityLog(prs: _recentPRs, isCoach: isCoach),
                        const SizedBox(height: 32),
                      ]),
                    ),
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

// ─────────────────────────────────────────────────────────────────────────────
// Supporting Widgets
// ─────────────────────────────────────────────────────────────────────────────

class _RoleBadge extends StatelessWidget {
  final String role;
  const _RoleBadge({required this.role});

  Color _color() {
    switch (role) {
      case AppConstants.roleCoach:
        return AppColors.roleCoach;
      case AppConstants.roleDoctor:
        return AppColors.roleDoctor;
      case AppConstants.roleNutritionist:
        return AppColors.roleNutritionist;
      default:
        return AppColors.roleAthlete;
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = _color();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: c.withValues(alpha: 0.3)),
      ),
      child: Text(
        role.toUpperCase(),
        style: TextStyle(
            color: c,
            fontSize: 11,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.2),
      ),
    );
  }
}

class _AthleteHero extends StatelessWidget {
  final String firstName;
  final int streak;
  const _AthleteHero({required this.firstName, required this.streak});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text("TODAY",
                  style: TextStyle(
                      color: AppColors.textMuted,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.5)),
              const SizedBox(height: 4),
              RichText(
                text: TextSpan(
                  style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                      height: 1.1),
                  children: [
                    const TextSpan(text: "LET'S GO,\n"),
                    TextSpan(
                      text: firstName.toUpperCase(),
                      style: const TextStyle(color: AppColors.primary),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0x33E8621A), Color(0x1AE8621A)],
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
          ),
          child: Row(
            children: [
              const Icon(Icons.local_fire_department_rounded,
                  color: AppColors.primary, size: 18),
              const SizedBox(width: 4),
              Text(
                '$streak Day Streak',
                style: const TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                    fontSize: 13),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _CoachHero extends StatelessWidget {
  final String name;
  const _CoachHero({required this.name});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("COACH DASHBOARD",
            style: TextStyle(
                color: AppColors.textMuted,
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.5)),
        const SizedBox(height: 4),
        Text(
          "YOUR ATHLETES",
          style: const TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w800,
            color: AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}

class _CoachStatsGrid extends StatelessWidget {
  final Map<String, dynamic>? stats;
  const _CoachStatsGrid({this.stats});

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.55,
      children: [
        StatCard(
          label: 'ATHLETES',
          value: '${stats?['totalAthletes'] ?? 0}',
          icon: Icons.people_alt_rounded,
          color: AppColors.primary,
        ),
        StatCard(
          label: 'PROGRAMS',
          value: '${stats?['totalPrograms'] ?? 0}',
          icon: Icons.fitness_center_rounded,
          color: AppColors.accent,
        ),
        StatCard(
          label: 'ADHERENCE',
          value: '${stats?['adherencePercent'] ?? 0}%',
          icon: Icons.trending_up_rounded,
          color: AppColors.success,
        ),
        StatCard(
          label: 'TODAY',
          value: '${stats?['todaySessions'] ?? 0}',
          subtext: 'sessions scheduled',
          icon: Icons.today_rounded,
          color: AppColors.info,
        ),
      ],
    );
  }
}

class _AthleteStatsGrid extends StatelessWidget {
  final Map<String, dynamic>? stats;
  const _AthleteStatsGrid({this.stats});

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.55,
      children: [
        StatCard(
          label: 'SESSIONS DONE',
          value: '${stats?['completedSessions'] ?? stats?['totalWorkouts'] ?? 0}',
          subtext: 'Consistency: ${stats?['adherencePercent'] ?? 0}%',
          icon: Icons.check_circle_outline_rounded,
          color: AppColors.primary,
        ),
        StatCard(
          label: 'DAY STREAK',
          value: '${stats?['currentStreak'] ?? 0}',
          subtext: 'Keep it up!',
          icon: Icons.local_fire_department_rounded,
          color: AppColors.warning,
        ),
        StatCard(
          label: 'ADHERENCE',
          value: '${stats?['adherencePercent'] ?? 0}%',
          icon: Icons.trending_up_rounded,
          color: AppColors.success,
        ),
        StatCard(
          label: 'VOLUME',
          value: '${stats?['totalVolumeKg'] ?? 0} kg',
          icon: Icons.speed_rounded,
          color: AppColors.roleNutritionist,
        ),
      ],
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final String? badge;
  final String? actionLabel;
  final VoidCallback? onAction;
  const _SectionHeader({
    required this.title,
    this.badge,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(title,
            style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary)),
        if (badge != null) ...[
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(badge!,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 9,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.5)),
          ),
        ],
        const Spacer(),
        if (actionLabel != null)
          GestureDetector(
            onTap: onAction,
            child: Text(actionLabel!,
                style: const TextStyle(
                    color: AppColors.primary,
                    fontSize: 12,
                    fontWeight: FontWeight.w700)),
          ),
      ],
    );
  }
}

class _WeeklyScheduleCard extends StatelessWidget {
  final List<dynamic> sessions;
  final DateTime weekStart;
  const _WeeklyScheduleCard({required this.sessions, required this.weekStart});

  bool _hasSessionOn(int dayIndex) {
    final day = weekStart.add(Duration(days: dayIndex));
    return sessions.any((s) {
      try {
        final d = DateTime.parse(s['date'].toString());
        return d.year == day.year && d.month == day.month && d.day == day.day;
      } catch (_) {
        return false;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    return Container(
      padding: const EdgeInsets.all(16),
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
              const Text('Weekly Schedule',
                  style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary)),
              Text(
                '${_fmt(weekStart)} – ${_fmt(weekStart.add(const Duration(days: 6)))}',
                style: const TextStyle(
                    fontSize: 10,
                    color: AppColors.textMuted,
                    fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: List.generate(7, (i) {
              final day = weekStart.add(Duration(days: i));
              final isToday = day.year == now.year &&
                  day.month == now.month &&
                  day.day == now.day;
              final hasSession = _hasSessionOn(i);

              return Expanded(
                child: Column(
                  children: [
                    Text(labels[i],
                        style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textMuted)),
                    const SizedBox(height: 6),
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: isToday
                            ? AppColors.primary
                            : AppColors.surfaceVariant,
                        borderRadius: BorderRadius.circular(8),
                        boxShadow: isToday
                            ? [
                                BoxShadow(
                                    color: AppColors.primary.withValues(alpha: 0.3),
                                    blurRadius: 8)
                              ]
                            : null,
                      ),
                      child: Center(
                        child: Text(
                          '${day.day}',
                          style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: isToday
                                  ? Colors.white
                                  : AppColors.textSecondary),
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: hasSession
                            ? AppColors.accent
                            : Colors.transparent,
                        border: Border.all(
                          color: hasSession
                              ? Colors.transparent
                              : AppColors.cardBorder,
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  String _fmt(DateTime d) =>
      '${_months[d.month - 1]} ${d.day}';
  static const _months = [
    'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'
  ];
}

class _TodayWorkoutCard extends StatelessWidget {
  final Map<String, dynamic>? data;
  const _TodayWorkoutCard({this.data});

  @override
  Widget build(BuildContext context) {
    if (data == null) {
      return _RestDayCard();
    }

    final isRestDay = data!['isRestDay'] == true;
    final notStarted = data!['notStarted'] == true;
    final day = data!['day'] as Map<String, dynamic>?;
    final program = data!['program'] as Map<String, dynamic>?;
    final workoutLog = data!['workoutLog'] as Map<String, dynamic>?;

    final name = notStarted
        ? 'Starting Soon'
        : (isRestDay ? 'Rest Day' : (day?['title'] ?? 'Workout'));
    final exerciseCount = (day?['exercises'] as List?)?.length ?? 0;
    final duration = day?['duration'] ?? 45;
    final logStatus = workoutLog?['status'];
    final isCompleted = logStatus == 'completed';
    final isInProgress = logStatus == 'in_progress';
    final progressPct = isCompleted ? 1.0 : (isInProgress ? 0.5 : 0.0);

    String buttonLabel = 'Start Workout';
    if (isCompleted) buttonLabel = 'Workout Done ✓';
    if (isInProgress) buttonLabel = 'Resume Workout';
    if (notStarted) buttonLabel = 'Upcoming';

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row with progress circle
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        notStarted ? 'UPCOMING PROGRAM' : "TODAY'S SESSION",
                        style: const TextStyle(
                            color: AppColors.primary,
                            fontSize: 9,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 1),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      name.toUpperCase(),
                      style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                          height: 1.1),
                    ),
                    if (program != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        program['title'] ?? '',
                        style: const TextStyle(
                            color: AppColors.textMuted, fontSize: 12),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 12),
              // Progress ring
              SizedBox(
                width: 64,
                height: 64,
                child: CustomPaint(
                  painter: _RingPainter(progress: progressPct),
                  child: Center(
                    child: Text(
                      '${(progressPct * 100).toInt()}%',
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 13),
                    ),
                  ),
                ),
              ),
            ],
          ),

          if (!isRestDay && !notStarted) ...[
            const SizedBox(height: 14),
            // Meta row
            Row(
              children: [
                const Icon(Icons.timer_outlined,
                    color: AppColors.textMuted, size: 14),
                const SizedBox(width: 4),
                Text('$duration min',
                    style: const TextStyle(
                        color: AppColors.textSecondary, fontSize: 12)),
                const SizedBox(width: 12),
                const Icon(Icons.fitness_center_rounded,
                    color: AppColors.textMuted, size: 14),
                const SizedBox(width: 4),
                Text('$exerciseCount exercises',
                    style: const TextStyle(
                        color: AppColors.textSecondary, fontSize: 12)),
              ],
            ),
          ],

          if (isRestDay && !notStarted) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.04),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                    color: Colors.white.withValues(alpha: 0.05)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('REST & RECOVER',
                      style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1)),
                  const SizedBox(height: 4),
                  Text(
                    'Next: ${data?['nextDay']?['title'] ?? 'Next Session'}',
                    style: const TextStyle(
                        color: AppColors.primary, fontSize: 12),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 16),
          if (!isRestDay && !isCompleted)
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: notStarted ? null : () => context.push('/schedule'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  minimumSize: const Size(0, 48),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                ),
                child: Text(buttonLabel,
                    style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.5)),
              ),
            ),
          if (isCompleted)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.success.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                    color: AppColors.success.withValues(alpha: 0.3)),
              ),
              child: const Center(
                child: Text('✓ Workout Complete!',
                    style: TextStyle(
                        color: AppColors.success,
                        fontWeight: FontWeight.w700)),
              ),
            ),
        ],
      ),
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
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: AppColors.success.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.self_improvement_rounded,
                color: AppColors.success, size: 26),
          ),
          const SizedBox(width: 16),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('REST DAY',
                    style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                        letterSpacing: 0.5)),
                SizedBox(height: 4),
                Text('No workout today — recover well!',
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

class _ConnectSpecialistBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/discovery'),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFFE8621A), Color(0xFFBF4D10)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Stack(
          children: [
            // glow blob
            Positioned(
              right: -20,
              bottom: -20,
              child: Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.1),
                ),
              ),
            ),
            Row(
              children: [
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'CONNECT WITH\nA SPECIALIST',
                        style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            height: 1.15),
                      ),
                      SizedBox(height: 6),
                      Text(
                        'Padel, Pilates, Musculation & more',
                        style: TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.5),
                      ),
                    ],
                  ),
                ),
                Transform.rotate(
                  angle: 0.2,
                  child: Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [
                        BoxShadow(
                            color: Colors.black.withValues(alpha: 0.2),
                            blurRadius: 8)
                      ],
                    ),
                    child: const Icon(Icons.search_rounded,
                        color: Color(0xFFE8621A), size: 22),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _PendingProgramTile extends StatelessWidget {
  final Map<String, dynamic> program;
  const _PendingProgramTile({required this.program});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: ListTile(
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: AppColors.accent.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(Icons.assignment_rounded,
              color: AppColors.accent, size: 20),
        ),
        title: Text(program['title'] ?? 'Program',
            style: const TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w600,
                fontSize: 14)),
        subtitle: const Text('Tap to review → accept or decline',
            style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
        trailing: const Icon(Icons.arrow_forward_ios_rounded,
            size: 14, color: AppColors.textMuted),
        onTap: () => context.push('/programs'),
      ),
    );
  }
}

class _InvitationCard extends StatelessWidget {
  final Map<String, dynamic> request;
  final bool isCoach;
  final VoidCallback onAccept;
  final VoidCallback onReject;
  const _InvitationCard({
    required this.request,
    required this.isCoach,
    required this.onAccept,
    required this.onReject,
  });

  @override
  Widget build(BuildContext context) {
    // Coach sees athlete info, athlete sees coach info
    final person = isCoach
        ? (request['athlete'] ?? request['athlete'] ?? {})
        : (request['coachProfile']?['user'] ?? {});
    final firstName = person['first_name'] ?? '';
    final lastName = person['last_name'] ?? '';
    final initial = firstName.isNotEmpty ? firstName[0].toUpperCase() : '?';
    final sport = isCoach
        ? (request['athlete']?['sport'] ?? 'Multi-sport')
        : (request['coachProfile']?['specializations']?[0]?['specialization'] ??
            'Performance Coach');
    final message = request['message'] ??
        (isCoach
            ? 'I would like to connect with you.'
            : 'I would like to coach you!');

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: AppColors.primary.withValues(alpha: 0.15),
            child: Text(initial,
                style: const TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w800,
                    fontSize: 17)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('$firstName $lastName'.toUpperCase(),
                    style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                        letterSpacing: 0.3)),
                const SizedBox(height: 2),
                Text(sport,
                    style: const TextStyle(
                        color: AppColors.accent,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.5)),
                const SizedBox(height: 6),
                Text('"$message"',
                    style: const TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 12,
                        fontStyle: FontStyle.italic),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis),
                const SizedBox(height: 12),
                const Divider(color: AppColors.cardBorder, height: 1),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: onAccept,
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Center(
                            child: Text('ACCEPT',
                                style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 1)),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: GestureDetector(
                        onTap: onReject,
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceVariant,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Center(
                            child: Text('IGNORE',
                                style: TextStyle(
                                    color: AppColors.textMuted,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 1)),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RecentAthleteTile extends StatelessWidget {
  final Map<String, dynamic> athlete;
  const _RecentAthleteTile({required this.athlete});

  @override
  Widget build(BuildContext context) {
    final name = athlete['name'] ?? 'Athlete';
    final initial = name.isNotEmpty ? name[0].toUpperCase() : 'A';
    final program = athlete['program'] ?? 'No program';
    final lastActive = athlete['lastActive'] ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: ListTile(
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        leading: CircleAvatar(
          backgroundColor: AppColors.primary.withValues(alpha: 0.15),
          child: Text(initial,
              style: const TextStyle(
                  color: AppColors.primary, fontWeight: FontWeight.w700)),
        ),
        title: Text(name,
            style: const TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w600,
                fontSize: 14)),
        subtitle: Text(program,
            style: const TextStyle(
                color: AppColors.textMuted, fontSize: 12)),
        trailing: Text(
          lastActive.toString().isNotEmpty
              ? lastActive.toString().substring(0, math.min(10, lastActive.toString().length))
              : '',
          style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
        ),
        onTap: () {
          if (athlete['id'] != null) {
            context.push('/athletes');
          }
        },
      ),
    );
  }
}

class _ActivityLog extends StatelessWidget {
  final List<dynamic> prs;
  final bool isCoach;
  const _ActivityLog({required this.prs, required this.isCoach});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: prs.isEmpty
          ? const Padding(
              padding: EdgeInsets.symmetric(vertical: 16.0),
              child: Center(
                child: Text('No recent activity to show.',
                    style: TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 13,
                        fontStyle: FontStyle.italic)),
              ),
            )
          : Column(
              children: prs.take(5).map((pr) {
                final athleteName = pr['athleteName'] ?? '';
                final exercise = pr['exercise'] ?? pr['exerciseName'] ?? '';
                final weight = pr['weight'] ?? 0;
                final date = (pr['date'] ?? '').toString();
                final displayDate = date.length >= 10 ? date.substring(0, 10) : date;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        margin: const EdgeInsets.only(top: 5),
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.primary,
                          boxShadow: [
                            BoxShadow(
                                color: Color(0x55E8621A),
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
                                    color: AppColors.textPrimary,
                                    fontSize: 13),
                                children: [
                                  TextSpan(
                                    text: isCoach
                                        ? (athleteName.isNotEmpty
                                            ? athleteName
                                            : 'Athlete')
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
                                        color: AppColors.textMuted),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(displayDate,
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

// Circular progress ring painter
class _RingPainter extends CustomPainter {
  final double progress;
  _RingPainter({required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2;
    final radius = (size.width - 8) / 2;

    final trackPaint = Paint()
      ..color = const Color(0xFF2D2D2D)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 5;
    canvas.drawCircle(Offset(cx, cy), radius, trackPaint);

    if (progress > 0) {
      final arcPaint = Paint()
        ..color = AppColors.primary
        ..style = PaintingStyle.stroke
        ..strokeWidth = 5
        ..strokeCap = StrokeCap.round;
      canvas.drawArc(
        Rect.fromCircle(center: Offset(cx, cy), radius: radius),
        -math.pi / 2,
        2 * math.pi * progress,
        false,
        arcPaint,
      );
    }
  }

  @override
  bool shouldRepaint(_RingPainter old) => old.progress != progress;
}
