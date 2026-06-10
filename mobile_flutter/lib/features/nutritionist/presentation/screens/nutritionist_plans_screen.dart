import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/animate_in.dart';
import '../../data/nutritionist_repository.dart';

class NutritionistPlansScreen extends ConsumerStatefulWidget {
  const NutritionistPlansScreen({super.key});

  @override
  ConsumerState<NutritionistPlansScreen> createState() =>
      _NutritionistPlansScreenState();
}

class _NutritionistPlansScreenState
    extends ConsumerState<NutritionistPlansScreen> {
  bool _loading = true;
  List<dynamic> _plans = [];
  String _filter = 'all';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final repo = ref.read(nutritionistRepositoryProvider);
      final plans = await repo.getMyPlans();
      if (mounted) {
        setState(() {
          _plans = plans;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<dynamic> get _filtered {
    if (_filter == 'assigned') {
      return _plans
          .where((p) =>
              ((p['assignments'] as List?)?.isNotEmpty ?? false) ||
              (p['athleteCount'] as int? ?? 0) > 0)
          .toList();
    } else if (_filter == 'template') {
      return _plans
          .where((p) => p['isTemplate'] == true || p['status'] == 'template')
          .toList();
    }
    return _plans;
  }

  Future<void> _deletePlan(int planId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Supprimer ce plan ?',
            style: TextStyle(color: AppColors.textPrimary)),
        content: const Text(
          'Cette action est irréversible. Les athlètes assignés perdront l\'accès à ce plan.',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Annuler',
                style: TextStyle(color: AppColors.textMuted)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Supprimer',
                style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await ref.read(nutritionistRepositoryProvider).deletePlan(planId);
      setState(() => _plans.removeWhere((p) => p['id'] == planId));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Plan supprimé'),
              backgroundColor: AppColors.roleNutritionist),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Erreur: $e'),
              backgroundColor: AppColors.error),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filtered;

    return Scaffold(
      backgroundColor: AppColors.background,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/nutritionist/plans/create'),
        backgroundColor: AppColors.roleNutritionist,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add_rounded),
        label: const Text('CRÉER',
            style: TextStyle(fontWeight: FontWeight.w800, letterSpacing: 0.5)),
        elevation: 4,
      ),
      body: RefreshIndicator(
        color: AppColors.roleNutritionist,
        onRefresh: _load,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // ── App Bar ──────────────────────────────────────────────────────
            SliverAppBar(
              pinned: true,
              expandedHeight: 120,
              backgroundColor: AppColors.background,
              surfaceTintColor: Colors.transparent,
              flexibleSpace: FlexibleSpaceBar(
                titlePadding:
                    const EdgeInsets.fromLTRB(20, 0, 20, 12),
                centerTitle: false,
                title: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'NUTRITION',
                      style: TextStyle(
                          color: AppColors.roleNutritionist,
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.5),
                    ),
                    Text(
                      'MES PLANS',
                      style: GoogleFonts.bebasNeue(
                        color: AppColors.textPrimary,
                        fontSize: 28,
                        letterSpacing: 2,
                        height: 1.0,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ── Filter Chips ─────────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _FilterChip(
                        label: 'Tous (${_plans.length})',
                        selected: _filter == 'all',
                        onTap: () => setState(() => _filter = 'all'),
                      ),
                      const SizedBox(width: 8),
                      _FilterChip(
                        label: 'Assignés',
                        selected: _filter == 'assigned',
                        onTap: () => setState(() => _filter = 'assigned'),
                      ),
                      const SizedBox(width: 8),
                      _FilterChip(
                        label: 'Templates',
                        selected: _filter == 'template',
                        onTap: () => setState(() => _filter = 'template'),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // ── Content ──────────────────────────────────────────────────────
            if (_loading)
              const SliverFillRemaining(
                child: Center(
                    child: CircularProgressIndicator(
                        color: AppColors.roleNutritionist)),
              )
            else if (filtered.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.assignment_outlined,
                          size: 64,
                          color:
                              AppColors.textMuted.withValues(alpha: 0.4)),
                      const SizedBox(height: 16),
                      const Text('Aucun plan disponible',
                          style: TextStyle(
                              color: AppColors.textMuted,
                              fontSize: 16,
                              fontWeight: FontWeight.w600)),
                      const SizedBox(height: 8),
                      const Text(
                        'Appuyez sur + CRÉER pour créer votre premier plan',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            color: AppColors.textMuted, fontSize: 13),
                      ),
                    ],
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final plan =
                          filtered[index] as Map<String, dynamic>;
                      return AnimateIn(
                        delay: index * 60,
                        child: _PlanCard(
                          plan: plan,
                          onTap: () => context.push(
                              '/nutritionist/plans/${plan['id']}'),
                          onDelete: () => _deletePlan(
                              (plan['id'] as int?) ?? 0),
                        ),
                      );
                    },
                    childCount: filtered.length,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Plan Card
// ─────────────────────────────────────────────────────────────────────────────
class _PlanCard extends StatelessWidget {
  final Map<String, dynamic> plan;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  const _PlanCard(
      {required this.plan, required this.onTap, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    final name = plan['name'] ?? 'Plan sans nom';
    final calories = plan['targetCalories'] ?? 0;
    final days = (plan['days'] as List?)?.length ?? plan['duration'] ?? 0;
    final athleteCount =
        (plan['assignments'] as List?)?.length ?? plan['athleteCount'] ?? 0;
    final proteins = plan['targetProteins'] ?? plan['proteins'] ?? 0;
    final carbs = plan['targetCarbs'] ?? plan['carbs'] ?? 0;
    final fats = plan['targetFats'] ?? plan['fats'] ?? 0;
    final description = plan['description'] ?? '';

    return Dismissible(
      key: Key('plan-${plan['id']}'),
      direction: DismissDirection.endToStart,
      onDismissed: (_) => onDelete(),
      confirmDismiss: (_) async {
        // Show confirmation inside card before actual dismiss
        onDelete();
        return false; // We handle deletion manually
      },
      background: Container(
        margin: const EdgeInsets.only(bottom: 14),
        padding: const EdgeInsets.symmetric(horizontal: 20),
        decoration: BoxDecoration(
          color: AppColors.error.withValues(alpha: 0.2),
          borderRadius: BorderRadius.circular(20),
        ),
        alignment: Alignment.centerRight,
        child: const Icon(Icons.delete_outline_rounded,
            color: AppColors.error, size: 28),
      ),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
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
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.roleNutritionist.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.restaurant_menu_rounded,
                        color: AppColors.roleNutritionist, size: 22),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name.toString(),
                            style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 16,
                                fontWeight: FontWeight.w700)),
                        if (description.toString().isNotEmpty)
                          Text(description.toString(),
                              style: const TextStyle(
                                  color: AppColors.textMuted, fontSize: 11),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: onDelete,
                    icon: const Icon(Icons.more_vert_rounded,
                        color: AppColors.textMuted, size: 20),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              // Stats row
              Row(
                children: [
                  _StatChip(
                      icon: Icons.local_fire_department_rounded,
                      value: '$calories kcal',
                      color: AppColors.primary),
                  const SizedBox(width: 8),
                  _StatChip(
                      icon: Icons.calendar_today_rounded,
                      value: '$days jours',
                      color: AppColors.info),
                  const SizedBox(width: 8),
                  _StatChip(
                      icon: Icons.people_rounded,
                      value: '$athleteCount',
                      color: AppColors.roleNutritionist),
                ],
              ),
              const SizedBox(height: 12),
              // Macro pills
              Row(
                children: [
                  _MacroPill(
                      label: 'P',
                      value: '$proteins g',
                      color: AppColors.roleNutritionist),
                  const SizedBox(width: 6),
                  _MacroPill(
                      label: 'G',
                      value: '$carbs g',
                      color: AppColors.primary),
                  const SizedBox(width: 6),
                  _MacroPill(
                      label: 'L', value: '$fats g', color: AppColors.info),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final IconData icon;
  final String value;
  final Color color;
  const _StatChip(
      {required this.icon, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(value,
              style: TextStyle(
                  color: color, fontSize: 11, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

class _MacroPill extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _MacroPill(
      {required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        border: Border.all(color: color.withValues(alpha: 0.3)),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text('$label: $value',
          style: TextStyle(
              color: color, fontSize: 10, fontWeight: FontWeight.w700)),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _FilterChip(
      {required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected
              ? AppColors.roleNutritionist.withValues(alpha: 0.15)
              : AppColors.card,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected
                ? AppColors.roleNutritionist
                : AppColors.cardBorder,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected
                ? AppColors.roleNutritionist
                : AppColors.textMuted,
            fontSize: 12,
            fontWeight:
                selected ? FontWeight.w700 : FontWeight.w500,
          ),
        ),
      ),
    );
  }
}
