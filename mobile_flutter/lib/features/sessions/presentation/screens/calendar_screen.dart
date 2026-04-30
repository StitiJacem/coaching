import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:coaching_mobile/core/theme/app_theme.dart';
import 'package:coaching_mobile/core/constants/app_constants.dart';
import 'package:coaching_mobile/core/api/api_client.dart';
import 'package:coaching_mobile/shared/providers/auth_provider.dart';
import 'package:coaching_mobile/features/dashboard/data/dashboard_repository.dart';
import 'package:coaching_mobile/features/workout/presentation/screens/workout_builder_screen.dart';
import 'package:coaching_mobile/features/workout/presentation/screens/workout_player_screen.dart';
import 'package:coaching_mobile/shared/widgets/animate_in.dart';

class CalendarScreen extends ConsumerStatefulWidget {
  /// When [athleteId] is provided (coach viewing an athlete's calendar),
  /// we fetch sessions for that specific athlete — otherwise for the current user.
  final int? athleteId;
  const CalendarScreen({super.key, this.athleteId});

  @override
  ConsumerState<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends ConsumerState<CalendarScreen> {
  DateTime _focusedMonth = DateTime.now();
  DateTime? _selectedDay;
  List<dynamic> _sessions = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _selectedDay = DateTime.now();
    _load();
  }

  DateTime get _monthStart =>
      DateTime(_focusedMonth.year, _focusedMonth.month, 1);
  DateTime get _monthEnd =>
      DateTime(_focusedMonth.year, _focusedMonth.month + 1, 0);

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final user = ref.read(currentUserProvider)!;
      final repo = ref.read(dashboardRepositoryProvider);
      final athleteId = widget.athleteId ?? user.id;
      _sessions = await repo.getWeeklySessions(
        athleteId,
        _monthStart.toIso8601String().split('T')[0],
        _monthEnd.toIso8601String().split('T')[0],
      );
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  void _openBuilder(DateTime day, [dynamic session]) async {
    final user = ref.read(currentUserProvider)!;
    if (user.role != AppConstants.roleCoach && widget.athleteId == null) return;

    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (ctx) => WorkoutBuilderScreen(
          athleteId: widget.athleteId,
          date: day,
          existingSession: session,
        ),
      ),
    );

    if (result == true) {
      _load();
    }
  }

  void _onSessionTap(dynamic s) {
    final user = ref.read(currentUserProvider)!;
    final isToday = DateFormat('yyyy-MM-dd').format(DateTime.now()) == s['date'].toString().split('T')[0];

    if (user.role == AppConstants.roleCoach || widget.athleteId != null) {
      _openBuilder(DateTime.parse(s['date'].toString()), s);
    } else {
      // Athlete view
      if (s['status'] == AppConstants.sessionCompleted) {
        // Show summary (later)
      } else {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (ctx) => WorkoutPlayerScreen(workoutLogId: s['id']),
          ),
        );
      }
    }
  }

  void _prevMonth() {
    setState(() {
      _focusedMonth = DateTime(_focusedMonth.year, _focusedMonth.month - 1, 1);
    });
    _load();
  }

  void _nextMonth() {
    setState(() {
      _focusedMonth = DateTime(_focusedMonth.year, _focusedMonth.month + 1, 1);
    });
    _load();
  }

  bool _hasSessionOn(DateTime day) => _sessions.any((s) {
        try {
          final d = DateTime.parse(s['date'].toString());
          return d.year == day.year && d.month == day.month && d.day == day.day;
        } catch (_) {
          return false;
        }
      });

  String _sessionStatusOn(DateTime day) {
    final s = _sessions.where((s) {
      try {
        final d = DateTime.parse(s['date'].toString());
        return d.year == day.year && d.month == day.month && d.day == day.day;
      } catch (_) {
        return false;
      }
    }).toList();
    if (s.isEmpty) return '';
    return s.first['status']?.toString() ?? 'upcoming';
  }

  List<dynamic> _sessionsFor(DateTime day) => _sessions.where((s) {
        try {
          final d = DateTime.parse(s['date'].toString());
          return d.year == day.year && d.month == day.month && d.day == day.day;
        } catch (_) {
          return false;
        }
      }).toList();

  @override
  Widget build(BuildContext context) {
    final isCoachView = widget.athleteId != null;
    final now = DateTime.now();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        surfaceTintColor: Colors.transparent,
        titleSpacing: 16,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              isCoachView ? 'ATHLETE CALENDAR' : 'MY SCHEDULE',
              style: const TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.5),
            ),
            const Text(
              'TRAINING CALENDAR',
              style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 18,
                  fontWeight: FontWeight.w800),
            ),
          ],
        ),
      ),
      body: RefreshIndicator(
        color: AppColors.primary,
        backgroundColor: AppColors.surface,
        onRefresh: _load,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // ── Month navigator ───────────────────────────────────────
                AnimateIn(
                  delay: 100,
                  transitionType: AnimateInTransitionType.slideUp,
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.card,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppColors.cardBorder),
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            IconButton(
                              onPressed: _prevMonth,
                              icon: const Icon(Icons.chevron_left_rounded,
                                  color: AppColors.textSecondary, size: 26),
                            ),
                            Text(
                              _monthLabel(_focusedMonth),
                              style: const TextStyle(
                                  color: AppColors.textPrimary,
                                  fontSize: 17,
                                  fontWeight: FontWeight.w700),
                            ),
                            IconButton(
                              onPressed: _nextMonth,
                              icon: const Icon(Icons.chevron_right_rounded,
                                  color: AppColors.textSecondary, size: 26),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),

                        // Day of week labels
                        Row(
                          children: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                              .map((d) => Expanded(
                                    child: Center(
                                      child: Text(d,
                                          style: const TextStyle(
                                              color: AppColors.textMuted,
                                              fontSize: 11,
                                              fontWeight: FontWeight.w700)),
                                    ),
                                  ))
                              .toList(),
                        ),
                        const SizedBox(height: 10),

                        // Grid of days
                        if (_loading)
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 40),
                            child: Center(
                                child: CircularProgressIndicator(
                                    color: AppColors.primary)),
                          )
                        else
                          _buildGrid(now),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // ── Legend ────────────────────────────────────────────────
                Row(
                  children: [
                    _LegendDot(color: AppColors.primary, label: 'Today'),
                    const SizedBox(width: 16),
                    _LegendDot(color: AppColors.success, label: 'Completed'),
                    const SizedBox(width: 16),
                    _LegendDot(color: AppColors.warning, label: 'Upcoming'),
                    const SizedBox(width: 16),
                    _LegendDot(color: AppColors.error, label: 'Missed'),
                  ],
                ),
                const SizedBox(height: 20),

                // ── Selected day sessions ─────────────────────────────────
                if (_selectedDay != null) ...[
                  Row(
                    children: [
                      Text(
                        _dayLabel(_selectedDay!),
                        style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 17,
                            fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _SessionList(
                    sessions: _sessionsFor(_selectedDay!),
                    onTap: _onSessionTap,
                    onAdd: () => _openBuilder(_selectedDay!),
                    isCoach: widget.athleteId != null || ref.read(userRoleProvider) == AppConstants.roleCoach,
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildGrid(DateTime now) {
    final firstDayOfMonth = _monthStart;
    // Monday-based: 1=Mon,...,7=Sun
    final startWeekday = firstDayOfMonth.weekday; // 1..7
    final daysInMonth = _monthEnd.day;
    final totalCells = ((startWeekday - 1) + daysInMonth);
    final rows = ((totalCells + 6) ~/ 7);

    return Column(
      children: List.generate(rows, (row) {
        return Row(
          children: List.generate(7, (col) {
            final cellIndex = row * 7 + col;
            final dayNum = cellIndex - (startWeekday - 1) + 1;

            if (dayNum < 1 || dayNum > daysInMonth) {
              return const Expanded(child: SizedBox(height: 44));
            }

            final day = DateTime(_focusedMonth.year, _focusedMonth.month, dayNum);
            final isToday = day.year == now.year &&
                day.month == now.month &&
                day.day == now.day;
            final isSelected = _selectedDay != null &&
                day.year == _selectedDay!.year &&
                day.month == _selectedDay!.month &&
                day.day == _selectedDay!.day;
            final hasSession = _hasSessionOn(day);
            final status = _sessionStatusOn(day);

            Color dotColor = AppColors.warning;
            if (status == AppConstants.sessionCompleted) dotColor = AppColors.success;
            if (status == AppConstants.sessionMissed) dotColor = AppColors.error;

            return Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _selectedDay = day),
                child: Container(
                  height: 44,
                  margin: const EdgeInsets.all(2),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? AppColors.primary
                        : isToday
                            ? AppColors.primary.withOpacity(0.15)
                            : Colors.transparent,
                    borderRadius: BorderRadius.circular(10),
                    border: isToday && !isSelected
                        ? Border.all(color: AppColors.primary.withOpacity(0.5))
                        : null,
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        '$dayNum',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight:
                              isSelected || isToday ? FontWeight.w800 : FontWeight.w500,
                          color: isSelected
                              ? Colors.white
                              : AppColors.textPrimary,
                        ),
                      ),
                      if (hasSession)
                        Container(
                          margin: const EdgeInsets.only(top: 3),
                          width: 5,
                          height: 5,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: isSelected ? Colors.white : dotColor,
                          ),
                        )
                      else
                        const SizedBox(height: 8),
                    ],
                  ),
                ),
              ),
            );
          }),
        );
      }),
    );
  }

  String _monthLabel(DateTime d) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return '${months[d.month - 1]} ${d.year}';
  }

  String _dayLabel(DateTime d) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return '${days[d.weekday - 1]}, ${months[d.month - 1]} ${d.day}';
  }
}

class _LegendDot extends StatelessWidget {
  final Color color;
  final String label;
  const _LegendDot({required this.color, required this.label});

  @override
  Widget build(BuildContext context) => Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(shape: BoxShape.circle, color: color),
          ),
          const SizedBox(width: 5),
          Text(label,
              style: const TextStyle(
                  color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w600)),
        ],
      );
}

class _SessionList extends StatelessWidget {
  final List<dynamic> sessions;
  final ValueChanged<dynamic> onTap;
  final VoidCallback onAdd;
  final bool isCoach;
  const _SessionList({
    required this.sessions,
    required this.onTap,
    required this.onAdd,
    required this.isCoach,
  });

  @override
  Widget build(BuildContext context) {
    if (sessions.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: Column(
          children: [
            const Row(
              children: [
                Icon(Icons.self_improvement_rounded,
                    color: AppColors.success, size: 28),
                SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Rest Day',
                          style: TextStyle(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.w700,
                              fontSize: 15)),
                      SizedBox(height: 2),
                      Text('No session scheduled. Recover well!',
                          style: TextStyle(
                              color: AppColors.textMuted, fontSize: 12)),
                    ],
                  ),
                ),
              ],
            ),
            if (isCoach) ...[
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: onAdd,
                icon: const Icon(Icons.add, size: 18),
                label: const Text('SCHEDULE WORKOUT'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary.withOpacity(0.1),
                  foregroundColor: AppColors.primary,
                  minimumSize: const Size(double.infinity, 44),
                ),
              ),
            ],
          ],
        ),
      );
    }

    return Column(
      children: [
        ...sessions.map((s) {
        final status = s['status']?.toString() ?? 'upcoming';
        final programName = s['program']?['name'] ?? s['programName'] ?? 'Workout';
        final dayTitle = s['day']?['title'] ?? s['dayTitle'] ?? '';
        final exerciseCount = (s['day']?['exercises'] as List?)?.length ??
            s['exerciseCount'] ?? 0;

        Color statusColor;
        IconData statusIcon;
        switch (status) {
          case AppConstants.sessionCompleted:
            statusColor = AppColors.success;
            statusIcon = Icons.check_circle_rounded;
            break;
          case AppConstants.sessionMissed:
            statusColor = AppColors.error;
            statusIcon = Icons.cancel_rounded;
            break;
          default:
            statusColor = AppColors.warning;
            statusIcon = Icons.schedule_rounded;
        }

        return GestureDetector(
          onTap: () => onTap(s),
          child: Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: statusColor.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(statusIcon, color: statusColor, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(programName,
                          style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.w700,
                              fontSize: 14)),
                      if (dayTitle.isNotEmpty)
                        Text(dayTitle,
                            style: const TextStyle(
                                color: AppColors.textMuted, fontSize: 12)),
                      if (exerciseCount > 0)
                        Text('$exerciseCount exercises',
                            style: const TextStyle(
                                color: AppColors.textMuted, fontSize: 11)),
                    ],
                  ),
                ),
                if (status == 'upcoming' && !isCoach)
                  ElevatedButton(
                    onPressed: () => onTap(s),
                    style: ElevatedButton.styleFrom(
                      minimumSize: const Size(80, 32),
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      backgroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text('START', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900)),
                  )
                else
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      status.toUpperCase(),
                      style: TextStyle(
                          color: statusColor,
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.5),
                    ),
                  ),
              ],
            ),
          ),
        );
      }).toList(),
      if (isCoach) ...[
        const SizedBox(height: 8),
        ElevatedButton.icon(
          onPressed: onAdd,
          icon: const Icon(Icons.add, size: 18),
          label: const Text('ADD ANOTHER SESSION'),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.surface,
            foregroundColor: AppColors.textSecondary,
            minimumSize: const Size(double.infinity, 44),
          ),
        ),
      ],
    ]);
  }
}
