import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/programs_repository.dart';
import '../../../../shared/widgets/animate_in.dart';

class ProgramDetailScreen extends ConsumerStatefulWidget {
  final int programId;
  const ProgramDetailScreen({super.key, required this.programId});

  @override
  ConsumerState<ProgramDetailScreen> createState() => _ProgramDetailScreenState();
}

class _ProgramDetailScreenState extends ConsumerState<ProgramDetailScreen> {
  Map<String, dynamic>? _program;
  bool _loading = true;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final repo = ref.read(programsRepositoryProvider);
      _program = await repo.getById(widget.programId);
    } catch (e) {
      debugPrint('[ProgramDetail] Error loading: $e');
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _accept() async {
    setState(() => _submitting = true);
    try {
      final repo = ref.read(programsRepositoryProvider);
      await repo.acceptProgram(widget.programId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Program accepted! Let\'s start training.'),
            backgroundColor: AppColors.success,
          ),
        );
        context.pop(true); // Return true to refresh parent
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }

    if (_program == null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(backgroundColor: AppColors.background),
        body: const Center(child: Text('Program not found', style: TextStyle(color: AppColors.textMuted))),
      );
    }

    final name = _program!['name'] ?? 'Training Program';
    final desc = _program!['description'] ?? 'No description provided.';
    final status = _program!['status'] ?? 'pending';
    final days = (_program!['days'] as List?) ?? [];
    final coach = _program!['coach']?['user'] != null 
        ? '${_program!['coach']['user']['first_name']} ${_program!['coach']['user']['last_name']}'
        : 'Your Coach';

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          _buildAppBar(name, coach),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  AnimateIn(
                    delay: 100,
                    child: _buildMetaRow(days.length, status),
                  ),
                  const SizedBox(height: 24),
                  AnimateIn(
                    delay: 200,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('DESCRIPTION', 
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.textMuted, letterSpacing: 1.5)),
                        const SizedBox(height: 8),
                        Text(desc, style: const TextStyle(color: AppColors.textSecondary, height: 1.5, fontSize: 14)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),
                  const AnimateIn(
                    delay: 300,
                    child: Text('WORKOUT SCHEDULE', 
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.textMuted, letterSpacing: 1.5)),
                  ),
                  const SizedBox(height: 16),
                  _buildDaysList(days),
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomSheet: (status == 'pending' || status == 'assigned') ? _buildBottomAction() : null,
    );
  }

  Widget _buildAppBar(String name, String coach) {
    return SliverAppBar(
      expandedHeight: 200,
      pinned: true,
      backgroundColor: AppColors.background,
      surfaceTintColor: Colors.transparent,
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                AppColors.primary.withValues(alpha: 0.2),
                AppColors.background,
              ],
            ),
          ),
          child: Stack(
            children: [
              Positioned(
                bottom: 20,
                left: 20,
                right: 20,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      name.toUpperCase(),
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                        color: AppColors.textPrimary,
                        height: 1.1,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'BY $coach'.toUpperCase(),
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                        letterSpacing: 1,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMetaRow(int daysCount, String status) {
    return Row(
      children: [
        _MetaItem(icon: Icons.calendar_today_rounded, label: '$daysCount Days'),
        const SizedBox(width: 16),
        _MetaItem(icon: Icons.fitness_center_rounded, label: 'Full Body'),
        const Spacer(),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: _getStatusColor(status).withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: _getStatusColor(status).withValues(alpha: 0.3)),
          ),
          child: Text(
            status.toUpperCase(),
            style: TextStyle(
              color: _getStatusColor(status),
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 1,
            ),
          ),
        ),
      ],
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'active': return AppColors.success;
      case 'pending':
      case 'assigned': return AppColors.warning;
      case 'completed': return AppColors.info;
      default: return AppColors.textMuted;
    }
  }

  Widget _buildDaysList(List<dynamic> days) {
    if (days.isEmpty) {
      return const Text('No workouts scheduled.', style: TextStyle(color: AppColors.textMuted));
    }

    return Column(
      children: days.asMap().entries.map((entry) {
        final day = entry.value;
        final index = entry.key;
        return AnimateIn(
          delay: 400 + (index * 50),
          child: _DayCard(day: day),
        );
      }).toList(),
    );
  }

  Widget _buildBottomAction() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.background,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        child: SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton(
            onPressed: _submitting ? null : _accept,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              elevation: 0,
            ),
            child: _submitting
                ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('ACCEPT PROGRAM', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, letterSpacing: 1)),
          ),
        ),
      ),
    );
  }
}

class _MetaItem extends StatelessWidget {
  final IconData icon;
  final String label;
  const _MetaItem({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppColors.textMuted),
        const SizedBox(width: 6),
        Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, fontWeight: FontWeight.w600)),
      ],
    );
  }
}

class _DayCard extends StatefulWidget {
  final dynamic day;
  const _DayCard({required this.day});

  @override
  State<_DayCard> createState() => _DayCardState();
}

class _DayCardState extends State<_DayCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final title = widget.day['title'] ?? 'Workout Day';
    final dayNum = widget.day['day_number'] ?? 1;
    final exercises = (widget.day['exercises'] as List?) ?? [];

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        children: [
          ListTile(
            onTap: () => setState(() => _expanded = !_expanded),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            leading: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  '$dayNum',
                  style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w900),
                ),
              ),
            ),
            title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
            subtitle: Text('${exercises.length} Exercises', style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
            trailing: Icon(
              _expanded ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded,
              color: AppColors.textMuted,
            ),
          ),
          if (_expanded) ...[
            const Divider(height: 1),
            ...exercises.map((ex) => _ExerciseTile(exercise: ex)),
            const SizedBox(height: 12),
          ],
        ],
      ),
    );
  }
}

class _ExerciseTile extends StatelessWidget {
  final dynamic exercise;
  const _ExerciseTile({required this.exercise});

  @override
  Widget build(BuildContext context) {
    final name = exercise['exercise_name'] ?? 'Exercise';
    final gif = exercise['exercise_gif'] ?? '';
    final sets = exercise['sets'] ?? 3;
    final reps = exercise['reps'] ?? 12;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: gif.isNotEmpty
                ? CachedNetworkImage(
                    imageUrl: gif,
                    width: 44,
                    height: 44,
                    fit: BoxFit.cover,
                    placeholder: (_, __) => Container(color: AppColors.surfaceVariant),
                    errorWidget: (_, __, ___) => Container(color: AppColors.surfaceVariant, child: const Icon(Icons.fitness_center, size: 20)),
                  )
                : Container(width: 44, height: 44, color: AppColors.surfaceVariant, child: const Icon(Icons.fitness_center, size: 20)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                const SizedBox(height: 2),
                Text('$sets Sets x $reps Reps', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
