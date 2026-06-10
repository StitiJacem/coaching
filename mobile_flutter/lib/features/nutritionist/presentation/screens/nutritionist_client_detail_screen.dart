import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/providers/auth_provider.dart';
import '../../data/nutritionist_repository.dart';
import '../widgets/macro_ring.dart';

class NutritionistClientDetailScreen extends ConsumerStatefulWidget {
  final int athleteId;
  const NutritionistClientDetailScreen({super.key, required this.athleteId});

  @override
  ConsumerState<NutritionistClientDetailScreen> createState() =>
      _NutritionistClientDetailScreenState();
}

class _NutritionistClientDetailScreenState
    extends ConsumerState<NutritionistClientDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _loading = true;
  Map<String, dynamic>? _athleteUser;

  Map<String, dynamic> _summary = {};
  Map<String, dynamic> _dietaryProfile = {};
  Map<String, dynamic> _compliance = {};
  List<dynamic> _plans = [];
  List<dynamic> _logs = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final user = ref.read(currentUserProvider);
      if (user == null) return;
      final repo = ref.read(nutritionistRepositoryProvider);
      final profile = await repo.getMyProfile();
      final nutritionistId = profile['id']?.toString() ?? user.id.toString();

      final clientsList = await repo.getClients(nutritionistId);
      final clientInfo = clientsList.firstWhere(
        (c) {
          final ath = c['athlete'] as Map<String, dynamic>?;
          return ath?['id'] == widget.athleteId;
        },
        orElse: () => null,
      );
      if (clientInfo != null) {
        final athlete = clientInfo['athlete'] as Map<String, dynamic>?;
        _athleteUser = athlete?['user'] as Map<String, dynamic>?;
      }

      final results = await Future.wait([
        repo.getAthleteSummary(widget.athleteId),
        repo.getAthleteDietaryProfile(widget.athleteId),
        repo.getAthleteCompliance(widget.athleteId),
        repo.getClientPlans(nutritionistId, widget.athleteId),
        repo.getAthleteLogs(widget.athleteId),
      ]);

      if (mounted) {
        setState(() {
          _summary = results[0] as Map<String, dynamic>;
          _dietaryProfile = results[1] as Map<String, dynamic>;
          _compliance = results[2] as Map<String, dynamic>;
          _plans = results[3] as List<dynamic>;
          _logs = results[4] as List<dynamic>;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final calories =
        (_summary['calories'] as num?)?.toDouble() ?? 0;
    final proteins =
        (_summary['proteins'] as num?)?.toDouble() ?? 0;
    final carbs = (_summary['carbs'] as num?)?.toDouble() ?? 0;
    final fats = (_summary['fats'] as num?)?.toDouble() ?? 0;
    final adherence =
        (_compliance['adherenceRate'] as num?)?.toDouble() ?? 0;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) => [
          SliverAppBar(
            pinned: true,
            expandedHeight: 260,
            backgroundColor: AppColors.background,
            surfaceTintColor: Colors.transparent,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded,
                  color: AppColors.textSecondary, size: 20),
              onPressed: () => Navigator.of(context).pop(),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: _buildHeader(
                  calories, proteins, carbs, fats, adherence),
            ),
            bottom: TabBar(
              controller: _tabController,
              isScrollable: true,
              tabAlignment: TabAlignment.start,
              labelColor: AppColors.roleNutritionist,
              unselectedLabelColor: AppColors.textMuted,
              indicatorColor: AppColors.roleNutritionist,
              indicatorSize: TabBarIndicatorSize.label,
              labelStyle: const TextStyle(
                  fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 0.5),
              tabs: const [
                Tab(text: 'RÉSUMÉ'),
                Tab(text: 'PLAN ACTIF'),
                Tab(text: 'PROFIL DIÉT.'),
                Tab(text: 'HISTORIQUE'),
              ],
            ),
          ),
        ],
        body: _loading
            ? const Center(
                child: CircularProgressIndicator(
                    color: AppColors.roleNutritionist))
            : TabBarView(
                controller: _tabController,
                children: [
                  _SummaryTab(summary: _summary, compliance: _compliance),
                  _PlansTab(plans: _plans),
                  _DietaryProfileTab(profile: _dietaryProfile),
                  _LogsTab(logs: _logs),
                ],
              ),
      ),
    );
  }

  Widget _buildHeader(double calories, double proteins, double carbs,
      double fats, double adherence) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 80, 20, 12),
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
      child: Row(
        children: [
          MacroRing(
            proteins: proteins,
            carbs: carbs,
            fats: fats,
            calories: calories,
            size: 110,
          ),
          const SizedBox(width: 24),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text('AUJOURD\'HUI',
                    style: TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.5)),
                const SizedBox(height: 4),
                Text(
                  _athleteUser != null
                      ? '${_athleteUser!['first_name'] ?? _athleteUser!['firstName'] ?? ''} ${_athleteUser!['last_name'] ?? _athleteUser!['lastName'] ?? ''}'.trim()
                      : 'Suivi Nutritionnel',
                  style: GoogleFonts.bebasNeue(
                    color: AppColors.textPrimary,
                    fontSize: 24,
                    letterSpacing: 1.5,
                    height: 1.0,
                  ),
                ),
                const SizedBox(height: 12),
                MacroLegend(
                    proteins: proteins, carbs: carbs, fats: fats),
                const SizedBox(height: 12),
                // Adherence bar
                Row(
                  children: [
                    const Text('Compliance ',
                        style: TextStyle(
                            color: AppColors.textMuted, fontSize: 11)),
                    Text(
                      '${adherence.toInt()}%',
                      style: TextStyle(
                        color: adherence >= 80
                            ? AppColors.success
                            : adherence >= 50
                                ? AppColors.warning
                                : AppColors.error,
                        fontWeight: FontWeight.w800,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                LinearProgressIndicator(
                  value: (adherence / 100).clamp(0.0, 1.0),
                  backgroundColor: AppColors.cardBorder,
                  color: adherence >= 80
                      ? AppColors.success
                      : adherence >= 50
                          ? AppColors.warning
                          : AppColors.error,
                  minHeight: 5,
                  borderRadius: BorderRadius.circular(4),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Summary
// ─────────────────────────────────────────────────────────────────────────────
class _SummaryTab extends StatelessWidget {
  final Map<String, dynamic> summary;
  final Map<String, dynamic> compliance;
  const _SummaryTab({required this.summary, required this.compliance});

  @override
  Widget build(BuildContext context) {
    final calories = (summary['calories'] as num?)?.toDouble() ?? 0;
    final targetCalories =
        (summary['targetCalories'] as num?)?.toDouble() ?? 2000;
    final proteins = (summary['proteins'] as num?)?.toDouble() ?? 0;
    final carbs = (summary['carbs'] as num?)?.toDouble() ?? 0;
    final fats = (summary['fats'] as num?)?.toDouble() ?? 0;
    final water = (summary['water'] as num?)?.toDouble() ?? 0;

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // Calorie Progress
        _SectionCard(
          title: 'CALORIES DU JOUR',
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${calories.toInt()} kcal',
                    style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 28,
                        fontWeight: FontWeight.w900),
                  ),
                  Text(
                    '/ ${targetCalories.toInt()} kcal',
                    style: const TextStyle(
                        color: AppColors.textMuted, fontSize: 14),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              LinearProgressIndicator(
                value: targetCalories > 0
                    ? (calories / targetCalories).clamp(0.0, 1.2)
                    : 0,
                backgroundColor: AppColors.cardBorder,
                color: calories > targetCalories
                    ? AppColors.error
                    : AppColors.roleNutritionist,
                minHeight: 8,
                borderRadius: BorderRadius.circular(4),
              ),
              const SizedBox(height: 8),
              Text(
                calories > targetCalories
                    ? '⚠️ Objectif dépassé de ${(calories - targetCalories).toInt()} kcal'
                    : '✅ ${(targetCalories - calories).toInt()} kcal restantes',
                style: const TextStyle(
                    color: AppColors.textMuted, fontSize: 12),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Macros Grid
        _SectionCard(
          title: 'MACRONUTRIMENTS',
          child: Row(
            children: [
              Expanded(
                  child: _MacroTile(
                      label: 'Protéines',
                      value: proteins,
                      color: AppColors.roleNutritionist,
                      icon: Icons.egg_alt_rounded)),
              const SizedBox(width: 12),
              Expanded(
                  child: _MacroTile(
                      label: 'Glucides',
                      value: carbs,
                      color: AppColors.primary,
                      icon: Icons.grain_rounded)),
              const SizedBox(width: 12),
              Expanded(
                  child: _MacroTile(
                      label: 'Lipides',
                      value: fats,
                      color: AppColors.info,
                      icon: Icons.water_drop_rounded)),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Hydration
        if (water > 0)
          _SectionCard(
            title: 'HYDRATATION',
            child: Row(
              children: [
                const Icon(Icons.water_drop_rounded,
                    color: AppColors.info, size: 32),
                const SizedBox(width: 12),
                Text(
                  '${water.toInt()} ml',
                  style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 24,
                      fontWeight: FontWeight.w800),
                ),
              ],
            ),
          ),
        const SizedBox(height: 40),
      ],
    );
  }
}

class _MacroTile extends StatelessWidget {
  final String label;
  final double value;
  final Color color;
  final IconData icon;
  const _MacroTile(
      {required this.label,
      required this.value,
      required this.color,
      required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 18),
          const SizedBox(height: 6),
          Text('${value.toInt()}g',
              style: TextStyle(
                  color: color,
                  fontSize: 16,
                  fontWeight: FontWeight.w900)),
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

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Active Plans
// ─────────────────────────────────────────────────────────────────────────────
class _PlansTab extends StatelessWidget {
  final List<dynamic> plans;
  const _PlansTab({required this.plans});

  @override
  Widget build(BuildContext context) {
    if (plans.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.assignment_outlined,
                size: 56, color: AppColors.textMuted),
            SizedBox(height: 12),
            Text('Aucun plan assigné',
                style: TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 15,
                    fontWeight: FontWeight.w600)),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(20),
      itemCount: plans.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final plan = plans[index] as Map<String, dynamic>;
        final planId = plan['id'];
        final name = plan['name'] ?? 'Plan ${index + 1}';
        final calories = plan['targetCalories'] ?? 0;
        final isActive = index == 0;
        final statusLabel = isActive ? 'ACTIVE' : 'PAST';
        final statusColor = isActive ? AppColors.success : AppColors.textMuted;
        final days = (plan['days'] as List?)?.length ?? 0;

        return GestureDetector(
          onTap: () {
            if (planId != null) {
              context.push('/nutritionist/plans/$planId');
            }
          },
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.cardBorder),
            ),
            child: Row(
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
                      Text(name,
                          style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 15,
                              fontWeight: FontWeight.w700)),
                      const SizedBox(height: 4),
                      Text(
                        '$days jours · $calories kcal/jour',
                        style: const TextStyle(
                            color: AppColors.textMuted, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    statusLabel,
                    style: TextStyle(
                        color: statusColor,
                        fontSize: 9,
                        fontWeight: FontWeight.w800),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Dietary Profile
// ─────────────────────────────────────────────────────────────────────────────
class _DietaryProfileTab extends StatelessWidget {
  final Map<String, dynamic> profile;
  const _DietaryProfileTab({required this.profile});

  @override
  Widget build(BuildContext context) {
    if (profile.isEmpty) {
      return const Center(
        child: Text('Aucun profil diététique disponible',
            style:
                TextStyle(color: AppColors.textMuted, fontSize: 14)),
      );
    }

    final goal = profile['goal'] ?? '—';
    final diet = profile['dietType'] ?? '—';
    final caloricTarget = profile['caloricTarget'] ?? 0;
    final allergies =
        (profile['allergies'] as List?)?.join(', ') ?? 'Aucune';
    final restrictions =
        (profile['restrictions'] as List?)?.join(', ') ?? 'Aucune';

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _SectionCard(
          title: 'OBJECTIF',
          child: _InfoRow(icon: Icons.flag_rounded, label: 'Objectif', value: goal.toString()),
        ),
        const SizedBox(height: 16),
        _SectionCard(
          title: 'PARAMÈTRES',
          child: Column(
            children: [
              _InfoRow(
                  icon: Icons.local_fire_department_rounded,
                  label: 'Calories cibles',
                  value: '$caloricTarget kcal/jour'),
              const Divider(color: AppColors.cardBorder, height: 20),
              _InfoRow(
                  icon: Icons.restaurant_rounded,
                  label: 'Type de régime',
                  value: diet.toString()),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _SectionCard(
          title: 'RESTRICTIONS',
          child: Column(
            children: [
              _InfoRow(
                  icon: Icons.warning_amber_rounded,
                  label: 'Allergies',
                  value: allergies,
                  valueColor: allergies != 'Aucune'
                      ? AppColors.error
                      : null),
              const Divider(color: AppColors.cardBorder, height: 20),
              _InfoRow(
                  icon: Icons.block_rounded,
                  label: 'Restrictions',
                  value: restrictions),
            ],
          ),
        ),
        const SizedBox(height: 40),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Meal Logs History
// ─────────────────────────────────────────────────────────────────────────────
class _LogsTab extends StatelessWidget {
  final List<dynamic> logs;
  const _LogsTab({required this.logs});

  @override
  Widget build(BuildContext context) {
    if (logs.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.history_rounded,
                size: 56, color: AppColors.textMuted),
            SizedBox(height: 12),
            Text('Aucun repas enregistré',
                style: TextStyle(color: AppColors.textMuted, fontSize: 15)),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(20),
      itemCount: logs.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final log = logs[index] as Map<String, dynamic>;
        final mealName = log['mealName'] ?? log['name'] ?? 'Repas';
        final cal = log['calories'] ?? 0;
        final mealType = log['mealType'] ?? log['type'] ?? '';
        final dateStr = (log['date'] ?? log['loggedAt'] ?? '')
            .toString()
            .substring(0, 10.clamp(0,
                (log['date'] ?? log['loggedAt'] ?? '').toString().length));

        final mealIcon = mealType.toString().toLowerCase().contains('break')
            ? Icons.breakfast_dining_rounded
            : mealType.toString().toLowerCase().contains('lunch')
                ? Icons.lunch_dining_rounded
                : mealType.toString().toLowerCase().contains('dinner') ||
                        mealType.toString().toLowerCase().contains('diner')
                    ? Icons.dinner_dining_rounded
                    : Icons.restaurant_rounded;

        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.cardBorder),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.roleNutritionist.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(mealIcon,
                    color: AppColors.roleNutritionist, size: 18),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(mealName.toString(),
                        style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w600,
                            fontSize: 14)),
                    Text(dateStr,
                        style: const TextStyle(
                            color: AppColors.textMuted, fontSize: 11)),
                  ],
                ),
              ),
              Text(
                '${cal} kcal',
                style: const TextStyle(
                    color: AppColors.roleNutritionist,
                    fontWeight: FontWeight.w800,
                    fontSize: 13),
              ),
            ],
          ),
        );
      },
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared small widgets
// ─────────────────────────────────────────────────────────────────────────────
class _SectionCard extends StatelessWidget {
  final String title;
  final Widget child;
  const _SectionCard({required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
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
          Text(title,
              style: const TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.5)),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color? valueColor;
  const _InfoRow(
      {required this.icon,
      required this.label,
      required this.value,
      this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: AppColors.textMuted, size: 16),
        const SizedBox(width: 10),
        Text(label,
            style: const TextStyle(
                color: AppColors.textSecondary, fontSize: 13)),
        const Spacer(),
        Text(value,
            style: TextStyle(
                color: valueColor ?? AppColors.textPrimary,
                fontWeight: FontWeight.w600,
                fontSize: 13)),
      ],
    );
  }
}
