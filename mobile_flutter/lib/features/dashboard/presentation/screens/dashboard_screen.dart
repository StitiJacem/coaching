import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:math' as math;
import 'dart:ui';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../shared/providers/auth_provider.dart';
import '../../../../shared/widgets/stat_card.dart';
import '../../data/dashboard_repository.dart';
import '../../../notifications/data/notifications_repository.dart';
import '../../../notifications/presentation/widgets/notification_popup.dart';
import '../../../../shared/widgets/animate_in.dart';
import 'package:coaching_mobile/features/workout/data/workout_log_repository.dart' as coaching_mobile;

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> with SingleTickerProviderStateMixin {
  Map<String, dynamic>? _stats;
  Map<String, dynamic>? _todayWorkout;
  int _unreadCount = 0;
  bool _loading = true;
  List<dynamic> _recentPRs = [];
  List<dynamic> _pendingRequests = [];
  List<dynamic> _pendingPrograms = [];
  List<dynamic> _weeklySessions = [];
  List<dynamic> _recentAthletes = [];
  Map<String, dynamic>? _overview;

  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(vsync: this, duration: const Duration(milliseconds: 800));
    _fadeAnimation = CurvedAnimation(parent: _fadeController, curve: Curves.easeOutCubic);
    _load();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() => _loading = true);
    try {
      final user = ref.read(currentUserProvider);
      if (user == null) return;
      
      final repo = ref.read(dashboardRepositoryProvider);
      final notifRepo = ref.read(notificationsRepositoryProvider);

      final isAthlete = user.role == AppConstants.roleAthlete;
      final isCoach = user.role == AppConstants.roleCoach;

      final results = await Future.wait(<Future<dynamic>>[
        isAthlete ? repo.getAthleteStats(user.id) : repo.getStats(role: user.role),
        notifRepo.getUnreadCount(),
        repo.getRecentPRs(role: user.role),
        if (isAthlete) repo.getTodayWorkout(userId: user.id),
        if (isAthlete) repo.getPendingPrograms(user.id),
        if (isAthlete) repo.getWeeklySessions(user.id, _weekStart().toIso8601String().split('T')[0], _weekEnd().toIso8601String().split('T')[0]),
        if (isCoach) repo.getMyRequests(),
        if (isCoach) repo.getRecentAthletes(),
        if (isAthlete) repo.getAthleteOverview(user.id),
      ]);

      final statsData = results[0];
      if (isCoach && statsData is List) {
        final Map<String, dynamic> normalized = {};
        for (var item in statsData) {
          final label = item['label']?.toString().toLowerCase() ?? '';
          final valStr = item['value']?.toString() ?? '0';
          final numeric = int.tryParse(valStr.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0;
          if (label.contains('athlete')) normalized['totalAthletes'] = numeric;
          if (label.contains('program')) normalized['totalPrograms'] = numeric;
          if (label.contains('session')) normalized['todaySessions'] = numeric;
          if (label.contains('adherence')) normalized['adherencePercent'] = numeric;
        }
        _stats = normalized;
      } else if (statsData is Map<String, dynamic>) {
        _stats = statsData;
      }

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
        _pendingRequests = reqs.where((r) => r['status'] == 'pending').toList();
        _recentAthletes = results[idx++] as List<dynamic>;
      }
      if (isAthlete) {
        _overview = results[results.length - 1] as Map<String, dynamic>?;
      }
    } catch (e) {
      debugPrint('[Dashboard] error: $e');
    } finally {
      if (mounted) {
        setState(() => _loading = false);
        _fadeController.forward(from: 0);
      }
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

  Future<void> _startSession(Map<String, dynamic> workout) async {
    final dayData = workout['day'];
    final programId = workout['program']?['id'];
    final sessionId = dayData?['sessionId'] ?? dayData?['id'];
    if (dayData == null || programId == null) return;
    
    setState(() => _loading = true);
    try {
      final repo = ref.read(coaching_mobile.workoutLogRepositoryProvider);
      final log = await repo.create({
        'athleteId': workout['athleteId'],
        'programId': programId,
        'programDayId': dayData['sessionId'] != null ? null : dayData['id'],
        'sessionId': sessionId,
        'scheduledDate': DateTime.now().toIso8601String().split('T')[0],
      });
      if (mounted) {
        context.push('/workouts/${log['id']}/play');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error starting session: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final isCoach = user?.role == AppConstants.roleCoach;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          // ── Background Glows ──────────────────────────────────────────────
          Positioned(
            top: -100,
            right: -50,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.primary.withValues(alpha: 0.05),
              ),
              child: BackdropFilter(filter: ImageFilter.blur(sigmaX: 100, sigmaY: 100), child: const SizedBox()),
            ),
          ),

          // ── Main Content ──────────────────────────────────────────────────
          SafeArea(
            child: RefreshIndicator(
              color: AppColors.primary,
              onRefresh: _load,
              child: CustomScrollView(
                physics: const BouncingScrollPhysics(),
                slivers: [
                  _buildAppBar(context, user, _unreadCount),
                  if (_loading)
                    const SliverFillRemaining(child: Center(child: CircularProgressIndicator(color: AppColors.primary)))
                  else
                    SliverFadeTransition(
                      opacity: _fadeAnimation,
                      sliver: SliverPadding(
                        padding: const EdgeInsets.fromLTRB(20, 10, 20, 40),
                        sliver: SliverList(
                          delegate: SliverChildListDelegate([
                            _buildHeroSection(user, _stats),
                            const SizedBox(height: 32),
                            _buildStatsGrid(isCoach, _stats),
                            const SizedBox(height: 32),
                            if (!isCoach) ...[
                              _buildWeeklySchedule(),
                              const SizedBox(height: 32),
                              _buildTodayWorkout(),
                            ] else ...[
                              _buildPendingRequests(),
                              const SizedBox(height: 32),
                              _buildRecentAthletes(),
                            ],
                            if (!isCoach && _overview != null) ...[
                              _buildBiometricsSection(_overview!),
                              const SizedBox(height: 32),
                              _buildObservationsSection(_overview!),
                              const SizedBox(height: 32),
                            ],
                            _buildActivityLog(isCoach),
                          ]),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good morning 👋';
    if (h < 17) return 'Good afternoon 👋';
    return 'Good evening 👋';
  }

  Widget _buildHeroSection(user, stats) {
    final isAthlete = user?.role == AppConstants.roleAthlete;
    final name = user?.firstName ?? 'Athlete';
    
    if (isAthlete) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'TODAY',
            style: TextStyle(
              color: AppColors.textMuted,
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            "LET'S GO, ${name.toUpperCase()}",
            style: GoogleFonts.bebasNeue(
              color: Colors.white,
              fontSize: 48,
              letterSpacing: 1.5,
              height: 1.0,
            ),
          ),
        ],
      );
    } else {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'OVERVIEW',
            style: TextStyle(
              color: AppColors.textMuted,
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            "COACH DASHBOARD",
            style: GoogleFonts.bebasNeue(
              color: Colors.white,
              fontSize: 48,
              letterSpacing: 1.5,
              height: 1.0,
            ),
          ),
        ],
      );
    }
  }

  Widget _buildBiometricsSection(Map<String, dynamic> overview) {
    final metrics = (overview['metrics'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final lastMetric = metrics.isNotEmpty ? metrics.first : null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text("BIOMÉTRIE & PERF", style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1.5)),
            GestureDetector(
              onTap: () => _showAddMetricModal(),
              child: const Text("LOG DATA +", style: TextStyle(color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic)),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _MetricCard(
                label: "POIDS",
                value: "${lastMetric?['weight'] ?? '--'}",
                unit: "KG",
                trend: "stable",
                icon: Icons.monitor_weight_rounded,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _MetricCard(
                label: "GRAS",
                value: "${lastMetric?['bodyFat'] ?? '--'}",
                unit: "%",
                trend: "down",
                icon: Icons.percent_rounded,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildObservationsSection(Map<String, dynamic> overview) {
    final athlete = overview['athlete'] as Map<String, dynamic>?;
    final notes = athlete?['notes'] ?? "Aucune observation technique pour le moment.";
    final injuries = athlete?['injuries'] ?? "Aucune contre-indication signalée.";

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("PROFESSIONAL FEEDBACK", style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1.5)),
        const SizedBox(height: 16),
        AppTheme.glassCard(
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.psychology_rounded, color: AppColors.primary, size: 18),
                    SizedBox(width: 8),
                    Text("NOTES DU SPECIALISTE", style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w800)),
                  ],
                ),
                const SizedBox(height: 10),
                Text(notes, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.5)),
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: Colors.red.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(15), border: Border.all(color: Colors.red.withValues(alpha: 0.2))),
                  child: Row(
                    children: [
                      const Icon(Icons.warning_amber_rounded, color: Colors.redAccent, size: 18),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text("LIMITATIONS / BLESSURES", style: TextStyle(color: Colors.redAccent, fontSize: 10, fontWeight: FontWeight.w900)),
                            const SizedBox(height: 4),
                            Text(injuries, style: const TextStyle(color: Colors.white70, fontSize: 12)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  void _showAddMetricModal() {
    final weightController = TextEditingController();
    final bodyFatController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 24, right: 24, top: 40),
          decoration: const BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.vertical(top: Radius.circular(40))),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text("LOG NEW BIOMETRICS", style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic)),
              const SizedBox(height: 32),
              TextField(
                controller: weightController,
                keyboardType: TextInputType.number,
                style: const TextStyle(color: Colors.white),
                decoration: AppTheme.inputDecoration(label: "WEIGHT (KG)", icon: Icons.monitor_weight_rounded),
              ),
              const SizedBox(height: 20),
              TextField(
                controller: bodyFatController,
                keyboardType: TextInputType.number,
                style: const TextStyle(color: Colors.white),
                decoration: AppTheme.inputDecoration(label: "BODY FAT (%)", icon: Icons.percent_rounded),
              ),
              const SizedBox(height: 40),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    if (weightController.text.isEmpty) return;
                    try {
                      final user = ref.read(currentUserProvider);
                      await ref.read(dashboardRepositoryProvider).addMetric(user!.id, {
                        'weight': double.parse(weightController.text),
                        'bodyFat': bodyFatController.text.isNotEmpty ? double.parse(bodyFatController.text) : null,
                        'date': DateTime.now().toIso8601String(),
                      });
                      if (context.mounted) Navigator.pop(context);
                      _load();
                    } catch (e) {
                      debugPrint("Add metric error: $e");
                    }
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, padding: const EdgeInsets.symmetric(vertical: 20), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                  child: const Text("CONFIRM ENTRY", style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 2)),
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  // ── App bar ──────────────────────────────────────────────────────────────────
  Widget _buildAppBar(BuildContext context, user, int unreadCount) {
    return SliverAppBar(
      floating: true,
      pinned: false,
      backgroundColor: AppColors.background,
      surfaceTintColor: Colors.transparent,
      titleSpacing: 20,
      title: Text(
        _greeting(),
        style: const TextStyle(
          color: AppColors.textMuted,
          fontSize: 13,
          fontWeight: FontWeight.w600,
        ),
      ),
      actions: [
        Stack(
          children: [
            IconButton(
              icon: const Icon(Icons.notifications_outlined, color: AppColors.textSecondary, size: 26),
              onPressed: () => context.push('/notifications'),
            ),
            if (unreadCount > 0)
              Positioned(
                right: 10,
                top: 10,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: AppColors.primary,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  // ── Stats grid ───────────────────────────────────────────────────────────────
  Widget _buildStatsGrid(bool isCoach, Map<String, dynamic>? stats) {
    if (stats == null || stats.isEmpty) return const SizedBox.shrink();

    List<Map<String, dynamic>> tiles;
    if (isCoach) {
      tiles = [
        {'label': 'ATHLETES', 'value': '${stats['totalAthletes'] ?? 0}', 'icon': Icons.group_rounded, 'color': AppColors.primary},
        {'label': 'PROGRAMS', 'value': '${stats['totalPrograms'] ?? 0}', 'icon': Icons.assignment_rounded, 'color': AppColors.accent},
        {'label': 'SESSIONS TODAY', 'value': '${stats['todaySessions'] ?? 0}', 'icon': Icons.today_rounded, 'color': AppColors.success},
        {'label': 'ADHERENCE', 'value': '${stats['adherencePercent'] ?? 0}%', 'icon': Icons.trending_up_rounded, 'color': AppColors.warning},
      ];
    } else {
      tiles = [
        {'label': 'WORKOUTS', 'value': '${stats['totalWorkouts'] ?? 0}', 'icon': Icons.fitness_center_rounded, 'color': AppColors.primary},
        {'label': 'THIS WEEK', 'value': '${stats['weeklyWorkouts'] ?? 0}', 'icon': Icons.calendar_view_week_rounded, 'color': AppColors.accent},
        {'label': 'STREAK', 'value': '${stats['streak'] ?? 0}d', 'icon': Icons.local_fire_department_rounded, 'color': Colors.orangeAccent},
        {'label': 'ADHERENCE', 'value': '${stats['adherenceRate'] ?? 0}%', 'icon': Icons.trending_up_rounded, 'color': AppColors.success},
      ];
    }

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      childAspectRatio: 1.6,
      children: tiles.map((t) => StatCard(
        label: t['label'] as String,
        value: t['value'] as String,
        icon: t['icon'] as IconData,
        color: t['color'] as Color,
      )).toList(),
    );
  }

  // ── Weekly schedule ──────────────────────────────────────────────────────────
  Widget _buildWeeklySchedule() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('THIS WEEK', style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.5)),
        const SizedBox(height: 16),
        _WeeklyScheduleCard(sessions: _weeklySessions, weekStart: _weekStart()),
      ],
    );
  }

  // ── Today workout ────────────────────────────────────────────────────────────
  Widget _buildTodayWorkout() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("TODAY'S SESSION", style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.5)),
        const SizedBox(height: 16),
        _StartSessionBanner(
          workout: _todayWorkout,
          onStart: _startSession,
        ),
        const SizedBox(height: 16),
        _TodayWorkoutCard(data: _todayWorkout),
        if (_pendingPrograms.isNotEmpty) ...[
          const SizedBox(height: 24),
          const Text('PENDING PROGRAMS', style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.5)),
          const SizedBox(height: 12),
          ..._pendingPrograms.map((p) => _PendingProgramTile(program: p as Map<String, dynamic>)),
        ],
      ],
    );
  }

  // ── Pending requests (coach) ─────────────────────────────────────────────────
  Widget _buildPendingRequests() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('PENDING REQUESTS', style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.5)),
            if (_pendingRequests.isNotEmpty)
              Text('${_pendingRequests.length}', style: const TextStyle(color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.w900)),
          ],
        ),
        const SizedBox(height: 16),
        if (_pendingRequests.isEmpty)
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.cardBorder)),
            child: const Center(child: Text('No pending requests', style: TextStyle(color: AppColors.textMuted, fontSize: 13))),
          )
        else
          ..._pendingRequests.map((r) => _InvitationCard(
                request: r as Map<String, dynamic>,
                isCoach: true,
                onAccept: () => _handleRequest(r['id'].toString(), 'accepted'),
                onReject: () => _handleRequest(r['id'].toString(), 'rejected'),
              )),
      ],
    );
  }

  // ── Recent athletes (coach) ──────────────────────────────────────────────────
  Widget _buildRecentAthletes() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('RECENT ATHLETES', style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.5)),
        const SizedBox(height: 16),
        if (_recentAthletes.isEmpty)
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.cardBorder)),
            child: const Center(child: Text('No athletes yet', style: TextStyle(color: AppColors.textMuted, fontSize: 13))),
          )
        else
          ..._recentAthletes.map((a) => _RecentAthleteTile(athlete: a as Map<String, dynamic>)),
      ],
    );
  }

  // ── Activity log ─────────────────────────────────────────────────────────────
  Widget _buildActivityLog(bool isCoach) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('RECENT ACTIVITY', style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.5)),
        const SizedBox(height: 16),
        _ActivityLog(prs: _recentPRs, isCoach: isCoach),
      ],
    );
  }
} // end _DashboardScreenState


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
      onTap: () => context.push('/specialists'),
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
                        'MY CONNECTED\nSPECIALISTS',
                        style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            height: 1.15),
                      ),
                      SizedBox(height: 6),
                      Text(
                        'Coaches & Nutritionists',
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
                    child: const Icon(Icons.people_rounded,
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

class _NutritionistBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/nutrition'),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF2E7D32), Color(0xFF1B5E20)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.green.withValues(alpha: 0.2),
              blurRadius: 15,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'TRACK YOUR\nNUTRITION',
                    style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        height: 1.15),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'AI Scan & Nutritionist Plans',
                    style: TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.5),
                  ),
                ],
              ),
            ),
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(Icons.restaurant_rounded,
                  color: Color(0xFF2E7D32), size: 22),
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

class _StartSessionBanner extends StatelessWidget {
  final Map<String, dynamic>? workout;
  final void Function(Map<String, dynamic>)? onStart;
  const _StartSessionBanner({this.workout, this.onStart});

  @override
  Widget build(BuildContext context) {
    final hasWorkout = workout != null && workout!['isRestDay'] == false && workout!['day'] != null;
    final dayData = hasWorkout ? workout!['day'] : null;
    final sessionId = dayData?['sessionId'] ?? dayData?['id'];
    
    return GestureDetector(
      onTap: () {
        if (hasWorkout && sessionId != null) {
          if (onStart != null) {
            onStart!(workout!);
          } else {
            context.push('/workouts/$sessionId/play');
          }
        } else {
          context.push('/schedule');
        }
      },
      child: Container(
        width: double.infinity,
        margin: const EdgeInsets.symmetric(vertical: 8),
        padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: hasWorkout ? const [Color(0xFFE8621A), Color(0xFFFF8B45)] : const [AppColors.surfaceVariant, AppColors.card],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: hasWorkout ? [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.4),
              blurRadius: 15,
              offset: const Offset(0, 8),
              spreadRadius: 2,
            ),
          ] : null,
          border: hasWorkout ? null : Border.all(color: AppColors.cardBorder),
        ),
        child: Column(
          children: [
            Icon(
              hasWorkout ? Icons.play_circle_fill_rounded : Icons.calendar_month_rounded, 
              color: hasWorkout ? Colors.white : AppColors.primary, 
              size: 48
            ),
            const SizedBox(height: 12),
            Text(
              hasWorkout ? 'START SESSION' : 'NO SESSION TODAY',
              style: TextStyle(
                color: hasWorkout ? Colors.white : AppColors.textPrimary,
                fontSize: 24,
                fontWeight: FontWeight.w900,
                letterSpacing: hasWorkout ? 2.0 : 1.0,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              hasWorkout ? (dayData?['title'] ?? 'Today\'s Workout') : 'Tap to browse calendar',
              style: TextStyle(
                color: hasWorkout ? Colors.white70 : AppColors.textMuted,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  final String label;
  final String value;
  final String unit;
  final String trend;
  final IconData icon;

  const _MetricCard({
    required this.label,
    required this.value,
    required this.unit,
    required this.trend,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return AppTheme.glassCard(
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Icon(icon, color: AppColors.textMuted, size: 16),
                if (trend == "up")
                  const Icon(Icons.trending_up_rounded, color: AppColors.success, size: 14)
                else if (trend == "down")
                  const Icon(Icons.trending_down_rounded, color: Colors.blueAccent, size: 14)
                else
                  const Icon(Icons.trending_flat_rounded, color: AppColors.textMuted, size: 14),
              ],
            ),
            const SizedBox(height: 12),
            Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
            const SizedBox(height: 4),
            Row(
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: [
                Text(value, style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -1)),
                const SizedBox(width: 4),
                Text(unit, style: const TextStyle(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w800)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// Performance Ring Painter for Hero Section
class _PerformanceRingPainter extends CustomPainter {
  final double progress;
  _PerformanceRingPainter(this.progress);

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;
    final strokeWidth = 8.0;

    final bgPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.05)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;

    final progressPaint = Paint()
      ..color = AppColors.primary
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius - strokeWidth / 2, bgPaint);
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius - strokeWidth / 2),
      -math.pi / 2,
      2 * math.pi * progress,
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
