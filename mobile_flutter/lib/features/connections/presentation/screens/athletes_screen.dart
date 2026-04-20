import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../shared/providers/auth_provider.dart';
import '../../data/athletes_repository.dart';
import '../../../programs/data/programs_repository.dart';

class AthletesScreen extends ConsumerStatefulWidget {
  const AthletesScreen({super.key});

  @override
  ConsumerState<AthletesScreen> createState() => _AthletesScreenState();
}

class _AthletesScreenState extends ConsumerState<AthletesScreen> {
  List<dynamic> _athletes = [];
  List<dynamic> _filtered = [];
  List<dynamic> _programs = [];
  bool _loading = true;
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        ref.read(athletesRepositoryProvider).getMyAthletes(),
        ref.read(programsRepositoryProvider).getAll(),
      ]);
      _athletes = results[0] as List<dynamic>;
      _programs = results[1] as List<dynamic>;
      _applyFilter();
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  void _applyFilter() {
    final q = _searchCtrl.text.toLowerCase();
    setState(() {
      _filtered = q.isEmpty
          ? List.from(_athletes)
          : _athletes.where((a) {
              final fn = (a['user']?['first_name'] ?? '').toLowerCase();
              final ln = (a['user']?['last_name'] ?? '').toLowerCase();
              final em = (a['user']?['email'] ?? '').toLowerCase();
              return fn.contains(q) || ln.contains(q) || em.contains(q);
            }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final isCoach = user?.role == AppConstants.roleCoach;

    // Nutritionist/Doctor see same Athletes list too
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.primary,
          backgroundColor: AppColors.surface,
          onRefresh: _load,
          child: CustomScrollView(
            slivers: [
              // ── Header ────────────────────────────────────────────────────
              SliverAppBar(
                floating: true,
                backgroundColor: AppColors.background,
                surfaceTintColor: Colors.transparent,
                titleSpacing: 16,
                title: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('MANAGEMENT',
                        style: TextStyle(
                            color: AppColors.textMuted,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 1.5)),
                    Text(
                      isCoach ? 'CLIENTS' : 'MY ATHLETES',
                      style: const TextStyle(
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
                        onPressed: () => _showInviteSheet(context),
                        icon: const Icon(Icons.person_add_rounded, size: 18),
                        label: const Text('Add'),
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size(0, 38),
                          padding: const EdgeInsets.symmetric(horizontal: 14),
                          textStyle: const TextStyle(
                              fontWeight: FontWeight.w700, fontSize: 13),
                        ),
                      ),
                    ),
                ],
                bottom: PreferredSize(
                  preferredSize: const Size.fromHeight(60),
                  child: Padding(
                    padding:
                        const EdgeInsets.fromLTRB(16, 0, 16, 12),
                    child: TextField(
                      controller: _searchCtrl,
                      onChanged: (_) => _applyFilter(),
                      style: const TextStyle(color: AppColors.textPrimary),
                      decoration: InputDecoration(
                        hintText: 'Search clients...',
                        prefixIcon: const Icon(Icons.search_rounded,
                            color: AppColors.textMuted, size: 20),
                        contentPadding:
                            const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide:
                              const BorderSide(color: AppColors.cardBorder),
                        ),
                      ),
                    ),
                  ),
                ),
              ),

              // ── Content ───────────────────────────────────────────────────
              if (_loading)
                const SliverFillRemaining(
                  child: Center(
                      child: CircularProgressIndicator(color: AppColors.primary)),
                )
              else if (_filtered.isEmpty)
                SliverFillRemaining(
                  child: _EmptyAthletes(onInvite: () => _showInviteSheet(context)),
                )
              else
                SliverPadding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, i) => _AthleteRow(
                        athlete: _filtered[i],
                        programs: _programs,
                        onAction: _load,
                      ),
                      childCount: _filtered.length,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  void _showInviteSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => _InviteBottomSheet(onInvited: _load),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Single athlete row card
// ─────────────────────────────────────────────────────────────────────────────
class _AthleteRow extends ConsumerWidget {
  final Map<String, dynamic> athlete;
  final List<dynamic> programs;
  final VoidCallback onAction;

  const _AthleteRow({
    required this.athlete,
    required this.programs,
    required this.onAction,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final firstName = athlete['user']?['first_name'] ?? '';
    final lastName = athlete['user']?['last_name'] ?? '';
    final email = athlete['user']?['email'] ?? '';
    final sport = athlete['sport'] ?? 'General';
    final name = '$firstName $lastName'.trim();
    final initial = name.isNotEmpty ? name[0].toUpperCase() : 'A';
    final athleteId = athlete['id'] as int;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        children: [
          // Main row
          Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                // Avatar
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFE8621A), Color(0xFFBF4D10)],
                    ),
                    borderRadius: BorderRadius.circular(22),
                  ),
                  child: Center(
                    child: Text(initial,
                        style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                            fontSize: 16)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name.isNotEmpty ? name : 'Unknown',
                          style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.w700,
                              fontSize: 14)),
                      const SizedBox(height: 2),
                      Text(email,
                          style: const TextStyle(
                              color: AppColors.textMuted, fontSize: 11),
                          overflow: TextOverflow.ellipsis),
                    ],
                  ),
                ),
                // Connected dot + sport
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 7,
                          height: 7,
                          decoration: BoxDecoration(
                            color: AppColors.success,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                  color: AppColors.success.withValues(alpha: 0.5),
                                  blurRadius: 4),
                            ],
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Text('Connected',
                            style: TextStyle(
                                color: AppColors.success,
                                fontSize: 11,
                                fontWeight: FontWeight.w600)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(sport,
                        style: const TextStyle(
                            color: AppColors.textMuted, fontSize: 11)),
                  ],
                ),
              ],
            ),
          ),
          // Action bar
          Container(
            padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
            child: Row(
              children: [
                _ActionBtn(
                  icon: Icons.fitness_center_rounded,
                  label: 'Assign',
                  onTap: () => _showAssignSheet(context, ref),
                ),
                const SizedBox(width: 6),
                _ActionBtn(
                  icon: Icons.calendar_month_rounded,
                  label: 'Calendar',
                  onTap: () => context.push('/athletes/$athleteId/calendar'),
                ),
                const SizedBox(width: 6),
                _ActionBtn(
                  icon: Icons.chat_bubble_outline_rounded,
                  label: 'Message',
                  onTap: () => context.push('/messages?userId=${athlete['user']?['id']}'),
                ),
                const SizedBox(width: 6),
                _ActionBtn(
                  icon: Icons.person_outline_rounded,
                  label: 'Profile',
                  onTap: () => context.push('/athletes/$athleteId'),
                ),
                const SizedBox(width: 6),
                _ActionBtn(
                  icon: Icons.link_off_rounded,
                  label: 'Disconnect',
                  danger: true,
                  onTap: () => _confirmDisconnect(context, ref),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showAssignSheet(BuildContext context, WidgetRef ref) {
    final coachPrograms = programs
        .where((p) => p['status'] == 'draft' || p['coachId'] != null)
        .toList();
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => _AssignTileSheet(
        athleteName: '${athlete['user']?['first_name']} ${athlete['user']?['last_name']}',
        athleteId: athlete['id'] as int,
        programs: programs,
        onDone: onAction,
      ),
    );
  }

  Future<void> _confirmDisconnect(BuildContext context, WidgetRef ref) async {
    final firstName = athlete['user']?['first_name'] ?? 'this athlete';
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Disconnect?',
            style: TextStyle(color: AppColors.textPrimary)),
        content: Text('Remove $firstName from your client list?',
            style: const TextStyle(color: AppColors.textMuted)),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel')),
          TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Disconnect',
                  style: TextStyle(color: AppColors.error))),
        ],
      ),
    );
    if (confirmed == true && context.mounted) {
      try {
        final reqId = athlete['requestId']?.toString() ??
            athlete['coachingRequestId']?.toString();
        if (reqId != null) {
          await ref.read(athletesRepositoryProvider).disconnect(reqId);
        }
        onAction();
      } catch (_) {}
    }
  }
}

class _ActionBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool danger;
  const _ActionBtn({
    required this.icon,
    required this.label,
    required this.onTap,
    this.danger = false,
  });

  @override
  Widget build(BuildContext context) => Expanded(
        child: GestureDetector(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: danger
                  ? AppColors.error.withValues(alpha: 0.08)
                  : AppColors.surfaceVariant,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon,
                    size: 16,
                    color: danger ? AppColors.error : AppColors.primary),
                const SizedBox(height: 3),
                Text(label,
                    style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.w600,
                        color: danger
                            ? AppColors.error
                            : AppColors.textSecondary),
                    textAlign: TextAlign.center),
              ],
            ),
          ),
        ),
      );
}

// ─── Assign Program to Athlete bottom sheet ───────────────────────────────────
class _AssignTileSheet extends ConsumerStatefulWidget {
  final String athleteName;
  final int athleteId;
  final List<dynamic> programs;
  final VoidCallback onDone;
  const _AssignTileSheet({
    required this.athleteName,
    required this.athleteId,
    required this.programs,
    required this.onDone,
  });

  @override
  ConsumerState<_AssignTileSheet> createState() => _AssignTileSheetState();
}

class _AssignTileSheetState extends ConsumerState<_AssignTileSheet> {
  int? _selected;
  bool _busy = false;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
          24, 24, 24, MediaQuery.of(context).viewInsets.bottom + 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Assign Program to ${widget.athleteName}',
              style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 17,
                  fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          const Text(
              'Athlete will be notified and must accept.',
              style: TextStyle(color: AppColors.warning, fontSize: 12)),
          const SizedBox(height: 16),
          ...widget.programs.map((p) {
            final id = p['id'] as int;
            final selected = _selected == id;
            return GestureDetector(
              onTap: () => setState(() => _selected = id),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: selected
                      ? AppColors.primary.withValues(alpha: 0.12)
                      : AppColors.surfaceVariant,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                      color: selected
                          ? AppColors.primary
                          : Colors.transparent),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.layers_rounded, size: 18,
                        color: AppColors.primary),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(p['name'] ?? 'Program',
                          style: TextStyle(
                              color: selected
                                  ? AppColors.primary
                                  : AppColors.textPrimary,
                              fontWeight: FontWeight.w600)),
                    ),
                    if (selected)
                      const Icon(Icons.check_circle_rounded,
                          color: AppColors.primary, size: 18),
                  ],
                ),
              ),
            );
          }),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _selected == null || _busy ? null : _assign,
              style: ElevatedButton.styleFrom(
                  minimumSize: const Size(0, 50),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14))),
              child: _busy
                  ? const SizedBox(
                      width: 20, height: 20,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('Assign',
                      style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _assign() async {
    setState(() => _busy = true);
    try {
      await ref
          .read(programsRepositoryProvider)
          .assignToAthlete(_selected!, widget.athleteId);
      if (mounted) {
        Navigator.pop(context);
        widget.onDone();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Program assigned!'),
              backgroundColor: AppColors.success),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _busy = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }
}

// ─── Invite bottom sheet ───────────────────────────────────────────────────────
class _InviteBottomSheet extends ConsumerStatefulWidget {
  final VoidCallback onInvited;
  const _InviteBottomSheet({required this.onInvited});

  @override
  ConsumerState<_InviteBottomSheet> createState() => _InviteBottomSheetState();
}

class _InviteBottomSheetState extends ConsumerState<_InviteBottomSheet> {
  final _emailCtrl = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    super.dispose();
  }

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
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Invite Athlete',
                        style: TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 18,
                            fontWeight: FontWeight.w700)),
                    SizedBox(height: 4),
                    Text('They will receive a connection request.',
                        style: TextStyle(
                            color: AppColors.textMuted, fontSize: 12)),
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
          TextField(
            controller: _emailCtrl,
            keyboardType: TextInputType.emailAddress,
            style: const TextStyle(color: AppColors.textPrimary),
            decoration: InputDecoration(
              hintText: 'athlete@email.com',
              prefixIcon: const Icon(Icons.email_outlined,
                  color: AppColors.textMuted, size: 20),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _busy ? null : _send,
              style: ElevatedButton.styleFrom(
                  minimumSize: const Size(0, 50),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14))),
              child: _busy
                  ? const SizedBox(
                      width: 20, height: 20,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2))
                  : const Text('Send Invitation',
                      style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _send() async {
    final email = _emailCtrl.text.trim();
    if (email.isEmpty) return;
    setState(() => _busy = true);
    try {
      await ref.read(athletesRepositoryProvider).inviteAthlete(email);
      if (mounted) {
        Navigator.pop(context);
        widget.onInvited();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Invitation sent to $email'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _busy = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }
}

class _EmptyAthletes extends StatelessWidget {
  final VoidCallback onInvite;
  const _EmptyAthletes({required this.onInvite});

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(40),
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
                child: const Icon(Icons.people_alt_rounded,
                    color: AppColors.textMuted, size: 36),
              ),
              const SizedBox(height: 20),
              const Text('No Clients Yet',
                  style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              const Text(
                'Invite your first athlete to start tracking their progress.',
                style: TextStyle(color: AppColors.textMuted, fontSize: 13),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: onInvite,
                icon: const Icon(Icons.person_add_rounded, size: 18),
                label: const Text('Add Client'),
              ),
            ],
          ),
        ),
      );
}
