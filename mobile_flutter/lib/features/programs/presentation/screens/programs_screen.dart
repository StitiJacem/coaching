import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../shared/providers/auth_provider.dart';
import '../../data/programs_repository.dart';
import '../../../connections/data/athletes_repository.dart';

class ProgramsScreen extends ConsumerStatefulWidget {
  const ProgramsScreen({super.key});

  @override
  ConsumerState<ProgramsScreen> createState() => _ProgramsScreenState();
}

class _ProgramsScreenState extends ConsumerState<ProgramsScreen> {
  List<dynamic> _programs = [];
  List<dynamic> _pendingPrograms = [];
  List<dynamic> _activePrograms = [];
  List<dynamic> _athletes = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final user = ref.read(currentUserProvider)!;
      final repo = ref.read(programsRepositoryProvider);
      if (user.role == AppConstants.roleCoach) {
        final results = await Future.wait([
          repo.getAll(),
          ref.read(athletesRepositoryProvider).getMyAthletes(),
        ]);
        _programs = results[0] as List<dynamic>;
        _athletes = results[1] as List<dynamic>;
      } else {
        final results = await Future.wait([
          repo.getAll(status: AppConstants.programAssigned),
          repo.getAll(status: AppConstants.programActive),
          repo.getAll(),
        ]);
        _pendingPrograms = results[0] as List<dynamic>;
        _activePrograms = results[1] as List<dynamic>;
        _programs = (results[2] as List<dynamic>)
            .where((p) => p['status'] == 'completed' || p['status'] == 'quit')
            .toList();
      }
    } catch (e) {
      _error = 'Failed to load programs.';
    }
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
                    Text(
                      isCoach ? 'COACH STUDIO' : 'MY TRAINING',
                      style: const TextStyle(
                          color: AppColors.textMuted,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.5),
                    ),
                    const Text(
                      'PROGRAMS',
                      style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 22,
                          fontWeight: FontWeight.w800),
                    ),
                  ],
                ),
                actions: [
                  if (isCoach)
                    Padding(
                      padding: const EdgeInsets.only(right: 16),
                      child: ElevatedButton.icon(
                        onPressed: () => context.push('/programs/create'),
                        icon: const Icon(Icons.add_rounded, size: 18),
                        label: const Text('New'),
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size(0, 38),
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          textStyle: const TextStyle(
                              fontWeight: FontWeight.w700, fontSize: 13),
                        ),
                      ),
                    ),
                ],
              ),
              if (_loading)
                const SliverFillRemaining(
                  child: Center(
                      child: CircularProgressIndicator(color: AppColors.primary)),
                )
              else if (_error != null)
                SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline_rounded,
                            color: AppColors.textMuted, size: 48),
                        const SizedBox(height: 12),
                        Text(_error!,
                            style: const TextStyle(color: AppColors.textMuted)),
                        const SizedBox(height: 16),
                        TextButton(
                            onPressed: _load,
                            child: const Text('Retry',
                                style: TextStyle(color: AppColors.primary))),
                      ],
                    ),
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.all(16),
                  sliver: SliverList(
                    delegate: SliverChildListDelegate(
                      isCoach
                          ? _buildCoachContent()
                          : _buildAthleteContent(),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  // ─── COACH: grid of their created programs ─────────────────────────────────
  List<Widget> _buildCoachContent() {
    if (_programs.isEmpty) {
      return [_EmptyState(
        label: 'No Programs Formulated',
        sublabel: 'Build periodized training cycles for your athletes.',
        cta: 'Create Multi-Day Program →',
        onCta: () => context.push('/programs/create'),
      )];
    }

    return [
      const _SectionLabel(text: 'YOUR PROGRAMS'),
      const SizedBox(height: 12),
      ..._programs.map((p) => _CoachProgramCard(
        program: p,
        athletes: _athletes,
        onAssigned: _load,
      )),
    ];
  }

  // ─── ATHLETE: pending inbox + active + archived ────────────────────────────
  List<Widget> _buildAthleteContent() {
    return [
      // Pending inbox
      if (_pendingPrograms.isNotEmpty) ...[
        Row(
          children: [
            const Text('PENDING PROGRAMS',
                style: TextStyle(
                    color: AppColors.warning,
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1)),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                  color: AppColors.warning, borderRadius: BorderRadius.circular(20)),
              child: Text('${_pendingPrograms.length} NEW',
                  style: const TextStyle(
                      color: Colors.black,
                      fontSize: 9,
                      fontWeight: FontWeight.w900)),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ..._pendingPrograms.map((p) => _PendingProgramCard(
          program: p,
          onAction: _load,
        )),
        const SizedBox(height: 24),
      ],

      // Active programs
      if (_activePrograms.isNotEmpty) ...[
        const _SectionLabel(text: 'MY PROGRAM LIBRARY'),
        const SizedBox(height: 12),
        ..._activePrograms.map((p) => _ActiveProgramCard(program: p)),
        const SizedBox(height: 12),
      ],

      // Archived
      if (_programs.isNotEmpty) ...[
        if (_activePrograms.isEmpty)
          const _SectionLabel(text: 'MY PROGRAM LIBRARY'),
        if (_activePrograms.isEmpty) const SizedBox(height: 12),
        ..._programs.map((p) => _ArchivedProgramCard(program: p)),
      ],

      // True empty
      if (_pendingPrograms.isEmpty && _activePrograms.isEmpty && _programs.isEmpty)
        _EmptyState(
          label: 'No Active Programs',
          sublabel: 'Your coach will assign a program here when ready.',
          cta: null,
          onCta: null,
        ),
    ];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Coach program card
// ─────────────────────────────────────────────────────────────────────────────
class _CoachProgramCard extends StatelessWidget {
  final Map<String, dynamic> program;
  final List<dynamic> athletes;
  final VoidCallback onAssigned;

  const _CoachProgramCard({
    required this.program,
    required this.athletes,
    required this.onAssigned,
  });

  @override
  Widget build(BuildContext context) {
    final name = program['name'] ?? 'Program';
    final description = program['description'] ?? 'No description provided.';
    final status = program['status'] ?? 'draft';
    final days = (program['days'] as List?)?.length ?? 0;
    final startDate = program['startDate'] ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.layers_rounded,
                    color: AppColors.primary, size: 22),
              ),
              const Spacer(),
              _StatusBadge(status: status),
            ],
          ),
          const SizedBox(height: 12),
          Text(name,
              style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 17,
                  fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text(description,
              style: const TextStyle(
                  color: AppColors.textMuted, fontSize: 13),
              maxLines: 2,
              overflow: TextOverflow.ellipsis),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.calendar_today_rounded,
                  color: AppColors.textMuted, size: 13),
              const SizedBox(width: 4),
              Text(
                startDate.toString().length >= 10
                    ? startDate.toString().substring(0, 10)
                    : startDate.toString(),
                style: const TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 12,
                    fontWeight: FontWeight.w600),
              ),
              const SizedBox(width: 16),
              const Icon(Icons.view_day_rounded,
                  color: AppColors.textMuted, size: 13),
              const SizedBox(width: 4),
              Text('$days Days',
                  style: const TextStyle(
                      color: AppColors.textMuted,
                      fontSize: 12,
                      fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () =>
                      context.push('/programs/${program['id']}/edit'),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(0, 42),
                    side: const BorderSide(color: AppColors.cardBorder),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Modify',
                      style: TextStyle(
                          color: AppColors.textSecondary,
                          fontWeight: FontWeight.w700,
                          fontSize: 12)),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton(
                  onPressed: () => _showAssignSheet(context, program, athletes, onAssigned),
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size(0, 42),
                    backgroundColor: AppColors.primary.withValues(alpha: 0.15),
                    foregroundColor: AppColors.primary,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Assign',
                      style: TextStyle(
                          fontWeight: FontWeight.w800, fontSize: 12)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showAssignSheet(BuildContext context, Map<String, dynamic> program,
      List<dynamic> athletes, VoidCallback onDone) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      isScrollControlled: true,
      builder: (_) => _AssignBottomSheet(
        program: program,
        athletes: athletes,
        onAssigned: onDone,
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Assign bottom sheet
// ─────────────────────────────────────────────────────────────────────────────
class _AssignBottomSheet extends ConsumerStatefulWidget {
  final Map<String, dynamic> program;
  final List<dynamic> athletes;
  final VoidCallback onAssigned;

  const _AssignBottomSheet({
    required this.program,
    required this.athletes,
    required this.onAssigned,
  });

  @override
  ConsumerState<_AssignBottomSheet> createState() => _AssignBottomSheetState();
}

class _AssignBottomSheetState extends ConsumerState<_AssignBottomSheet> {
  int? _selectedAthleteId;
  bool _assigning = false;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
          24, 24, 24, MediaQuery.of(context).viewInsets.bottom + 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Assign Program',
                        style: TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 18,
                            fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    RichText(
                      text: TextSpan(
                        style: const TextStyle(
                            color: AppColors.textMuted, fontSize: 13),
                        children: [
                          const TextSpan(text: 'Assigning '),
                          TextSpan(
                            text: widget.program['name'] ?? '',
                            style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'The athlete will receive a notification and must accept.',
                      style: TextStyle(
                          color: AppColors.warning, fontSize: 11),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.close_rounded,
                    color: AppColors.textMuted),
              ),
            ],
          ),
          const SizedBox(height: 20),
          if (widget.athletes.isEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Row(
                children: [
                  Icon(Icons.info_outline_rounded,
                      color: AppColors.textMuted, size: 18),
                  SizedBox(width: 8),
                  Text('No connected athletes',
                      style: TextStyle(color: AppColors.textMuted)),
                ],
              ),
            )
          else
            Column(
              children: widget.athletes.map((a) {
                final id = a['id'] as int;
                final firstName = a['user']?['first_name'] ?? '';
                final lastName = a['user']?['last_name'] ?? '';
                final name = '$firstName $lastName'.trim();
                final initial =
                    name.isNotEmpty ? name[0].toUpperCase() : 'A';
                final selected = _selectedAthleteId == id;
                return GestureDetector(
                  onTap: () =>
                      setState(() => _selectedAthleteId = id),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: selected
                          ? AppColors.primary.withValues(alpha: 0.12)
                          : AppColors.surfaceVariant,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: selected
                            ? AppColors.primary
                            : Colors.transparent,
                      ),
                    ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 18,
                          backgroundColor: AppColors.primary
                              .withValues(alpha: 0.15),
                          child: Text(initial,
                              style: const TextStyle(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w700)),
                        ),
                        const SizedBox(width: 12),
                        Text(name.isNotEmpty ? name : 'Unknown athlete',
                            style: TextStyle(
                                color: selected
                                    ? AppColors.primary
                                    : AppColors.textPrimary,
                                fontWeight: FontWeight.w600)),
                        const Spacer(),
                        if (selected)
                          const Icon(Icons.check_circle_rounded,
                              color: AppColors.primary, size: 20),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: (_selectedAthleteId == null || _assigning)
                  ? null
                  : _confirm,
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(0, 50),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
              ),
              child: _assigning
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2))
                  : const Text('Confirm Assign',
                      style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _confirm() async {
    setState(() => _assigning = true);
    try {
      await ref.read(programsRepositoryProvider)
          .assignToAthlete(widget.program['id'] as int, _selectedAthleteId!);
      if (mounted) {
        Navigator.pop(context);
        widget.onAssigned();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Program assigned! Athlete will receive a notification.'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _assigning = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Athlete program cards
// ─────────────────────────────────────────────────────────────────────────────
class _PendingProgramCard extends ConsumerWidget {
  final Map<String, dynamic> program;
  final VoidCallback onAction;

  const _PendingProgramCard({required this.program, required this.onAction});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final name = program['name'] ?? 'Program';
    final desc = program['description'] ??
        'Your coach has assigned a new program for you to review.';

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFF2D1F00),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.warning.withValues(alpha: 0.5), width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.warning.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.notifications_active_rounded,
                    color: AppColors.warning, size: 22),
              ),
              const Spacer(),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.warning,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text('NEW ASSIGNMENT',
                    style: TextStyle(
                        color: Colors.black,
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.5)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(name,
              style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 17,
                  fontWeight: FontWeight.w800)),
          const SizedBox(height: 4),
          Text(desc,
              style: const TextStyle(
                  color: Color(0xFFD4A253), fontSize: 13),
              maxLines: 2,
              overflow: TextOverflow.ellipsis),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => _decline(context, ref),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(0, 42),
                    side: BorderSide(
                        color: AppColors.warning.withValues(alpha: 0.4)),
                    foregroundColor: AppColors.warning,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Decline',
                      style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton(
                  onPressed: () => context.push('/programs/${program['id']}'),
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size(0, 42),
                    backgroundColor: AppColors.warning,
                    foregroundColor: Colors.black,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Review & Accept',
                      style: TextStyle(
                          fontWeight: FontWeight.w800, fontSize: 12)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _decline(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Decline Program?',
            style: TextStyle(color: AppColors.textPrimary)),
        content: Text(
            'Are you sure you want to decline "${program['name']}"?',
            style: const TextStyle(color: AppColors.textMuted)),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel')),
          TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Decline',
                  style: TextStyle(color: AppColors.error))),
        ],
      ),
    );
    if (confirmed == true) {
      await ref
          .read(programsRepositoryProvider)
          .updateStatus(program['id'] as int, 'declined');
      onAction();
    }
  }
}

class _ActiveProgramCard extends StatelessWidget {
  final Map<String, dynamic> program;
  const _ActiveProgramCard({required this.program});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.5), width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.bolt_rounded,
                    color: Colors.white, size: 22),
              ),
              const Spacer(),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text('ACTIVE PROGRAM',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.5)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(program['name'] ?? 'My Program',
              style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 17,
                  fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text(program['description'] ?? 'Your current active training plan.',
              style: const TextStyle(
                  color: AppColors.textMuted, fontSize: 13),
              maxLines: 2,
              overflow: TextOverflow.ellipsis),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => context.push('/programs/${program['id']}'),
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(0, 46),
                backgroundColor: AppColors.surfaceVariant,
                foregroundColor: AppColors.textPrimary,
                elevation: 0,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('View Current Schedule',
                  style:
                      TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
            ),
          ),
        ],
      ),
    );
  }
}

class _ArchivedProgramCard extends StatelessWidget {
  final Map<String, dynamic> program;
  const _ArchivedProgramCard({required this.program});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.surfaceVariant,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.archive_rounded,
                color: AppColors.textMuted, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(program['name'] ?? 'Past program',
                    style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 14,
                        fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(
                  _statusLabel(program['status']),
                  style: const TextStyle(
                      color: AppColors.textMuted, fontSize: 11),
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: () => context.push('/programs/${program['id']}'),
            child: const Text('View',
                style: TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w600,
                    fontSize: 12)),
          ),
        ],
      ),
    );
  }

  String _statusLabel(String? status) {
    switch (status) {
      case 'quit':
        return 'Quit';
      case 'completed':
        return 'Completed';
      default:
        return 'Archived';
    }
  }
}

// ─── Shared helper widgets ────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel({required this.text});

  @override
  Widget build(BuildContext context) => Text(
        text,
        style: const TextStyle(
            color: AppColors.textMuted,
            fontSize: 11,
            fontWeight: FontWeight.w800,
            letterSpacing: 1.3),
      );
}

class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    Color color;
    switch (status) {
      case 'active':
        color = AppColors.success;
        break;
      case 'assigned':
        color = AppColors.warning;
        break;
      case 'draft':
        color = AppColors.info;
        break;
      default:
        color = AppColors.textMuted;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
            color: color,
            fontSize: 9,
            fontWeight: FontWeight.w800,
            letterSpacing: 0.8),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final String label;
  final String sublabel;
  final String? cta;
  final VoidCallback? onCta;

  const _EmptyState({
    required this.label,
    required this.sublabel,
    required this.cta,
    required this.onCta,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 60),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(24),
              ),
              child: const Icon(Icons.fitness_center_rounded,
                  color: AppColors.textMuted, size: 36),
            ),
            const SizedBox(height: 20),
            Text(label,
                style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 18,
                    fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Text(sublabel,
                style: const TextStyle(
                    color: AppColors.textMuted, fontSize: 13),
                textAlign: TextAlign.center),
            if (cta != null && onCta != null) ...[
              const SizedBox(height: 20),
              TextButton(
                onPressed: onCta,
                child: Text(cta!,
                    style: const TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w700)),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
