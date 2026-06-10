import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/nutritionist_repository.dart';

class NutritionistPlanBuilderScreen extends ConsumerStatefulWidget {
  final int? planId; // non-null when editing an existing plan
  const NutritionistPlanBuilderScreen({super.key, this.planId});

  @override
  ConsumerState<NutritionistPlanBuilderScreen> createState() =>
      _NutritionistPlanBuilderScreenState();
}

class _NutritionistPlanBuilderScreenState
    extends ConsumerState<NutritionistPlanBuilderScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _saving = false;

  // Plan-level fields
  final _nameCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _calCtrl = TextEditingController();
  final _proteinCtrl = TextEditingController();
  final _carbCtrl = TextEditingController();
  final _fatCtrl = TextEditingController();

  // Days
  final List<_DayData> _days = [];

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descCtrl.dispose();
    _calCtrl.dispose();
    _proteinCtrl.dispose();
    _carbCtrl.dispose();
    _fatCtrl.dispose();
    super.dispose();
  }

  void _addDay() {
    setState(() {
      _days.add(_DayData(title: 'Jour ${_days.length + 1}'));
    });
  }

  void _removeDay(int index) {
    setState(() => _days.removeAt(index));
    // Re-number days
    for (int i = 0; i < _days.length; i++) {
      if (_days[i].title.startsWith('Jour ')) {
        _days[i] = _DayData(
            title: 'Jour ${i + 1}', meals: List.from(_days[i].meals));
      }
    }
  }

  void _addMeal(int dayIndex) {
    setState(() {
      _days[dayIndex].meals.add(_MealData());
    });
  }

  void _removeMeal(int dayIndex, int mealIndex) {
    setState(() => _days[dayIndex].meals.removeAt(mealIndex));
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_nameCtrl.text.trim().isEmpty) return;

    setState(() => _saving = true);

    try {
      final repo = ref.read(nutritionistRepositoryProvider);

      final planData = {
        'name': _nameCtrl.text.trim(),
        'description': _descCtrl.text.trim(),
        'targetCalories': int.tryParse(_calCtrl.text) ?? 2000,
        'targetProteins': int.tryParse(_proteinCtrl.text) ?? 0,
        'targetCarbs': int.tryParse(_carbCtrl.text) ?? 0,
        'targetFats': int.tryParse(_fatCtrl.text) ?? 0,
      };

      Map<String, dynamic> plan;
      if (widget.planId != null) {
        // Edit existing
        await repo.savePlan(widget.planId!, {
          ...planData,
          'days': _days.map((d) => d.toJson()).toList(),
        });
        plan = {'id': widget.planId};
      } else {
        // Create new
        plan = await repo.createPlan(planData);
        final planId = plan['id'] as int?;
        if (planId != null && _days.isNotEmpty) {
          await repo.savePlan(planId,
              {'days': _days.map((d) => d.toJson()).toList()});
        }
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Plan enregistré avec succès !'),
            backgroundColor: AppColors.roleNutritionist,
          ),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Erreur: $e'),
              backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.planId != null;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded,
              color: AppColors.textSecondary),
          onPressed: () => context.pop(),
        ),
        title: Text(
          isEditing ? 'MODIFIER LE PLAN' : 'NOUVEAU PLAN',
          style: GoogleFonts.bebasNeue(
            color: AppColors.textPrimary,
            fontSize: 22,
            letterSpacing: 1.5,
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: _saving
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                        color: AppColors.roleNutritionist, strokeWidth: 2))
                : TextButton(
                    onPressed: _save,
                    child: const Text(
                      'ENREGISTRER',
                      style: TextStyle(
                          color: AppColors.roleNutritionist,
                          fontWeight: FontWeight.w800,
                          fontSize: 13),
                    ),
                  ),
          ),
        ],
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(1),
          child: Divider(height: 1, color: AppColors.cardBorder),
        ),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            // ── Plan Informations ──────────────────────────────────────────
            _SectionLabel('INFORMATIONS DU PLAN'),
            const SizedBox(height: 12),
            _FormCard(
              child: Column(
                children: [
                  _Field(
                    controller: _nameCtrl,
                    label: 'Nom du plan *',
                    icon: Icons.assignment_rounded,
                    validator: (v) =>
                        (v?.isEmpty ?? true) ? 'Champ obligatoire' : null,
                  ),
                  const SizedBox(height: 14),
                  _Field(
                    controller: _descCtrl,
                    label: 'Description',
                    icon: Icons.notes_rounded,
                    maxLines: 3,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // ── Caloric Target ─────────────────────────────────────────────
            _SectionLabel('OBJECTIFS CALORIQUES & MACROS'),
            const SizedBox(height: 12),
            _FormCard(
              child: Column(
                children: [
                  _Field(
                    controller: _calCtrl,
                    label: 'Calories cibles (kcal/jour)',
                    icon: Icons.local_fire_department_rounded,
                    keyboardType: TextInputType.number,
                    accentColor: AppColors.primary,
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: _Field(
                          controller: _proteinCtrl,
                          label: 'Protéines (g)',
                          icon: Icons.egg_alt_rounded,
                          keyboardType: TextInputType.number,
                          accentColor: AppColors.roleNutritionist,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _Field(
                          controller: _carbCtrl,
                          label: 'Glucides (g)',
                          icon: Icons.grain_rounded,
                          keyboardType: TextInputType.number,
                          accentColor: AppColors.warning,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _Field(
                          controller: _fatCtrl,
                          label: 'Lipides (g)',
                          icon: Icons.water_drop_rounded,
                          keyboardType: TextInputType.number,
                          accentColor: AppColors.info,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 28),

            // ── Days & Meals ───────────────────────────────────────────────
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _SectionLabel('JOURS & REPAS'),
                GestureDetector(
                  onTap: _addDay,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color:
                          AppColors.roleNutritionist.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                          color: AppColors.roleNutritionist
                              .withValues(alpha: 0.3)),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.add_rounded,
                            color: AppColors.roleNutritionist, size: 16),
                        SizedBox(width: 4),
                        Text('AJOUTER UN JOUR',
                            style: TextStyle(
                                color: AppColors.roleNutritionist,
                                fontSize: 10,
                                fontWeight: FontWeight.w800)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            if (_days.isEmpty)
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.card,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.cardBorder),
                ),
                child: Column(
                  children: [
                    Icon(Icons.calendar_today_rounded,
                        size: 36,
                        color: AppColors.textMuted.withValues(alpha: 0.5)),
                    const SizedBox(height: 10),
                    const Text(
                      'Aucun jour configuré',
                      style: TextStyle(
                          color: AppColors.textMuted,
                          fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Appuyez sur + AJOUTER UN JOUR pour commencer',
                      style:
                          TextStyle(color: AppColors.textMuted, fontSize: 12),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              )
            else
              ...List.generate(_days.length, (dayIndex) {
                final day = _days[dayIndex];
                return _DayBuilder(
                  dayIndex: dayIndex,
                  day: day,
                  onRemoveDay: () => _removeDay(dayIndex),
                  onAddMeal: () => _addMeal(dayIndex),
                  onRemoveMeal: (mi) => _removeMeal(dayIndex, mi),
                  onDayChanged: (d) => setState(() => _days[dayIndex] = d),
                );
              }),

            const SizedBox(height: 40),

            // Save button
            ElevatedButton(
              onPressed: _saving ? null : _save,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.roleNutritionist,
                padding: const EdgeInsets.symmetric(vertical: 18),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16)),
              ),
              child: _saving
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2))
                  : const Text(
                      'ENREGISTRER LE PLAN',
                      style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1),
                    ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Day builder widget
// ─────────────────────────────────────────────────────────────────────────────
class _DayBuilder extends StatelessWidget {
  final int dayIndex;
  final _DayData day;
  final VoidCallback onRemoveDay;
  final VoidCallback onAddMeal;
  final ValueChanged<int> onRemoveMeal;
  final ValueChanged<_DayData> onDayChanged;

  const _DayBuilder({
    required this.dayIndex,
    required this.day,
    required this.onRemoveDay,
    required this.onAddMeal,
    required this.onRemoveMeal,
    required this.onDayChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
            color: AppColors.roleNutritionist.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Day header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 8, 12),
            child: Row(
              children: [
                Container(
                  width: 30,
                  height: 30,
                  decoration: BoxDecoration(
                    color: AppColors.roleNutritionist.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Center(
                    child: Text('${dayIndex + 1}',
                        style: const TextStyle(
                            color: AppColors.roleNutritionist,
                            fontWeight: FontWeight.w900,
                            fontSize: 13)),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    day.title,
                    style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w700,
                        fontSize: 14),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline_rounded,
                      color: AppColors.error, size: 20),
                  onPressed: onRemoveDay,
                ),
              ],
            ),
          ),

          // Meals
          ...day.meals.asMap().entries.map((entry) {
            final mi = entry.key;
            final meal = entry.value;
            return _MealRow(
              mealIndex: mi,
              meal: meal,
              onRemove: () => onRemoveMeal(mi),
            );
          }),

          // Add meal button
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 14),
            child: GestureDetector(
              onTap: onAddMeal,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: AppColors.cardBorder.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                      color: AppColors.cardBorder,
                      style: BorderStyle.solid),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.add_rounded,
                        size: 16, color: AppColors.textMuted),
                    SizedBox(width: 6),
                    Text('AJOUTER UN REPAS',
                        style: TextStyle(
                            color: AppColors.textMuted,
                            fontSize: 11,
                            fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MealRow extends StatelessWidget {
  final int mealIndex;
  final _MealData meal;
  final VoidCallback onRemove;

  const _MealRow(
      {required this.mealIndex,
      required this.meal,
      required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 0, 14, 10),
      child: Row(
        children: [
          const Icon(Icons.restaurant_rounded,
              color: AppColors.textMuted, size: 16),
          const SizedBox(width: 10),
          Expanded(
            child: TextFormField(
              initialValue: meal.name,
              onChanged: (v) => meal.name = v,
              style: const TextStyle(color: AppColors.textPrimary, fontSize: 13),
              decoration: InputDecoration(
                hintText: 'Ex: Petit-déjeuner, Déjeuner...',
                hintStyle: const TextStyle(
                    color: AppColors.textMuted, fontSize: 12),
                contentPadding: const EdgeInsets.symmetric(
                    horizontal: 12, vertical: 10),
                filled: true,
                fillColor: AppColors.surface,
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide:
                        const BorderSide(color: AppColors.cardBorder)),
                enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide:
                        const BorderSide(color: AppColors.cardBorder)),
                focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(
                        color: AppColors.roleNutritionist)),
              ),
            ),
          ),
          const SizedBox(width: 8),
          SizedBox(
            width: 70,
            child: TextFormField(
              initialValue:
                  meal.calories > 0 ? meal.calories.toString() : '',
              onChanged: (v) => meal.calories = int.tryParse(v) ?? 0,
              keyboardType: TextInputType.number,
              style: const TextStyle(
                  color: AppColors.roleNutritionist,
                  fontSize: 13,
                  fontWeight: FontWeight.w700),
              decoration: InputDecoration(
                hintText: 'kcal',
                hintStyle: const TextStyle(
                    color: AppColors.textMuted, fontSize: 11),
                contentPadding: const EdgeInsets.symmetric(
                    horizontal: 10, vertical: 10),
                filled: true,
                fillColor: AppColors.surface,
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide:
                        const BorderSide(color: AppColors.cardBorder)),
                enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide:
                        const BorderSide(color: AppColors.cardBorder)),
                focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(
                        color: AppColors.roleNutritionist)),
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close_rounded,
                size: 16, color: AppColors.error),
            onPressed: onRemove,
            padding: const EdgeInsets.all(4),
            constraints: const BoxConstraints(),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared Form Widgets
// ─────────────────────────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);

  @override
  Widget build(BuildContext context) => Text(
        text,
        style: const TextStyle(
            color: AppColors.textMuted,
            fontSize: 10,
            fontWeight: FontWeight.w800,
            letterSpacing: 1.5),
      );
}

class _FormCard extends StatelessWidget {
  final Widget child;
  const _FormCard({required this.child});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: child,
      );
}

class _Field extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final IconData icon;
  final String? Function(String?)? validator;
  final TextInputType? keyboardType;
  final int maxLines;
  final Color accentColor;

  const _Field({
    required this.controller,
    required this.label,
    required this.icon,
    this.validator,
    this.keyboardType,
    this.maxLines = 1,
    this.accentColor = AppColors.roleNutritionist,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      validator: validator,
      keyboardType: keyboardType,
      maxLines: maxLines,
      style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
      decoration: InputDecoration(
        labelText: label,
        labelStyle:
            const TextStyle(color: AppColors.textMuted, fontSize: 13),
        prefixIcon: Icon(icon, color: AppColors.textMuted, size: 18),
        filled: true,
        fillColor: AppColors.surface,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.cardBorder)),
        enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.cardBorder)),
        focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: accentColor, width: 1.5)),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Data models (local state only)
// ─────────────────────────────────────────────────────────────────────────────

class _DayData {
  String title;
  List<_MealData> meals;

  _DayData({required this.title, List<_MealData>? meals})
      : meals = meals ?? [];

  Map<String, dynamic> toJson() => {
        'title': title,
        'meals': meals.map((m) => m.toJson()).toList(),
      };
}

class _MealData {
  String name;
  int calories;

  _MealData({this.name = '', this.calories = 0});

  Map<String, dynamic> toJson() => {
        'name': name,
        'mealType': name,
        'calories': calories,
      };
}
