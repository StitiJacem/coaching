import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../shared/providers/auth_provider.dart';
import '../../../../features/auth/data/auth_repository.dart';
import '../../../../core/errors/api_exception.dart';

/// Mirrors web's CompleteProfileComponent — multi-step onboarding wizard
class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _pageController = PageController();
  int _currentStep = 0;
  bool _loading = false;

  // ── Athlete fields ───────────────────────────────────────────────────────
  final _ageCtrl = TextEditingController();
  final _heightCtrl = TextEditingController();
  final _weightCtrl = TextEditingController();
  String _sport = 'Football';
  String _experienceLevel = 'beginner';
  String _primaryObjective = 'Build Muscle';
  final List<int> _trainingDays = [1, 3, 5]; // Mon, Wed, Fri default

  // ── Coach fields ─────────────────────────────────────────────────────────
  final _bioCtrl = TextEditingController();
  final _expYearsCtrl = TextEditingController();
  final List<String> _specializations = [];

  final _sports = ['Football', 'Basketball', 'Swimming', 'Running', 'Cycling',
    'Tennis', 'Crossfit', 'Weightlifting', 'MMA', 'Other'];
  final _objectives = ['Build Muscle', 'Lose Weight', 'Improve Endurance', 
    'Increase Strength', 'Improve Flexibility', 'Athletic Performance'];
  final _levels = ['beginner', 'intermediate', 'advanced', 'elite'];
  final _specOptions = ['Strength', 'Cardio', 'HIIT', 'Yoga', 'Crossfit',
    'Nutrition', 'Rehab', 'Performance', 'Weight Loss'];
  final _dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  @override
  void dispose() {
    _pageController.dispose();
    _ageCtrl.dispose(); _heightCtrl.dispose(); _weightCtrl.dispose();
    _bioCtrl.dispose(); _expYearsCtrl.dispose();
    super.dispose();
  }

  String get role => ref.read(currentUserProvider)?.role ?? AppConstants.roleAthlete;
  bool get isAthlete => role == AppConstants.roleAthlete;

  Future<void> _submit() async {
    setState(() => _loading = true);
    try {
      final user = ref.read(currentUserProvider)!;
      final api = ref.read(apiClientProvider);

      if (isAthlete) {
        await api.patch('/athletes/${user.id}', data: {
          'age': int.tryParse(_ageCtrl.text),
          'height': double.tryParse(_heightCtrl.text),
          'weight': double.tryParse(_weightCtrl.text),
          'sport': _sport,
          'experienceLevel': _experienceLevel,
          'primaryObjective': _primaryObjective,
          'preferredTrainingDays': _trainingDays,
        });
      } else {
        await api.patch('/coaches/me', data: {
          'bio': _bioCtrl.text.trim(),
          'experience_years': int.tryParse(_expYearsCtrl.text) ?? 0,
          'specializations': _specializations,
        });
      }

      // Update local user onboarding state
      final updatedUser =
          user.copyWith(onboardingCompleted: true);
      ref.read(authProvider.notifier).updateUser(updatedUser);

      if (mounted) context.go('/dashboard');
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message), backgroundColor: AppColors.error,
              behavior: SnackBarBehavior.floating),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _next() {
    final totalSteps = isAthlete ? 3 : 2;
    if (_currentStep < totalSteps - 1) {
      _pageController.nextPage(
          duration: const Duration(milliseconds: 350), curve: Curves.easeInOut);
      setState(() => _currentStep++);
    } else {
      _submit();
    }
  }

  void _back() {
    if (_currentStep > 0) {
      _pageController.previousPage(
          duration: const Duration(milliseconds: 350), curve: Curves.easeInOut);
      setState(() => _currentStep--);
    }
  }

  @override
  Widget build(BuildContext context) {
    final totalSteps = isAthlete ? 3 : 2;
    final pages = isAthlete ? _athletePages() : _coachPages();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        leading: _currentStep > 0
            ? IconButton(
                icon: const Icon(Icons.arrow_back_ios_new_rounded),
                onPressed: _back,
              )
            : null,
        title: const Text('Complete Your Profile'),
        actions: [
          TextButton(
            onPressed: () => context.go('/dashboard'),
            child: const Text('Skip',
                style: TextStyle(color: AppColors.textMuted)),
          ),
        ],
      ),
      body: Column(
        children: [
          // Progress bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
            child: LinearProgressIndicator(
              value: (_currentStep + 1) / totalSteps,
              backgroundColor: AppColors.cardBorder,
              valueColor:
                  const AlwaysStoppedAnimation<Color>(AppColors.primary),
              minHeight: 4,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Step ${_currentStep + 1} of $totalSteps',
                    style: const TextStyle(
                        color: AppColors.textMuted, fontSize: 12)),
                Text(
                  isAthlete
                      ? ['Body Metrics', 'Your Goals', 'Training Days'][_currentStep]
                      : ['Your Profile', 'Specializations'][_currentStep],
                  style: const TextStyle(
                      color: AppColors.primary,
                      fontSize: 12,
                      fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: PageView(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              children: pages,
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(24),
            child: _loading
                ? const Center(
                    child: CircularProgressIndicator(color: AppColors.primary))
                : ElevatedButton(
                    onPressed: _next,
                    child: Text(_currentStep < totalSteps - 1
                        ? 'Continue'
                        : 'Finish Setup'),
                  ),
          ),
        ],
      ),
    );
  }

  // ── Athlete step pages ─────────────────────────────────────────────────────

  List<Widget> _athletePages() => [_step1Body(), _step2Goals(), _step3Days()];

  Widget _step1Body() => SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Body Metrics', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 4),
            const Text('Help us personalize your experience',
                style: TextStyle(color: AppColors.textSecondary)),
            const SizedBox(height: 32),
            Row(
              children: [
                Expanded(
                  child: _OnboardingField(
                    controller: _ageCtrl,
                    label: 'Age',
                    hint: '25',
                    keyboardType: TextInputType.number,
                    suffix: 'yrs',
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _OnboardingField(
                    controller: _heightCtrl,
                    label: 'Height',
                    hint: '175',
                    keyboardType: TextInputType.number,
                    suffix: 'cm',
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _OnboardingField(
                    controller: _weightCtrl,
                    label: 'Weight',
                    hint: '70',
                    keyboardType: TextInputType.number,
                    suffix: 'kg',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 28),
            const Text('Sport / Discipline',
                style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 13,
                    fontWeight: FontWeight.w500)),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _sports.map((s) {
                final sel = _sport == s;
                return ChoiceChip(
                  label: Text(s),
                  selected: sel,
                  onSelected: (_) => setState(() => _sport = s),
                  selectedColor: AppColors.primary.withValues(alpha: 0.2),
                  labelStyle: TextStyle(
                      color:
                          sel ? AppColors.primary : AppColors.textSecondary),
                  side: BorderSide(
                      color: sel ? AppColors.primary : AppColors.cardBorder),
                );
              }).toList(),
            ),
            const SizedBox(height: 28),
            const Text('Experience Level',
                style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 13,
                    fontWeight: FontWeight.w500)),
            const SizedBox(height: 12),
            Row(
              children: _levels.map((l) {
                final sel = _experienceLevel == l;
                return Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _experienceLevel = l),
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        color: sel
                            ? AppColors.primary.withValues(alpha: 0.15)
                            : AppColors.surfaceVariant,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                            color: sel
                                ? AppColors.primary
                                : AppColors.cardBorder),
                      ),
                      child: Text(
                        l[0].toUpperCase() + l.substring(1),
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            fontSize: 11,
                            fontWeight: sel
                                ? FontWeight.w600
                                : FontWeight.normal,
                            color: sel
                                ? AppColors.primary
                                : AppColors.textSecondary),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
        ),
      );

  Widget _step2Goals() => SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Your Goals', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 4),
            const Text("What's your primary objective?",
                style: TextStyle(color: AppColors.textSecondary)),
            const SizedBox(height: 32),
            ..._objectives.map((obj) {
              final sel = _primaryObjective == obj;
              return GestureDetector(
                onTap: () => setState(() => _primaryObjective = obj),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(
                    color: sel
                        ? AppColors.primary.withValues(alpha: 0.12)
                        : AppColors.surfaceVariant,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                        color:
                            sel ? AppColors.primary : AppColors.cardBorder,
                        width: sel ? 1.5 : 1),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        sel
                            ? Icons.radio_button_checked_rounded
                            : Icons.radio_button_unchecked_rounded,
                        color: sel
                            ? AppColors.primary
                            : AppColors.textMuted,
                        size: 20,
                      ),
                      const SizedBox(width: 12),
                      Text(obj,
                          style: TextStyle(
                              color: sel
                                  ? AppColors.primary
                                  : AppColors.textPrimary,
                              fontWeight: sel
                                  ? FontWeight.w600
                                  : FontWeight.normal)),
                    ],
                  ),
                ),
              );
            }),
          ],
        ),
      );

  Widget _step3Days() => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Training Schedule',
                style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 4),
            const Text('Which days do you prefer to train?',
                style: TextStyle(color: AppColors.textSecondary)),
            const SizedBox(height: 40),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: List.generate(7, (i) {
                final dayNum = i + 1; // 1=Mon ... 7=Sun
                final sel = _trainingDays.contains(dayNum);
                return GestureDetector(
                  onTap: () {
                    setState(() {
                      if (sel) {
                        _trainingDays.remove(dayNum);
                      } else {
                        _trainingDays.add(dayNum);
                      }
                    });
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: sel
                          ? AppColors.primary
                          : AppColors.surfaceVariant,
                      shape: BoxShape.circle,
                      border: Border.all(
                          color: sel
                              ? AppColors.primary
                              : AppColors.cardBorder),
                    ),
                    child: Center(
                      child: Text(
                        _dayNames[i],
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: sel ? Colors.white : AppColors.textMuted,
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ),
            const SizedBox(height: 16),
            Center(
              child: Text(
                '${_trainingDays.length} day${_trainingDays.length != 1 ? 's' : ''} selected',
                style: const TextStyle(
                    color: AppColors.textSecondary, fontSize: 13),
              ),
            ),
          ],
        ),
      );

  // ── Coach step pages ───────────────────────────────────────────────────────

  List<Widget> _coachPages() => [_coachStep1(), _coachStep2()];

  Widget _coachStep1() => SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Your Coach Profile',
                style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 4),
            const Text('Tell athletes about yourself',
                style: TextStyle(color: AppColors.textSecondary)),
            const SizedBox(height: 32),
            const Text('Bio',
                style: TextStyle(
                    color: AppColors.textSecondary, fontSize: 13,
                    fontWeight: FontWeight.w500)),
            const SizedBox(height: 8),
            TextFormField(
              controller: _bioCtrl,
              maxLines: 4,
              style: const TextStyle(color: AppColors.textPrimary),
              decoration: InputDecoration(
                hintText: 'Describe your coaching philosophy and experience...',
                hintStyle:
                    const TextStyle(color: AppColors.textMuted),
                filled: true,
                fillColor: AppColors.surfaceVariant,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide:
                      const BorderSide(color: AppColors.cardBorder),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide:
                      const BorderSide(color: AppColors.cardBorder),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(
                      color: AppColors.primary, width: 1.5),
                ),
              ),
            ),
            const SizedBox(height: 20),
            _OnboardingField(
              controller: _expYearsCtrl,
              label: 'Years of Experience',
              hint: '5',
              keyboardType: TextInputType.number,
              suffix: 'yrs',
            ),
          ],
        ),
      );

  Widget _coachStep2() => SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Specializations',
                style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 4),
            const Text('Select your areas of expertise',
                style: TextStyle(color: AppColors.textSecondary)),
            const SizedBox(height: 32),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _specOptions.map((s) {
                final sel = _specializations.contains(s);
                return FilterChip(
                  label: Text(s),
                  selected: sel,
                  onSelected: (_) {
                    setState(() {
                      if (sel) {
                        _specializations.remove(s);
                      } else {
                        _specializations.add(s);
                      }
                    });
                  },
                  selectedColor: AppColors.primary.withValues(alpha: 0.2),
                  checkmarkColor: AppColors.primary,
                  labelStyle: TextStyle(
                      color: sel
                          ? AppColors.primary
                          : AppColors.textSecondary),
                  side: BorderSide(
                      color:
                          sel ? AppColors.primary : AppColors.cardBorder),
                );
              }).toList(),
            ),
          ],
        ),
      );
}

// ── Helper widget ─────────────────────────────────────────────────────────────

class _OnboardingField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final String hint;
  final String? suffix;
  final TextInputType? keyboardType;

  const _OnboardingField({
    required this.controller,
    required this.label,
    required this.hint,
    this.suffix,
    this.keyboardType,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 12,
                fontWeight: FontWeight.w500)),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          style:
              const TextStyle(color: AppColors.textPrimary, fontSize: 15),
          decoration: InputDecoration(
            hintText: hint,
            suffixText: suffix,
            suffixStyle:
                const TextStyle(color: AppColors.textMuted, fontSize: 12),
            contentPadding: const EdgeInsets.symmetric(
                horizontal: 12, vertical: 14),
          ),
        ),
      ],
    );
  }
}
