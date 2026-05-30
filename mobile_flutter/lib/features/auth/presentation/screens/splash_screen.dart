import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';

/// Splash screen — mirrors MainActivity's 2s delay + session check
class SplashScreen extends ConsumerWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Once auth state resolves, go_router redirect will take over
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Logo / Brand mark (matches web)
            AppTheme.logoMark(size: 80),
            const SizedBox(height: 24),
            Text(
              'GOSPORT',
              style: GoogleFonts.bebasNeue(
                fontSize: 48,
                color: AppColors.textPrimary,
                letterSpacing: 4,
                height: 1.0,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Elite Coaching Platform',
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 14,
                letterSpacing: 1.2,
              ),
            ),
            const SizedBox(height: 64),
            SizedBox(
              width: 32,
              height: 32,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: AppColors.primary.withValues(alpha: 0.7),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
