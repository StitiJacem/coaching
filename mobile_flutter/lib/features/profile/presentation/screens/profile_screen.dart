import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../shared/providers/auth_provider.dart';
import '../../../connections/data/athletes_repository.dart';
import '../../../../shared/widgets/animate_in.dart';

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

  double? _weight;
  double? _height;
  String _sport = '';

  List<String> _specializations = [];
  final _specCtrl = TextEditingController();

  Map<String, dynamic>? _profile;

  final _specs = ['Padel', 'Football', 'Swimming', 'Running', 'Weightlifting', 'CrossFit', 'Musculation', 'Nutrition'];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _firstNameCtrl.dispose(); _lastNameCtrl.dispose(); _phoneCtrl.dispose(); _bioCtrl.dispose(); _specCtrl.dispose();
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
      _specializations = specs?.map((s) => s['specialization']?.toString() ?? '').where((s) => s.isNotEmpty).toList() ?? [];
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
        if (user.role == AppConstants.roleCoach) 'specializations': _specializations,
      };
      await ref.read(athletesRepositoryProvider).updateMyProfile(data);
      setState(() => _saveMessage = '✓  PROFILE UPDATED SUCCESSFULLY');
    } catch (e) {
      setState(() => _saveMessage = 'ERROR: $e');
    }
    if (mounted) setState(() => _saving = false);
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final isAthlete = user?.role == AppConstants.roleAthlete;
    final isCoach = user?.role == AppConstants.roleCoach;
    final initial = _firstNameCtrl.text.isNotEmpty ? _firstNameCtrl.text[0].toUpperCase() : (user?.firstName.isNotEmpty == true ? user!.firstName[0].toUpperCase() : 'U');

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverAppBar(
              floating: true,
              backgroundColor: Colors.transparent,
              elevation: 0,
              title: const Text('PROFILE', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -1)),
              actions: [
                TextButton(
                  onPressed: _saving ? null : _save,
                  child: _saving ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2)) : const Text('SAVE', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 1)),
                ),
                const SizedBox(width: 12),
              ],
            ),
            if (_loading) const SliverFillRemaining(child: Center(child: CircularProgressIndicator(color: AppColors.primary)))
            else SliverPadding(
              padding: const EdgeInsets.all(24),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  AnimateIn(
                    delay: 100,
                    child: Center(
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          Container(width: 120, height: 120, decoration: BoxDecoration(shape: BoxShape.circle, boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.2), blurRadius: 40, spreadRadius: 5)])),
                          Container(
                            width: 100, height: 100,
                            decoration: BoxDecoration(gradient: const LinearGradient(colors: [AppColors.primary, Color(0xFFE8621A)], begin: Alignment.topLeft, end: Alignment.bottomRight), shape: BoxShape.circle),
                            child: Center(child: Text(initial, style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 42))),
                          ),
                          Positioned(bottom: 0, right: 0, child: Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: AppColors.surface, shape: BoxShape.circle, border: Border.all(color: AppColors.background, width: 3)), child: const Icon(Icons.camera_alt_rounded, color: AppColors.primary, size: 18))),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (user != null) AnimateIn(delay: 150, child: Center(child: _RolePill(role: user.role))),
                  const SizedBox(height: 40),

                  AnimateIn(
                    delay: 200,
                    child: _Section(
                      title: 'IDENTITY',
                      children: [
                        _TwoColRow(left: _InputField(label: 'FIRST NAME', controller: _firstNameCtrl), right: _InputField(label: 'LAST NAME', controller: _lastNameCtrl)),
                        const SizedBox(height: 20),
                        _InputField(label: 'EMAIL ADDRESS', initialValue: user?.email ?? '', readOnly: true),
                        const SizedBox(height: 20),
                        _InputField(label: 'PHONE NUMBER', controller: _phoneCtrl, keyboardType: TextInputType.phone),
                        const SizedBox(height: 20),
                        _InputField(label: 'BIO', controller: _bioCtrl, maxLines: 3, hint: 'Tell your world...'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  if (isAthlete) ...[
                    AnimateIn(
                      delay: 300,
                      child: _Section(
                        title: 'ATHLETIC DATA',
                        children: [
                          _InputField(label: 'PRIMARY SPORT', initialValue: _sport, onChanged: (v) => _sport = v, hint: 'e.g. Football, CrossFit'),
                          const SizedBox(height: 20),
                          _TwoColRow(
                            left: _InputField(label: 'WEIGHT (KG)', initialValue: _weight?.toString() ?? '', keyboardType: TextInputType.number, onChanged: (v) => _weight = double.tryParse(v)),
                            right: _InputField(label: 'HEIGHT (CM)', initialValue: _height?.toString() ?? '', keyboardType: TextInputType.number, onChanged: (v) => _height = double.tryParse(v)),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],

                  if (isCoach) ...[
                    AnimateIn(
                      delay: 300,
                      child: _Section(
                        title: 'SPECIALIZATIONS',
                        children: [
                          Wrap(
                            spacing: 10, runSpacing: 10,
                            children: _specs.map((s) {
                              final selected = _specializations.contains(s);
                              return GestureDetector(
                                onTap: () => setState(() => selected ? _specializations.remove(s) : _specializations.add(s)),
                                child: AnimatedContainer(duration: const Duration(milliseconds: 200), padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10), decoration: BoxDecoration(color: selected ? AppColors.primary : AppColors.surfaceVariant, borderRadius: BorderRadius.circular(12), border: Border.all(color: selected ? AppColors.primary : AppColors.cardBorder, width: 1.5)), child: Text(s.toUpperCase(), style: TextStyle(color: selected ? Colors.black : AppColors.textSecondary, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 0.5))),
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],

                  if (_saveMessage.isNotEmpty) AnimateIn(child: Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: _saveMessage.contains('SUCCESS') ? AppColors.success.withValues(alpha: 0.1) : AppColors.error.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(16), border: Border.all(color: _saveMessage.contains('SUCCESS') ? AppColors.success : AppColors.error, width: 1.5)), child: Text(_saveMessage, style: TextStyle(color: _saveMessage.contains('SUCCESS') ? AppColors.success : AppColors.error, fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 1)))),
                  const SizedBox(height: 32),

                  AnimateIn(
                    delay: 400,
                    child: GestureDetector(
                      onTap: () => _logout(context),
                      child: AppTheme.glassCard(opacity: 0.05, child: const ListTile(leading: Icon(Icons.logout_rounded, color: AppColors.error), title: Text('TERMINATE SESSION', style: TextStyle(color: AppColors.error, fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 2)))),
                    ),
                  ),
                  const SizedBox(height: 64),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _logout(BuildContext context) async {
    final confirmed = await showGeneralDialog<bool>(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Logout',
      pageBuilder: (ctx, anim1, anim2) => Center(
        child: AppTheme.glassCard(
          opacity: 0.1,
          child: Container(
            width: 300, padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('TERMINATE SESSION?', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900, letterSpacing: 1)),
                const SizedBox(height: 16),
                const Text('You will be returned to the login screen.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textMuted, fontSize: 14)),
                const SizedBox(height: 32),
                Row(
                  children: [
                    Expanded(child: OutlinedButton(onPressed: () => Navigator.pop(ctx, false), style: OutlinedButton.styleFrom(side: const BorderSide(color: AppColors.cardBorder), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))), child: const Text('CANCEL', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900)))),
                    const SizedBox(width: 16),
                    Expanded(child: ElevatedButton(onPressed: () => Navigator.pop(ctx, true), style: ElevatedButton.styleFrom(backgroundColor: AppColors.error, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))), child: const Text('LOGOUT', style: TextStyle(fontWeight: FontWeight.w900)))),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );

    if (confirmed == true && mounted) {
      await ref.read(authProvider.notifier).logout();
      if (mounted) context.go('/login');
    }
  }
}

class _RolePill extends StatelessWidget {
  final String role;
  const _RolePill({required this.role});
  @override
  Widget build(BuildContext context) {
    Color color = AppColors.primary;
    if (role == AppConstants.roleCoach) color = Colors.indigoAccent;
    return Container(padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6), decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(20), border: Border.all(color: color.withValues(alpha: 0.4))), child: Text(role.toUpperCase(), style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.5)));
  }
}

class _Section extends StatelessWidget {
  final String title;
  final List<Widget> children;
  const _Section({required this.title, required this.children});
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2)),
        const SizedBox(height: 16),
        AppTheme.glassCard(opacity: 0.05, child: Padding(padding: const EdgeInsets.all(20), child: Column(children: children))),
      ],
    );
  }
}

class _TwoColRow extends StatelessWidget {
  final Widget left;
  final Widget right;
  const _TwoColRow({required this.left, required this.right});
  @override
  Widget build(BuildContext context) => Row(children: [Expanded(child: left), const SizedBox(width: 16), Expanded(child: right)]);
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

  const _InputField({required this.label, this.controller, this.initialValue, this.readOnly = false, this.maxLines = 1, this.keyboardType, this.hint, this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 1)),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          initialValue: controller == null ? initialValue : null,
          readOnly: readOnly,
          maxLines: maxLines,
          keyboardType: keyboardType,
          onChanged: onChanged,
          style: TextStyle(color: readOnly ? AppColors.textMuted : Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
          decoration: InputDecoration(hintText: hint, hintStyle: const TextStyle(color: Colors.white24), filled: true, fillColor: readOnly ? Colors.transparent : AppColors.surfaceVariant.withValues(alpha: 0.3), contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14), border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none), enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none)),
        ),
      ],
    );
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
