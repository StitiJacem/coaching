import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../shared/providers/auth_provider.dart';
import '../widgets/auth_text_field.dart';
import '../widgets/auth_header.dart';

class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({super.key});

  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameCtrl = TextEditingController();
  final _lastNameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  final _ageCtrl = TextEditingController();
  String _selectedRole = AppConstants.roleAthlete;
  String _selectedGender = 'male';
  bool _passwordVisible = false;
  bool _isLoading = false;

  final _roles = [
    (value: AppConstants.roleAthlete, label: 'Athlete', icon: Icons.fitness_center_rounded),
    (value: AppConstants.roleCoach, label: 'Coach', icon: Icons.sports_rounded),
    (value: AppConstants.roleNutritionist, label: 'Nutrition', icon: Icons.restaurant_rounded),
    (value: AppConstants.roleDoctor, label: 'Doctor', icon: Icons.medical_services_rounded),
  ];

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmCtrl.dispose();
    _ageCtrl.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    await ref.read(authProvider.notifier).register(
          firstName: _firstNameCtrl.text.trim(),
          lastName: _lastNameCtrl.text.trim(),
          email: _emailCtrl.text.trim(),
          password: _passwordCtrl.text,
          role: _selectedRole,
          gender: _selectedGender,
          age: int.tryParse(_ageCtrl.text) ?? 20,
        );

    if (mounted) {
      setState(() => _isLoading = false);
      final authState = ref.read(authProvider).valueOrNull;
      if (authState?.error == null) {
        // Navigate to verify email screen
        context.push('/verify-email?email=${Uri.encodeComponent(_emailCtrl.text.trim())}');
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(authState!.error!),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 32),
                // Back button
                IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new_rounded,
                      color: AppColors.textPrimary),
                  onPressed: () => context.pop(),
                  padding: EdgeInsets.zero,
                ),
                const SizedBox(height: 16),
                const AuthHeader(
                  title: 'Create account',
                  subtitle: 'Join GOSPORT and start your journey',
                ),
                const SizedBox(height: 32),

                // Role selector
                Text('I am a...', style: Theme.of(context).textTheme.titleSmall),
                const SizedBox(height: 12),
                GridView.count(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisCount: 2,
                  childAspectRatio: 1.5,
                  mainAxisSpacing: 10,
                  crossAxisSpacing: 10,
                  children: _roles.map((r) {
                    final selected = _selectedRole == r.value;
                    return GestureDetector(
                      onTap: () => setState(() => _selectedRole = r.value),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                        decoration: BoxDecoration(
                          color: selected
                              ? AppColors.primary.withValues(alpha: 0.15)
                              : AppColors.surfaceVariant,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: selected ? AppColors.primary : AppColors.cardBorder,
                            width: selected ? 1.5 : 1,
                          ),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(r.icon,
                                color: selected ? AppColors.primary : AppColors.textMuted,
                                size: 24),
                            const SizedBox(height: 4),
                            Text(r.label,
                                style: TextStyle(
                                  color: selected ? AppColors.primary : AppColors.textSecondary,
                                  fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                                  fontSize: 12,
                                )),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 24),

                // Name row
                Row(
                  children: [
                    Expanded(
                      child: AuthTextField(
                        controller: _firstNameCtrl,
                        label: 'First name',
                        hint: 'John',
                        prefixIcon: Icons.person_outline,
                        validator: (v) =>
                            (v == null || v.trim().isEmpty) ? 'Required' : null,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: AuthTextField(
                        controller: _lastNameCtrl,
                        label: 'Last name',
                        hint: 'Doe',
                        prefixIcon: Icons.person_outline,
                        validator: (v) =>
                            (v == null || v.trim().isEmpty) ? 'Required' : null,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                AuthTextField(
                  controller: _emailCtrl,
                  label: 'Email address',
                  hint: 'you@example.com',
                  keyboardType: TextInputType.emailAddress,
                  prefixIcon: Icons.email_outlined,
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Email is required';
                    if (!v.contains('@')) return 'Enter a valid email';
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Age and Gender Row
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      flex: 1,
                      child: AuthTextField(
                        controller: _ageCtrl,
                        label: 'Age',
                        hint: '25',
                        keyboardType: TextInputType.number,
                        prefixIcon: Icons.calendar_today_outlined,
                        validator: (v) {
                          if (v == null || v.isEmpty) return 'Required';
                          final age = int.tryParse(v);
                          if (age == null || age < 13) return 'Invalid';
                          return null;
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Padding(
                            padding: EdgeInsets.only(left: 4, bottom: 8),
                            child: Text('Gender', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                          ),
                          Container(
                            height: 52,
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceVariant,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppColors.cardBorder),
                            ),
                            child: Row(
                              children: [
                                _buildGenderOption('male', Icons.male),
                                _buildGenderOption('female', Icons.female),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                AuthTextField(
                  controller: _passwordCtrl,
                  label: 'Password',
                  hint: 'At least 6 characters',
                  obscureText: !_passwordVisible,
                  prefixIcon: Icons.lock_outline,
                  suffixIcon: IconButton(
                    icon: Icon(
                      _passwordVisible
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                      color: AppColors.textMuted,
                    ),
                    onPressed: () =>
                        setState(() => _passwordVisible = !_passwordVisible),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Password is required';
                    if (v.length < 6) return 'Must be at least 6 characters';
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                AuthTextField(
                  controller: _confirmCtrl,
                  label: 'Confirm password',
                  hint: '••••••••',
                  obscureText: true,
                  prefixIcon: Icons.lock_outline,
                  validator: (v) {
                    if (v != _passwordCtrl.text) return 'Passwords do not match';
                    return null;
                  },
                ),
                const SizedBox(height: 32),

                _isLoading
                    ? const Center(
                        child: CircularProgressIndicator(
                            color: AppColors.primary))
                    : ElevatedButton(
                        onPressed: _register,
                        child: const Text('Create Account'),
                      ),
                const SizedBox(height: 24),

                Center(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('Already have an account? ',
                          style: TextStyle(color: AppColors.textSecondary)),
                      GestureDetector(
                        onTap: () => context.pop(),
                        child: const Text(
                          'Sign In',
                          style: TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildGenderOption(String value, IconData icon) {
    final selected = _selectedGender == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedGender = value),
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 2),
          decoration: BoxDecoration(
            color: selected ? AppColors.background : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
            boxShadow: selected ? [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4, offset: const Offset(0, 2))] : null,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 16, color: selected ? AppColors.primary : AppColors.textMuted),
              const SizedBox(width: 4),
              Text(
                value[0].toUpperCase() + value.substring(1),
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: selected ? FontWeight.bold : FontWeight.normal,
                  color: selected ? AppColors.textPrimary : AppColors.textMuted,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

