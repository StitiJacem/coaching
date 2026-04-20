import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/providers/auth_provider.dart';
import '../../../connections/data/athletes_repository.dart';

class GoalsScreen extends ConsumerStatefulWidget {
  const GoalsScreen({super.key});

  @override
  ConsumerState<GoalsScreen> createState() => _GoalsScreenState();
}

class _GoalsScreenState extends ConsumerState<GoalsScreen> {
  bool _loading = true;
  bool _saving = false;
  String _saveMessage = '';

  String _primaryObjective = '';
  String _targetMetric = '';
  String _deadline = '';
  String _timePerSession = '';
  String _experienceLevel = '';
  String _equipment = '';

  final _metricCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _metricCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final user = ref.read(currentUserProvider)!;
      final resp = await ref.read(athletesRepositoryProvider).getById(user.id);
      setState(() {
        _primaryObjective = resp['primaryObjective'] ?? '';
        _targetMetric = resp['targetMetric'] ?? '';
        _metricCtrl.text = _targetMetric;
        _deadline = resp['deadline']?.toString().substring(0, 10) ?? '';
        _timePerSession = resp['timePerSession'] ?? '';
        _experienceLevel = resp['experienceLevel'] ?? '';
        _equipment = resp['equipment'] ?? '';
      });
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _save() async {
    setState(() { _saving = true; _saveMessage = ''; });
    try {
      final user = ref.read(currentUserProvider)!;
      await ref.read(athletesRepositoryProvider).updateGoals(user.id, {
        'primaryObjective': _primaryObjective,
        'targetMetric': _metricCtrl.text.trim(),
        'deadline': _deadline.isNotEmpty ? _deadline : null,
        'timePerSession': _timePerSession,
        'experienceLevel': _experienceLevel,
        'equipment': _equipment,
      });
      setState(() => _saveMessage = '✓ Saved & coach notified!');
    } catch (e) {
      setState(() => _saveMessage = 'Error saving. Please try again.');
    }
    if (mounted) setState(() => _saving = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              floating: true,
              backgroundColor: AppColors.background,
              surfaceTintColor: Colors.transparent,
              titleSpacing: 16,
              title: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('YOUR PROFILE',
                      style: TextStyle(
                          color: AppColors.textMuted,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.5)),
                  Text('GOALS & SETUP',
                      style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 22,
                          fontWeight: FontWeight.w800)),
                ],
              ),
            ),
            if (_loading)
              const SliverFillRemaining(
                child: Center(
                    child: CircularProgressIndicator(color: AppColors.primary)),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    // ── Core Objectives ────────────────────────────────────
                    _FormSection(
                      title: 'Core Objectives',
                      children: [
                        _DropdownField(
                          label: 'PRIMARY GOAL',
                          value: _primaryObjective.isEmpty ? null : _primaryObjective,
                          items: const [
                            DropdownMenuItem(value: 'weight_loss', child: Text('Weight Loss')),
                            DropdownMenuItem(value: 'muscle_gain', child: Text('Muscle Gain')),
                            DropdownMenuItem(value: 'strength', child: Text('Strength')),
                            DropdownMenuItem(value: 'sport_performance', child: Text('Sport Performance')),
                            DropdownMenuItem(value: 'rehabilitation', child: Text('Rehabilitation')),
                            DropdownMenuItem(value: 'general_fitness', child: Text('General Fitness')),
                            DropdownMenuItem(value: 'other', child: Text('Other')),
                          ],
                          onChanged: (v) => setState(() => _primaryObjective = v ?? ''),
                        ),
                        const SizedBox(height: 16),
                        _TextField(
                          label: 'TARGET METRIC',
                          hint: 'e.g. lose 10kg, bench press 100kg',
                          controller: _metricCtrl,
                        ),
                        const SizedBox(height: 16),
                        _DateField(
                          label: 'TARGET DEADLINE (OPTIONAL)',
                          value: _deadline,
                          onChanged: (v) => setState(() => _deadline = v),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // ── Training Logistics ─────────────────────────────────
                    _FormSection(
                      title: 'Training Logistics',
                      children: [
                        _DropdownField(
                          label: 'AVAILABLE TIME PER SESSION',
                          value: _timePerSession.isEmpty ? null : _timePerSession,
                          items: const [
                            DropdownMenuItem(value: '30min', child: Text('30 min')),
                            DropdownMenuItem(value: '45min', child: Text('45 min')),
                            DropdownMenuItem(value: '60min', child: Text('60 min')),
                            DropdownMenuItem(value: '75min', child: Text('75 min')),
                            DropdownMenuItem(value: '90min+', child: Text('90+ min')),
                          ],
                          onChanged: (v) => setState(() => _timePerSession = v ?? ''),
                        ),
                        const SizedBox(height: 16),
                        _DropdownField(
                          label: 'EXPERIENCE LEVEL',
                          value: _experienceLevel.isEmpty ? null : _experienceLevel,
                          items: const [
                            DropdownMenuItem(value: 'beginner', child: Text('Beginner')),
                            DropdownMenuItem(value: 'intermediate', child: Text('Intermediate')),
                            DropdownMenuItem(value: 'advanced', child: Text('Advanced')),
                          ],
                          onChanged: (v) => setState(() => _experienceLevel = v ?? ''),
                        ),
                        const SizedBox(height: 16),
                        _DropdownField(
                          label: 'EQUIPMENT AVAILABLE',
                          value: _equipment.isEmpty ? null : _equipment,
                          items: const [
                            DropdownMenuItem(value: 'gym', child: Text('Full Gym Access')),
                            DropdownMenuItem(value: 'home_equip', child: Text('Home (with equipment)')),
                            DropdownMenuItem(value: 'home_body', child: Text('Home (bodyweight only)')),
                            DropdownMenuItem(value: 'outdoor', child: Text('Outdoor / Track')),
                          ],
                          onChanged: (v) => setState(() => _equipment = v ?? ''),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // ── Save bar ───────────────────────────────────────────
                    if (_saveMessage.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Text(
                          _saveMessage,
                          style: TextStyle(
                            color: _saveMessage.startsWith('✓')
                                ? AppColors.success
                                : AppColors.error,
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _saving ? null : _save,
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size(0, 54),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14)),
                        ),
                        child: _saving
                            ? const SizedBox(
                                width: 22, height: 22,
                                child: CircularProgressIndicator(
                                    color: Colors.white, strokeWidth: 2))
                            : const Text('Save Goals & Notify Coach',
                                style: TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 15,
                                    letterSpacing: 0.5)),
                      ),
                    ),
                    const SizedBox(height: 32),
                  ]),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Form helper widgets
// ─────────────────────────────────────────────────────────────────────────────

class _FormSection extends StatelessWidget {
  final String title;
  final List<Widget> children;
  const _FormSection({required this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 16,
                  fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          ...children,
        ],
      ),
    );
  }
}

class _DropdownField<T> extends StatelessWidget {
  final String label;
  final T? value;
  final List<DropdownMenuItem<T>> items;
  final ValueChanged<T?> onChanged;
  const _DropdownField({
    required this.label,
    required this.value,
    required this.items,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(
                color: AppColors.textMuted,
                fontSize: 10,
                fontWeight: FontWeight.w800,
                letterSpacing: 1)),
        const SizedBox(height: 6),
        DropdownButtonFormField<T>(
          value: value,
          items: items,
          onChanged: onChanged,
          dropdownColor: AppColors.surface,
          style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
          decoration: InputDecoration(
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            filled: true,
            fillColor: AppColors.surfaceVariant,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.cardBorder),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.cardBorder),
            ),
          ),
          hint: const Text('Select...',
              style: TextStyle(color: AppColors.textMuted)),
        ),
      ],
    );
  }
}

class _TextField extends StatelessWidget {
  final String label;
  final String hint;
  final TextEditingController controller;
  const _TextField(
      {required this.label, required this.hint, required this.controller});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(
                color: AppColors.textMuted,
                fontSize: 10,
                fontWeight: FontWeight.w800,
                letterSpacing: 1)),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
          decoration: InputDecoration(
            hintText: hint,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            filled: true,
            fillColor: AppColors.surfaceVariant,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.cardBorder),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.cardBorder),
            ),
          ),
        ),
      ],
    );
  }
}

class _DateField extends StatelessWidget {
  final String label;
  final String value;
  final ValueChanged<String> onChanged;
  const _DateField(
      {required this.label, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(
                color: AppColors.textMuted,
                fontSize: 10,
                fontWeight: FontWeight.w800,
                letterSpacing: 1)),
        const SizedBox(height: 6),
        GestureDetector(
          onTap: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: DateTime.now().add(const Duration(days: 30)),
              firstDate: DateTime.now(),
              lastDate: DateTime.now().add(const Duration(days: 365 * 2)),
              builder: (ctx, child) => Theme(
                data: Theme.of(ctx).copyWith(
                  colorScheme: const ColorScheme.dark(
                    primary: AppColors.primary,
                    surface: AppColors.surface,
                  ),
                ),
                child: child!,
              ),
            );
            if (picked != null) {
              onChanged(picked.toIso8601String().substring(0, 10));
            }
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            decoration: BoxDecoration(
              color: AppColors.surfaceVariant,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.cardBorder),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    value.isNotEmpty ? value : 'Select date...',
                    style: TextStyle(
                        color: value.isNotEmpty
                            ? AppColors.textPrimary
                            : AppColors.textMuted,
                        fontSize: 14),
                  ),
                ),
                const Icon(Icons.calendar_today_rounded,
                    color: AppColors.textMuted, size: 18),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
