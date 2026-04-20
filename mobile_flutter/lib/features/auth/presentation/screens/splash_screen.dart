import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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
            // Logo / Brand mark
            Container(
              width: 96,
              height: 96,
              decoration: BoxDecoration(
                gradient: const RadialGradient(
                  colors: [AppColors.primaryLight, AppColors.primary],
                ),
                borderRadius: BorderRadius.circular(28),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.4),
                    blurRadius: 32,
                    spreadRadius: 4,
                  ),
                ],
              ),
              child: const Icon(
                Icons.fitness_center_rounded,
                size: 50,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'GOSPORT',
              style: TextStyle(
                fontFamily: 'Inter',
                fontSize: 32,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
                letterSpacing: 4,
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
