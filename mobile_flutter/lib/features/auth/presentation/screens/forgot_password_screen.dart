import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../features/auth/data/auth_repository.dart';
import '../../../../core/errors/api_exception.dart';
import '../widgets/auth_text_field.dart';
import '../widgets/auth_header.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _emailCtrl = TextEditingController();
  bool _isLoading = false;
  bool _sent = false;

  Future<void> _submit() async {
    if (_emailCtrl.text.trim().isEmpty) return;
    setState(() => _isLoading = true);
    try {
      final repo = ref.read(authRepositoryProvider);
      await repo.forgotPassword(_emailCtrl.text.trim());
      if (mounted) setState(() => _sent = true);
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
              IconButton(
                icon: const Icon(Icons.arrow_back_ios_new_rounded,
                    color: AppColors.textPrimary),
                onPressed: () => context.pop(),
                padding: EdgeInsets.zero,
              ),
              const SizedBox(height: 24),
              if (!_sent) ...[
                const AuthHeader(
                  title: 'Reset password',
                  subtitle:
                      "Enter your email and we'll send you a reset link",
                ),
                const SizedBox(height: 40),
                AuthTextField(
                  controller: _emailCtrl,
                  label: 'Email address',
                  hint: 'you@example.com',
                  keyboardType: TextInputType.emailAddress,
                  prefixIcon: Icons.email_outlined,
                ),
                const SizedBox(height: 32),
                _isLoading
                    ? const Center(
                        child: CircularProgressIndicator(
                            color: AppColors.primary))
                    : ElevatedButton(
                        onPressed: _submit,
                        child: const Text('Send Reset Link'),
                      ),
              ] else ...[
                // Success state
                const SizedBox(height: 80),
                Center(
                  child: Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AppColors.success.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.mark_email_read_outlined,
                        color: AppColors.success, size: 40),
                  ),
                ),
                const SizedBox(height: 32),
                const AuthHeader(
                  title: 'Check your inbox',
                  subtitle:
                      'We sent a password reset link. Follow the instructions in the email.',
                ),
                const SizedBox(height: 40),
                ElevatedButton(
                  onPressed: () => context.go('/login'),
                  child: const Text('Back to Sign In'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
