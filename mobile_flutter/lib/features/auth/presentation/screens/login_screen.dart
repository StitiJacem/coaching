import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/providers/auth_provider.dart';
import '../widgets/auth_text_field.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _passwordVisible = false;
  bool _isLoading = false;
  bool _isGoogleLoading = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
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
          context.push(
              '/verify-email?email=${Uri.encodeComponent(_emailCtrl.text.trim())}');
          return;
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(error),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    });

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          // ── Web-matching background glows ─────────────────────────────────
          Positioned(
            top: -80,
            left: -80,
            child: Container(
              width: MediaQuery.of(context).size.width * 0.7,
              height: MediaQuery.of(context).size.width * 0.7,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.primary.withValues(alpha: 0.08),
              ),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 80, sigmaY: 80),
                child: const SizedBox(),
              ),
            ),
          ),
          Positioned(
            bottom: -80,
            right: -80,
            child: Container(
              width: MediaQuery.of(context).size.width * 0.7,
              height: MediaQuery.of(context).size.width * 0.7,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.secondary.withValues(alpha: 0.07),
              ),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 80, sigmaY: 80),
                child: const SizedBox(),
              ),
            ),
          ),
          // Dot grid overlay (matches web)
          Positioned.fill(
            child: Opacity(
              opacity: 0.03,
              child: CustomPaint(painter: _DotGridPainter()),
            ),
          ),

          // ── Content ───────────────────────────────────────────────────────
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 32),

                      // Logo mark (skewed G box – matches web sidebar)
                      AppTheme.logoMark(size: 52),
                      const SizedBox(height: 24),

                      // Title
                      Text(
                        'WELCOME BACK',
                        style: GoogleFonts.bebasNeue(
                          fontSize: 36,
                          color: AppColors.textPrimary,
                          letterSpacing: 2,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Sign in to access your workspace',
                        style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 40),

                      // ── Form card ─────────────────────────────────────────
                      Container(
                        padding: const EdgeInsets.all(28),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppColors.cardBorder),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Email
                            _FieldLabel('Email Address'),
                            const SizedBox(height: 8),
                            AuthTextField(
                              controller: _emailCtrl,
                              label: '',
                              hint: 'Email',
                              keyboardType: TextInputType.emailAddress,
                              prefixIcon: Icons.alternate_email_rounded,
                              validator: (v) {
                                if (v == null || v.trim().isEmpty) {
                                  return 'Required';
                                }
                                if (!v.contains('@')) return 'Invalid email';
                                return null;
                              },
                            ),
                            const SizedBox(height: 20),

                            // Password
                            _FieldLabel('Password'),
                            const SizedBox(height: 8),
                            AuthTextField(
                              controller: _passwordCtrl,
                              label: '',
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
                                onPressed: () => setState(
                                    () => _passwordVisible = !_passwordVisible),
                              ),
                              validator: (v) {
                                if (v == null || v.isEmpty) return 'Required';
                                return null;
                              },
                            ),
                            Align(
                              alignment: Alignment.centerRight,
                              child: TextButton(
                                onPressed: () =>
                                    context.push('/forgot-password'),
                                child: const Text(
                                  'Forgot Password?',
                                  style: TextStyle(
                                    color: AppColors.primary,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 8),

                            // Sign In button
                            SizedBox(
                              width: double.infinity,
                              height: 52,
                              child: _isLoading
                                  ? const Center(
                                      child: CircularProgressIndicator(
                                          color: AppColors.primary),
                                    )
                                  : ElevatedButton(
                                      onPressed: _login,
                                      child: Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        children: const [
                                          Text(
                                            'SIGN IN',
                                            style: TextStyle(
                                                fontWeight: FontWeight.w800,
                                                letterSpacing: 1.2,
                                                fontSize: 15),
                                          ),
                                          SizedBox(width: 8),
                                          Icon(Icons.arrow_forward_rounded,
                                              size: 18),
                                        ],
                                      ),
                                    ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 28),

                      // OR divider
                      Row(
                        children: [
                          const Expanded(
                              child: Divider(color: AppColors.cardBorder)),
                          Padding(
                            padding:
                                const EdgeInsets.symmetric(horizontal: 16),
                            child: Text(
                              'OR CONTINUE WITH',
                              style: TextStyle(
                                color: AppColors.textMuted,
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 1.2,
                              ),
                            ),
                          ),
                          const Expanded(
                              child: Divider(color: AppColors.cardBorder)),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // Google button
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: OutlinedButton(
                          onPressed: _isGoogleLoading ? null : _loginWithGoogle,
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 0),
                            side: const BorderSide(
                                color: AppColors.cardBorder, width: 1),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
                          ),
                          child: _isGoogleLoading
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: AppColors.primary),
                                )
                              : Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    // Google G logo
                                    _GoogleLogo(),
                                    const SizedBox(width: 12),
                                    const Text(
                                      'Continue with Google',
                                      style: TextStyle(
                                        color: AppColors.textSecondary,
                                        fontWeight: FontWeight.w700,
                                        fontSize: 14,
                                      ),
                                    ),
                                  ],
                                ),
                        ),
                      ),

                      const SizedBox(height: 36),

                      // Sign up link
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text(
                            "Don't have an account?",
                            style: TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 14,
                            ),
                          ),
                          TextButton(
                            onPressed: () => context.push('/signup'),
                            child: const Text(
                              'Sign Up',
                              style: TextStyle(
                                color: AppColors.textPrimary,
                                fontWeight: FontWeight.w800,
                                fontSize: 14,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 32),
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

// ── Small helpers ─────────────────────────────────────────────────────────────
class _FieldLabel extends StatelessWidget {
  final String text;
  const _FieldLabel(this.text);

  @override
  Widget build(BuildContext context) => Text(
        text.toUpperCase(),
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: AppColors.textSecondary,
          letterSpacing: 1.2,
        ),
      );
}

class _GoogleLogo extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 20,
      height: 20,
      child: CustomPaint(painter: _GoogleLogoPainter()),
    );
  }
}

class _GoogleLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    void drawArc(Color color, double start, double sweep) {
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        start,
        sweep,
        true,
        Paint()..color = color,
      );
    }

    drawArc(const Color(0xFF4285F4), -1.57, 1.57);
    drawArc(const Color(0xFF34A853), 0.0, 1.57);
    drawArc(const Color(0xFFFBBC05), 1.57, 1.57);
    drawArc(const Color(0xFFEA4335), 3.14, 1.57);

    // White center
    canvas.drawCircle(center, radius * 0.6, Paint()..color = const Color(0xFF0F172A));
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _DotGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white
      ..strokeWidth = 1;
    const spacing = 24.0;
    for (double x = 0; x < size.width; x += spacing) {
      for (double y = 0; y < size.height; y += spacing) {
        canvas.drawCircle(Offset(x, y), 0.8, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
