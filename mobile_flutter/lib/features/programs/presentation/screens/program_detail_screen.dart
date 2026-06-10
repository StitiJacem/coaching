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
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('✅ MISSION ACCEPTED. LET\'S GRIND.'), backgroundColor: AppColors.success, behavior: SnackBarBehavior.floating));
        context.pop(true);
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('ERROR: $e'), backgroundColor: AppColors.error));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(backgroundColor: AppColors.background, body: Center(child: CircularProgressIndicator(color: AppColors.primary)));
    if (_program == null) return Scaffold(backgroundColor: AppColors.background, appBar: AppBar(backgroundColor: Colors.transparent), body: const Center(child: Text('PROGRAM NOT FOUND', style: TextStyle(color: AppColors.textMuted))));

    final name = _program!['name'] ?? 'Training Program';
    final desc = _program!['description'] ?? 'No description provided.';
    final status = _program!['status'] ?? 'pending';
    final days = (_program!['days'] as List?) ?? [];
    final coach = _program!['coach']?['user'] != null ? '${_program!['coach']['user']['first_name']} ${_program!['coach']['user']['last_name']}' : 'SYSTEM';

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              _buildAppBar(name, coach),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildInfoGrid(days.length, status),
                      const SizedBox(height: 40),
                      const Text('OBJECTIVE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: AppColors.textMuted, letterSpacing: 2)),
                      const SizedBox(height: 12),
                      Text(desc, style: const TextStyle(color: Colors.white70, fontSize: 15, height: 1.6, fontWeight: FontWeight.w500)),
                      const SizedBox(height: 48),
                      const Text('TRAINING SCHEDULE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: AppColors.textMuted, letterSpacing: 2)),
                      const SizedBox(height: 20),
                      _buildDaysList(days),
                      const SizedBox(height: 120),
                    ],
                  ),
                ),
              ),
            ],
          ),
          if (status == 'pending' || status == 'assigned') Positioned(bottom: 0, left: 0, right: 0, child: _buildBottomAction()),
        ],
      ),
    );
  }

  Widget _buildAppBar(String name, String coach) {
    return SliverAppBar(
      expandedHeight: 300,
      pinned: true,
      stretch: true,
      backgroundColor: AppColors.background,
      flexibleSpace: FlexibleSpaceBar(
        stretchModes: const [StretchMode.zoomBackground, StretchMode.blurBackground],
        background: Stack(
          fit: StackFit.expand,
          children: [
            Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(colors: [Color(0xFF1A1A1A), Colors.transparent], begin: Alignment.bottomCenter, end: Alignment.topCenter),
              ),
            ),
            Positioned(
              bottom: 30, left: 24, right: 24,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(4)), child: const Text('ELITE PROGRAM', style: TextStyle(color: Colors.black, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1))),
                  const SizedBox(height: 12),
                  Text(name.toUpperCase(), style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white, height: 1.0, letterSpacing: -1)),
                  const SizedBox(height: 8),
                  Text('CURATED BY $coach', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textMuted, letterSpacing: 0.5)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoGrid(int days, String status) {
    return Row(
      children: [
        Expanded(child: _InfoTile(label: 'DURATION', value: '$days DAYS', icon: Icons.calendar_month_rounded)),
        const SizedBox(width: 16),
        Expanded(child: _InfoTile(label: 'DIFFICULTY', value: 'ADVANCED', icon: Icons.bolt_rounded, color: AppColors.primary)),
        const SizedBox(width: 16),
        Expanded(child: _InfoTile(label: 'STATUS', value: status.toUpperCase(), icon: Icons.info_outline_rounded, color: _getStatusColor(status))),
      ],
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'active': return AppColors.success;
      case 'pending':
      case 'assigned': return AppColors.warning;
      default: return AppColors.textMuted;
    }
  }

  Widget _buildDaysList(List<dynamic> days) {
    return Column(children: List.generate(days.length, (i) => AnimateIn(delay: i * 80, child: _DayCard(day: days[i]))));
  }

  Widget _buildBottomAction() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(gradient: LinearGradient(colors: [Colors.transparent, AppColors.background.withValues(alpha: 0.9), AppColors.background], begin: Alignment.topCenter, end: Alignment.bottomCenter)),
      child: ElevatedButton(
        onPressed: _submitting ? null : _accept,
        style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.black, minimumSize: const Size(double.infinity, 64), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)), elevation: 20, shadowColor: AppColors.primary.withValues(alpha: 0.3)),
        child: _submitting ? const CircularProgressIndicator(color: Colors.black) : const Text('DEPLOY PROGRAM', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, letterSpacing: 2)),
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color? color;

  const _InfoTile({required this.label, required this.value, required this.icon, this.color});

  @override
  Widget build(BuildContext context) {
    return AppTheme.glassCard(
      opacity: 0.05,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 18, color: color ?? AppColors.textMuted),
            const SizedBox(height: 12),
            Text(label, style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: AppColors.textMuted, letterSpacing: 1)),
            const SizedBox(height: 4),
            Text(value, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: color ?? Colors.white, letterSpacing: -0.2)),
          ],
        ),
      ),
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

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(color: _expanded ? AppColors.surface : AppColors.card, borderRadius: BorderRadius.circular(24), border: Border.all(color: _expanded ? AppColors.primary.withValues(alpha: 0.3) : AppColors.cardBorder, width: 2)),
      child: Column(
        children: [
          ListTile(
            onTap: () => setState(() => _expanded = !_expanded),
            contentPadding: const EdgeInsets.all(20),
            leading: Container(width: 48, height: 48, decoration: BoxDecoration(color: AppColors.surfaceVariant, borderRadius: BorderRadius.circular(14)), child: Center(child: Text('$dayNum', style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w900, fontSize: 18)))),
            title: Text(title.toString().toUpperCase(), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, letterSpacing: -0.2)),
            subtitle: Text('${exercises.length} EXERCISES', style: const TextStyle(fontSize: 10, color: AppColors.textMuted, fontWeight: FontWeight.w900, letterSpacing: 1)),
            trailing: Icon(_expanded ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded, color: AppColors.textMuted),
          ),
          if (_expanded) ...[
            const Divider(height: 1, color: AppColors.cardBorder),
            ...exercises.map((ex) => _ExerciseTile(exercise: ex)),
            const SizedBox(height: 20),
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
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Row(
        children: [
          Container(
            width: 52, height: 52,
            decoration: BoxDecoration(color: AppColors.surfaceVariant, borderRadius: BorderRadius.circular(12)),
            child: ClipRRect(borderRadius: BorderRadius.circular(12), child: gif.isNotEmpty ? CachedNetworkImage(imageUrl: gif, fit: BoxFit.cover, errorWidget: (_,__,___) => const Icon(Icons.fitness_center)) : const Icon(Icons.fitness_center)),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name.toString().toUpperCase(), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: -0.2)),
                const SizedBox(height: 4),
                Text('$sets SETS × $reps REPS', style: const TextStyle(fontSize: 10, color: AppColors.textMuted, fontWeight: FontWeight.w900)),
              ],
            ),
          ),
        ],
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


