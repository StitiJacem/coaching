import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../shared/providers/auth_provider.dart';
import '../../../connections/data/athletes_repository.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  bool _loading = true;
  bool _saving = false;
  String _saveMessage = '';

  final _firstNameCtrl = TextEditingController();
  final _lastNameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _bioCtrl = TextEditingController();

  // Athlete-specific
  double? _weight;
  double? _height;
  String _sport = '';

  // Coach-specific
  List<String> _specializations = [];
  final _specCtrl = TextEditingController();

  Map<String, dynamic>? _profile;

  final _specs = [
    'Padel', 'Tennis', 'Football', 'Basketball', 'Swimming',
    'Cycling', 'Running', 'Weightlifting', 'Pilates', 'Yoga',
    'CrossFit', 'Boxing', 'Musculation', 'Rehabilitation', 'Nutrition',
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _phoneCtrl.dispose();
    _bioCtrl.dispose();
    _specCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await ref.read(athletesRepositoryProvider).getMyProfile();
      _profile = data;
      _firstNameCtrl.text = data['first_name'] ?? '';
      _lastNameCtrl.text = data['last_name'] ?? '';
      _phoneCtrl.text = data['phone'] ?? '';
      _bioCtrl.text = data['bio'] ?? '';
      _sport = data['sport'] ?? '';
      _weight = (data['weight'] as num?)?.toDouble();
      _height = (data['height'] as num?)?.toDouble();
      final specs = data['specializations'] as List?;
      _specializations = specs
              ?.map((s) => s['specialization']?.toString() ?? '')
              .where((s) => s.isNotEmpty)
              .toList() ??
          [];
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _save() async {
    setState(() { _saving = true; _saveMessage = ''; });
    try {
      final user = ref.read(currentUserProvider)!;
      final data = {
        'first_name': _firstNameCtrl.text.trim(),
        'last_name': _lastNameCtrl.text.trim(),
        'phone': _phoneCtrl.text.trim(),
        'bio': _bioCtrl.text.trim(),
        if (user.role == AppConstants.roleAthlete) ...{
          'sport': _sport,
          if (_weight != null) 'weight': _weight,
          if (_height != null) 'height': _height,
        },
        if (user.role == AppConstants.roleCoach)
          'specializations': _specializations,
      };
      await ref.read(athletesRepositoryProvider).updateMyProfile(data);
      setState(() => _saveMessage = '✓  Profile updated successfully!');
    } catch (e) {
      setState(() => _saveMessage = 'Error: $e');
    }
    if (mounted) setState(() => _saving = false);
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final isAthlete = user?.role == AppConstants.roleAthlete;
    final isCoach = user?.role == AppConstants.roleCoach;
    final initial = _firstNameCtrl.text.isNotEmpty
        ? _firstNameCtrl.text[0].toUpperCase()
        : (user?.firstName.isNotEmpty == true
            ? user!.firstName[0].toUpperCase()
            : 'U');

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
              title: const Text('MY PROFILE',
                  style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 20,
                      fontWeight: FontWeight.w800)),
              actions: [
                TextButton(
                  onPressed: _saving ? null : _save,
                  child: _saving
                      ? const SizedBox(
                          width: 18, height: 18,
                          child: CircularProgressIndicator(
                              color: AppColors.primary, strokeWidth: 2))
                      : const Text('Save',
                          style: TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w700,
                              fontSize: 15)),
                ),
                const SizedBox(width: 8),
              ],
            ),
            if (_loading)
              const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    // ── Avatar block ──────────────────────────────────────
                    Center(
                      child: Stack(
                        children: [
                          Container(
                            width: 88,
                            height: 88,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFFE8621A), Color(0xFFBF4D10)],
                              ),
                              shape: BoxShape.circle,
                            ),
                            child: Center(
                              child: Text(initial,
                                  style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w800,
                                      fontSize: 34)),
                            ),
                          ),
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: const BoxDecoration(
                                  color: AppColors.primary, shape: BoxShape.circle),
                              child: const Icon(Icons.camera_alt_rounded,
                                  color: Colors.white, size: 14),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (user != null)
                      Center(
                        child: _RolePill(role: user.role),
                      ),
                    const SizedBox(height: 24),

                    // ── Basic info card ───────────────────────────────────
                    _Section(
                      title: 'Basic Info',
                      children: [
                        _TwoColRow(
                          left: _InputField(
                            label: 'FIRST NAME',
                            controller: _firstNameCtrl,
                          ),
                          right: _InputField(
                            label: 'LAST NAME',
                            controller: _lastNameCtrl,
                          ),
                        ),
                        const SizedBox(height: 14),
                        _InputField(
                          label: 'EMAIL (READ-ONLY)',
                          initialValue: user?.email ?? '',
                          readOnly: true,
                        ),
                        const SizedBox(height: 14),
                        _InputField(
                          label: 'PHONE',
                          controller: _phoneCtrl,
                          keyboardType: TextInputType.phone,
                        ),
                        const SizedBox(height: 14),
                        _InputField(
                          label: 'BIO',
                          controller: _bioCtrl,
                          maxLines: 3,
                          hint: 'Tell your clients about yourself...',
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // ── Athlete-specific ──────────────────────────────────
                    if (isAthlete) ...[
                      _Section(
                        title: 'Athletic Profile',
                        children: [
                          _InputField(
                            label: 'SPORT',
                            initialValue: _sport,
                            onChanged: (v) => _sport = v,
                            hint: 'e.g. Football, CrossFit, Padel',
                          ),
                          const SizedBox(height: 14),
                          _TwoColRow(
                            left: _InputField(
                              label: 'WEIGHT (KG)',
                              initialValue: _weight?.toString() ?? '',
                              keyboardType: TextInputType.number,
                              onChanged: (v) => _weight = double.tryParse(v),
                            ),
                            right: _InputField(
                              label: 'HEIGHT (CM)',
                              initialValue: _height?.toString() ?? '',
                              keyboardType: TextInputType.number,
                              onChanged: (v) => _height = double.tryParse(v),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                    ],

                    // ── Coach-specific ────────────────────────────────────
                    if (isCoach) ...[
                      _Section(
                        title: 'Specializations',
                        children: [
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: _specs.map((s) {
                              final selected = _specializations.contains(s);
                              return GestureDetector(
                                onTap: () => setState(() {
                                  if (selected) {
                                    _specializations.remove(s);
                                  } else {
                                    _specializations.add(s);
                                  }
                                }),
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 150),
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 14, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: selected
                                        ? AppColors.primary
                                        : AppColors.surfaceVariant,
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(
                                      color: selected
                                          ? AppColors.primary
                                          : AppColors.cardBorder,
                                    ),
                                  ),
                                  child: Text(s,
                                      style: TextStyle(
                                          color: selected
                                              ? Colors.white
                                              : AppColors.textSecondary,
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600)),
                                ),
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                    ],

                    // ── Save message ──────────────────────────────────────
                    if (_saveMessage.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: _saveMessage.startsWith('✓')
                              ? AppColors.success.withOpacity(0.1)
                              : AppColors.error.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: _saveMessage.startsWith('✓')
                                ? AppColors.success.withOpacity(0.3)
                                : AppColors.error.withOpacity(0.3),
                          ),
                        ),
                        child: Text(_saveMessage,
                            style: TextStyle(
                              color: _saveMessage.startsWith('✓')
                                  ? AppColors.success
                                  : AppColors.error,
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            )),
                      ),
                    const SizedBox(height: 16),

                    // ── Logout ────────────────────────────────────────────
                    Container(
                      decoration: BoxDecoration(
                        color: AppColors.card,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.cardBorder),
                      ),
                      child: ListTile(
                        leading: const Icon(Icons.logout_rounded,
                            color: AppColors.error, size: 22),
                        title: const Text('Log out',
                            style: TextStyle(
                                color: AppColors.error,
                                fontWeight: FontWeight.w600)),
                        onTap: () => _logout(context),
                      ),
                    ),
                    const SizedBox(height: 40),
                  ]),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _logout(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (dialogCtx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Log out?',
            style: TextStyle(color: AppColors.textPrimary)),
        content: const Text('You will be returned to the login screen.',
            style: TextStyle(color: AppColors.textMuted)),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(dialogCtx, false),
              child: const Text('Cancel')),
          TextButton(
              onPressed: () => Navigator.pop(dialogCtx, true),
              child: const Text('Log out',
                  style: TextStyle(color: AppColors.error))),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      // Show a non-blocking loading indicator if needed, but the redirect should be fast
      try {
        await ref.read(authProvider.notifier).logout();
        // GoRouter will pick up the state change and redirect via its redirect: property
        // but explicit navigation here as a fallback is safer if redirect is delayed
        if (mounted) context.go('/login');
      } catch (e) {
        debugPrint('Logout error: $e');
      }
    }
  }
}

// ─── Shared helper widgets ────────────────────────────────────────────────────

class _RolePill extends StatelessWidget {
  final String role;
  const _RolePill({required this.role});

  Color get _color {
    switch (role) {
      case AppConstants.roleCoach: return AppColors.roleCoach;
      case AppConstants.roleDoctor: return AppColors.roleDoctor;
      case AppConstants.roleNutritionist: return AppColors.roleNutritionist;
      default: return AppColors.roleAthlete;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
      decoration: BoxDecoration(
        color: _color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _color.withValues(alpha: 0.3)),
      ),
      child: Text(role.toUpperCase(),
          style: TextStyle(
              color: _color,
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.2)),
    );
  }
}

class _Section extends StatelessWidget {
  final String title;
  final List<Widget> children;
  const _Section({required this.title, required this.children});

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
                  fontSize: 15,
                  fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          ...children,
        ],
      ),
    );
  }
}

class _TwoColRow extends StatelessWidget {
  final Widget left;
  final Widget right;
  const _TwoColRow({required this.left, required this.right});

  @override
  Widget build(BuildContext context) => Row(
        children: [
          Expanded(child: left),
          const SizedBox(width: 12),
          Expanded(child: right),
        ],
      );
}

class _InputField extends StatelessWidget {
  final String label;
  final TextEditingController? controller;
  final String? initialValue;
  final bool readOnly;
  final int maxLines;
  final TextInputType? keyboardType;
  final String? hint;
  final ValueChanged<String>? onChanged;

  const _InputField({
    required this.label,
    this.controller,
    this.initialValue,
    this.readOnly = false,
    this.maxLines = 1,
    this.keyboardType,
    this.hint,
    this.onChanged,
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
        TextFormField(
          controller: controller,
          initialValue: controller == null ? initialValue : null,
          readOnly: readOnly,
          maxLines: maxLines,
          keyboardType: keyboardType,
          onChanged: onChanged,
          style: TextStyle(
              color: readOnly ? AppColors.textMuted : AppColors.textPrimary,
              fontSize: 14),
          decoration: InputDecoration(
            hintText: hint,
            filled: true,
            fillColor: readOnly ? AppColors.background : AppColors.surfaceVariant,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
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
