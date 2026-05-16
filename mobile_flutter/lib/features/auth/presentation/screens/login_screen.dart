import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'dart:math' as math;
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/providers/auth_provider.dart';
import '../widgets/auth_text_field.dart';
import '../widgets/auth_header.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _passwordVisible = false;
  bool _isLoading = false;
  bool _isGoogleLoading = false;

  late AnimationController _bgController;

  @override
  void initState() {
    super.initState();
    _bgController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 10),
    )..repeat();
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _bgController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    ref.read(authProvider.notifier).clearError();

    await ref.read(authProvider.notifier).login(
          _emailCtrl.text.trim(),
          _passwordCtrl.text,
        );

    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _loginWithGoogle() async {
    setState(() => _isGoogleLoading = true);
    ref.read(authProvider.notifier).clearError();
    await ref.read(authProvider.notifier).loginWithGoogle();
    if (mounted) setState(() => _isGoogleLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<AsyncValue<AuthState>>(authProvider, (_, next) {
      final error = next.valueOrNull?.error;
      if (error != null && mounted) {
        if (error.toLowerCase().contains('verify your email')) {
          context.push('/verify-email?email=${Uri.encodeComponent(_emailCtrl.text.trim())}');
          return;
        }

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(error),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    });

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          // ── Animated Background ──────────────────────────────────────────
          AnimatedBuilder(
            animation: _bgController,
            builder: (context, child) {
              return CustomPaint(
                painter: _LoginBackgroundPainter(_bgController.value),
                size: Size.infinite,
              );
            },
          ),

          // ── Content ──────────────────────────────────────────────────────
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 20),
                      Center(
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primary.withValues(alpha: 0.5),
                                blurRadius: 20,
                                spreadRadius: 2,
                              )
                            ],
                          ),
                          child: const Icon(Icons.bolt_rounded, color: Colors.black, size: 40),
                        ),
                      ),
                      const SizedBox(height: 32),
                      const Center(
                        child: AuthHeader(
                          title: 'GOSPORT',
                          subtitle: 'ENTER THE ARENA',
                        ),
                      ),
                      const SizedBox(height: 48),

                      // Glass Form Card
                      AppTheme.glassCard(
                        opacity: 0.05,
                        child: Padding(
                          padding: const EdgeInsets.all(24.0),
                          child: Column(
                            children: [
                              AuthTextField(
                                controller: _emailCtrl,
                                label: 'Email Address',
                                hint: 'athlete@gosport.com',
                                keyboardType: TextInputType.emailAddress,
                                prefixIcon: Icons.alternate_email_rounded,
                                validator: (v) {
                                  if (v == null || v.trim().isEmpty) return 'Required';
                                  if (!v.contains('@')) return 'Invalid email';
                                  return null;
                                },
                              ),
                              const SizedBox(height: 20),
                              AuthTextField(
                                controller: _passwordCtrl,
                                label: 'Password',
                                hint: '••••••••',
                                obscureText: !_passwordVisible,
                                prefixIcon: Icons.lock_outline_rounded,
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _passwordVisible
                                        ? Icons.visibility_off_rounded
                                        : Icons.visibility_rounded,
                                    color: AppColors.textMuted,
                                    size: 20,
                                  ),
                                  onPressed: () =>
                                      setState(() => _passwordVisible = !_passwordVisible),
                                ),
                                validator: (v) {
                                  if (v == null || v.isEmpty) return 'Required';
                                  return null;
                                },
                              ),
                              const SizedBox(height: 12),
                              Align(
                                alignment: Alignment.centerRight,
                                child: TextButton(
                                  onPressed: () => context.push('/forgot-password'),
                                  child: const Text(
                                    'Forgot password?',
                                    style: TextStyle(
                                        color: AppColors.primary,
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 24),
                              _isLoading
                                  ? const CircularProgressIndicator(color: AppColors.primary)
                                  : ElevatedButton(
                                      onPressed: _login,
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: AppColors.primary,
                                        minimumSize: const Size(double.infinity, 60),
                                      ),
                                      child: const Text('IGNITE SESSION'),
                                    ),
                            ],
                          ),
                        ),
                      ),
                      
                      const SizedBox(height: 32),
                      
                      // Secondary Actions
                      Row(
                        children: [
                          const Expanded(child: Divider(color: AppColors.cardBorder)),
                          const Padding(
                            padding: EdgeInsets.symmetric(horizontal: 16),
                            child: Text('OR', style: TextStyle(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w800)),
                          ),
                          const Expanded(child: Divider(color: AppColors.cardBorder)),
                        ],
                      ),
                      const SizedBox(height: 32),
                      
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton(
                          onPressed: _isGoogleLoading ? null : _loginWithGoogle,
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            side: const BorderSide(color: AppColors.cardBorder),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          child: _isGoogleLoading
                              ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary))
                              : Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Image.network(
                                      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_\"G\"_Logo.svg/1200px-Google_\"G\"_Logo.svg.png',
                                      height: 22,
                                    ),
                                    const SizedBox(width: 12),
                                    const Text('Continue with Google', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700)),
                                  ],
                                ),
                        ),
                      ),
                      
                      const SizedBox(height: 40),
                      
                      Center(
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Text("NEW TO THE ARENA? ", style: TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600)),
                            GestureDetector(
                              onTap: () => context.push('/signup'),
                              child: const Text(
                                'JOIN NOW',
                                style: TextStyle(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 12,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 48),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LoginBackgroundPainter extends CustomPainter {
  final double animationValue;
  _LoginBackgroundPainter(this.animationValue);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..shader = RadialGradient(
        colors: [
          AppColors.secondary.withValues(alpha: 0.15),
          AppColors.background,
        ],
        center: Alignment(
          math.sin(animationValue * 2 * math.pi) * 0.5,
          math.cos(animationValue * 2 * math.pi) * 0.5,
        ),
        radius: 1.5,
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));

    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), paint);

    // Subtle floating particles
    final particlePaint = Paint()..color = AppColors.primary.withValues(alpha: 0.05);
    for (int i = 0; i < 5; i++) {
      final x = (math.sin(animationValue * 2 * math.pi + i) * 0.5 + 0.5) * size.width;
      final y = (math.cos(animationValue * 2 * math.pi * 0.5 + i) * 0.5 + 0.5) * size.height;
      canvas.drawCircle(Offset(x, y), 50 + i * 20, particlePaint);
    }
  }

  @override
  bool shouldRepaint(covariant _LoginBackgroundPainter oldDelegate) => true;
}

