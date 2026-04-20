import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../features/auth/data/auth_repository.dart';
import '../../../../core/errors/api_exception.dart';
import '../widgets/auth_text_field.dart';
import '../widgets/auth_header.dart';

class ResetPasswordScreen extends ConsumerStatefulWidget {
  final String token;
  const ResetPasswordScreen({super.key, required this.token});

  @override
  ConsumerState<ResetPasswordScreen> createState() =>
      _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends ConsumerState<ResetPasswordScreen> {
  final _passwordCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _isLoading = false;
  bool _visible = false;

  Future<void> _submit() async {
    if (_passwordCtrl.text.isEmpty) return;
    if (_passwordCtrl.text != _confirmCtrl.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Passwords do not match'),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating),
      );
      return;
    }
    setState(() => _isLoading = true);
    try {
      final repo = ref.read(authRepositoryProvider);
      await repo.resetPassword(
          token: widget.token, newPassword: _passwordCtrl.text);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Password reset! Please sign in.'),
            backgroundColor: AppColors.success,
            behavior: SnackBarBehavior.floating,
          ),
        );
        context.go('/login');
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(e.message),
              backgroundColor: AppColors.error,
              behavior: SnackBarBehavior.floating),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 32),
              const AuthHeader(
                title: 'New password',
                subtitle: 'Choose a strong password for your account',
              ),
              const SizedBox(height: 40),
              AuthTextField(
                controller: _passwordCtrl,
                label: 'New password',
                hint: 'At least 8 characters',
                obscureText: !_visible,
                prefixIcon: Icons.lock_outline,
                suffixIcon: IconButton(
                  icon: Icon(
                    _visible
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                    color: AppColors.textMuted,
                  ),
                  onPressed: () => setState(() => _visible = !_visible),
                ),
              ),
              const SizedBox(height: 16),
              AuthTextField(
                controller: _confirmCtrl,
                label: 'Confirm password',
                hint: '••••••••',
                obscureText: true,
                prefixIcon: Icons.lock_outline,
              ),
              const SizedBox(height: 32),
              _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(
                          color: AppColors.primary))
                  : ElevatedButton(
                      onPressed: _submit,
                      child: const Text('Set New Password'),
                    ),
            ],
          ),
        ),
      ),
    );
  }
}
