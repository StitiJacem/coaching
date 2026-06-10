import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/providers/auth_provider.dart';
import '../../data/nutritionist_repository.dart';

class NutritionistPlanDetailScreen extends ConsumerStatefulWidget {
  final int planId;
  const NutritionistPlanDetailScreen({super.key, required this.planId});

  @override
  ConsumerState<NutritionistPlanDetailScreen> createState() =>
      _NutritionistPlanDetailScreenState();
}

class _NutritionistPlanDetailScreenState
    extends ConsumerState<NutritionistPlanDetailScreen> {
  bool _loading = true;
  Map<String, dynamic> _plan = {};
  List<dynamic> _clients = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final user = ref.read(currentUserProvider);
      if (user == null) return;
      final repo = ref.read(nutritionistRepositoryProvider);

      final results = await Future.wait([
        repo.getPlanById(widget.planId),
        repo.getMyProfile().then((profile) async {
          final nutritionistId = profile['id']?.toString() ?? user.id.toString();
          return repo.getClients(nutritionistId);
        }),
      ]);

      if (mounted) {
        setState(() {
          _plan = results[0] as Map<String, dynamic>;
          _clients = results[1] as List<dynamic>;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _showAssignDialog() async {
    if (_clients.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Aucun client disponible pour l\'assignation'),
          backgroundColor: AppColors.warning,
        ),
      );
      return;
    }

    final selectedIds = <int>{};

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Container(
          height: MediaQuery.of(context).size.height * 0.65,
          padding: const EdgeInsets.all(24),
          decoration: const BoxDecoration(
            color: AppColors.surface,
            borderRadius:
                BorderRadius.vertical(top: Radius.circular(32)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.cardBorder,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'ASSIGNER À UN CLIENT',
                style: GoogleFonts.bebasNeue(
                  color: AppColors.textPrimary,
                  fontSize: 24,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Sélectionnez les clients qui recevront ce plan',
                style: TextStyle(
                    color: AppColors.textMuted, fontSize: 13),
              ),
              const SizedBox(height: 20),
              Expanded(
                child: ListView.builder(
                  itemCount: _clients.length,
                  itemBuilder: (_, index) {
                    final client =
                        _clients[index] as Map<String, dynamic>;
                    final athlete = client['athlete'] as Map<String, dynamic>?;
                    final user = athlete?['user'] as Map<String, dynamic>? ??
                        client['user'] as Map<String, dynamic>? ??
                        client;
                    final id = (client['athleteId'] ?? client['id']) as int?;
                    final firstName = user['first_name'] ?? user['firstName'] ?? '';
                    final lastName = user['last_name'] ?? user['lastName'] ?? '';
                    final name = '$firstName $lastName'.trim();
                    final isSelected = id != null && selectedIds.contains(id);

                    return CheckboxListTile(
                      activeColor: AppColors.roleNutritionist,
                      checkColor: Colors.white,
                      title: Text(name.isEmpty ? 'Client' : name,
                          style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.w600)),
                      value: isSelected,
                      onChanged: (val) {
                        if (id == null) return;
                        setModalState(() {
                          if (val == true) {
                            selectedIds.add(id);
                          } else {
                            selectedIds.remove(id);
                          }
                        });
                      },
                    );
                  },
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: selectedIds.isEmpty
                      ? null
                      : () async {
                          Navigator.pop(ctx);
                          await _assignPlan(selectedIds.toList());
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.roleNutritionist,
                    disabledBackgroundColor:
                        AppColors.cardBorder,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16)),
                  ),
                  child: Text(
                    selectedIds.isEmpty
                        ? 'SÉLECTIONNER UN CLIENT'
                        : 'ASSIGNER À ${selectedIds.length} CLIENT(S)',
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.5),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _assignPlan(List<int> athleteIds) async {
    try {
      await ref
          .read(nutritionistRepositoryProvider)
          .assignPlan(widget.planId, athleteIds);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Plan assigné avec succès !'),
            backgroundColor: AppColors.roleNutritionist,
          ),
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
    final name = _plan['name'] ?? 'Plan';
    final description = _plan['description'] ?? '';
    final calories = _plan['targetCalories'] ?? 0;
    final proteins = _plan['targetProteins'] ?? _plan['proteins'] ?? 0;
    final carbs = _plan['targetCarbs'] ?? _plan['carbs'] ?? 0;
    final fats = _plan['targetFats'] ?? _plan['fats'] ?? 0;
    final days = (_plan['days'] as List?) ?? [];

    return Scaffold(
      backgroundColor: AppColors.background,
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(
                  color: AppColors.roleNutritionist))
          : CustomScrollView(
              slivers: [
                // ── App Bar ────────────────────────────────────────────────
                SliverAppBar(
                  pinned: true,
                  expandedHeight: 180,
                  backgroundColor: AppColors.background,
                  surfaceTintColor: Colors.transparent,
                  leading: IconButton(
                    icon: const Icon(Icons.arrow_back_ios_new_rounded,
                        color: AppColors.textSecondary, size: 20),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                  actions: [
                    IconButton(
                      icon: const Icon(Icons.edit_rounded,
                          color: AppColors.textSecondary),
                      onPressed: () => context.push(
                          '/nutritionist/plans/create?editId=${widget.planId}'),
                      tooltip: 'Modifier',
                    ),
                  ],
                  flexibleSpace: FlexibleSpaceBar(
                    titlePadding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                    centerTitle: false,
                    title: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('PLAN NUTRITIONNEL',
                            style: TextStyle(
                                color: AppColors.roleNutritionist,
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 1.5)),
                        Text(
                          name.toString(),
                          style: GoogleFonts.bebasNeue(
                              color: AppColors.textPrimary,
                              fontSize: 26,
                              height: 1.0,
                              letterSpacing: 1.5),
                        ),
                      ],
                    ),
                    background: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            AppColors.roleNutritionist.withValues(alpha: 0.08),
                            AppColors.background,
                          ],
                        ),
                      ),
                    ),
                  ),
                ),

                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
                  sliver: SliverList(
                    delegate: SliverChildListDelegate([
                      // Description
                      if (description.toString().isNotEmpty) ...[
                        Text(
                          description.toString(),
                          style: const TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 14,
                              height: 1.5),
                        ),
                        const SizedBox(height: 20),
                      ],

                      // Macros targets
                      _SectionHeader('OBJECTIFS MACRONUTRIMENTS'),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                              child: _MacroTarget(
                                  label: 'Calories',
                                  value: '$calories kcal',
                                  icon: Icons.local_fire_department_rounded,
                                  color: AppColors.primary)),
                          const SizedBox(width: 10),
                          Expanded(
                              child: _MacroTarget(
                                  label: 'Protéines',
                                  value: '${proteins}g',
                                  icon: Icons.egg_alt_rounded,
                                  color: AppColors.roleNutritionist)),
                          const SizedBox(width: 10),
                          Expanded(
                              child: _MacroTarget(
                                  label: 'Glucides',
                                  value: '${carbs}g',
                                  icon: Icons.grain_rounded,
                                  color: AppColors.warning)),
                          const SizedBox(width: 10),
                          Expanded(
                              child: _MacroTarget(
                                  label: 'Lipides',
                                  value: '${fats}g',
                                  icon: Icons.water_drop_rounded,
                                  color: AppColors.info)),
                        ],
                      ),
                      const SizedBox(height: 28),

                      // Days list
                      _SectionHeader('STRUCTURE DU PLAN (${days.length} JOURS)'),
                      const SizedBox(height: 12),
                      if (days.isEmpty)
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.cardBorder),
                          ),
                          child: const Center(
                            child: Text(
                              'Aucun jour configuré.\nModifiez ce plan pour ajouter des repas.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                  color: AppColors.textMuted, fontSize: 13),
                            ),
                          ),
                        )
                      else
                        ...days.asMap().entries.map((entry) {
                          final dayIndex = entry.key;
                          final day =
                              entry.value as Map<String, dynamic>? ?? {};
                          final meals = (day['meals'] as List?) ?? [];
                          return _DayTile(
                              dayIndex: dayIndex,
                              day: day,
                              meals: meals);
                        }),

                      const SizedBox(height: 28),

                      // Assign button
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: _showAssignDialog,
                          icon: const Icon(Icons.person_add_rounded),
                          label: const Text('ASSIGNER À UN CLIENT',
                              style: TextStyle(
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.5)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.roleNutritionist,
                            padding:
                                const EdgeInsets.symmetric(vertical: 18),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16)),
                          ),
                        ),
                      ),
                    ]),
                  ),
                ),
              ],
            ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared widgets
// ─────────────────────────────────────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader(this.title);

  @override
  Widget build(BuildContext context) => Text(
        title,
        style: const TextStyle(
            color: AppColors.textMuted,
            fontSize: 10,
            fontWeight: FontWeight.w800,
            letterSpacing: 1.5),
      );
}

class _MacroTarget extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  const _MacroTarget(
      {required this.label,
      required this.value,
      required this.icon,
      required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 16),
          const SizedBox(height: 4),
          Text(value,
              style: TextStyle(
                  color: color,
                  fontSize: 12,
                  fontWeight: FontWeight.w800)),
          Text(label,
              style: const TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 9,
                  fontWeight: FontWeight.w600),
              textAlign: TextAlign.center),
        ],
      ),
    );
  }
}

class _DayTile extends StatelessWidget {
  final int dayIndex;
  final Map<String, dynamic> day;
  final List<dynamic> meals;
  const _DayTile(
      {required this.dayIndex,
      required this.day,
      required this.meals});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: ExpansionTile(
        iconColor: AppColors.roleNutritionist,
        collapsedIconColor: AppColors.textMuted,
        title: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: AppColors.roleNutritionist.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Center(
                child: Text(
                  '${dayIndex + 1}',
                  style: const TextStyle(
                      color: AppColors.roleNutritionist,
                      fontWeight: FontWeight.w900,
                      fontSize: 14),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  day['title'] ?? day['name'] ?? 'Jour ${dayIndex + 1}',
                  style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w600,
                      fontSize: 14),
                ),
                Text(
                  '${meals.length} repas',
                  style: const TextStyle(
                      color: AppColors.textMuted, fontSize: 11),
                ),
              ],
            ),
          ],
        ),
        children: meals.map((meal) {
          final m = meal as Map<String, dynamic>? ?? {};
          final mealName = m['name'] ?? m['mealType'] ?? 'Repas';
          final mCal = m['calories'] ?? m['totalCalories'] ?? 0;
          return ListTile(
            dense: true,
            leading: const Icon(Icons.restaurant_rounded,
                color: AppColors.textMuted, size: 16),
            title: Text(mealName.toString(),
                style: const TextStyle(
                    color: AppColors.textSecondary, fontSize: 13)),
            trailing: Text('$mCal kcal',
                style: const TextStyle(
                    color: AppColors.roleNutritionist,
                    fontSize: 12,
                    fontWeight: FontWeight.w700)),
          );
        }).toList(),
      ),
    );
  }
}
