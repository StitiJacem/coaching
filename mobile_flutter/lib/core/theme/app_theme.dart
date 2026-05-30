import 'package:flutter/material.dart';
import 'dart:ui';
import 'package:google_fonts/google_fonts.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Color Palette – mirrors the web Tailwind config exactly
// gosport-orange: #F97316   gosport-lime: #84CC16
// bg: slate-950 #0F172A   surface: slate-800 #1E293B   border: slate-700 #334155
// ─────────────────────────────────────────────────────────────────────────────
abstract class AppColors {
  // ── Brand ─────────────────────────────────────────────────────────────────
  static const Color primary   = Color(0xFFF97316); // gosport-orange
  static const Color secondary = Color(0xFF84CC16); // gosport-lime
  static const Color accent    = Color(0xFF00F0FF); // neon cyan (kept for highlights)

  // ── Dark Slate Palette (matches web slate-950/800/700) ─────────────────────
  static const Color background      = Color(0xFF0F172A); // slate-950
  static const Color surface         = Color(0xFF1E293B); // slate-800
  static const Color surfaceVariant  = Color(0xFF1E293B);
  static const Color card            = Color(0xFF1E293B); // slate-800
  static const Color cardBorder      = Color(0xFF334155); // slate-700
  static const Color glassBackground = Color(0x1AFFFFFF);

  // ── Typography ────────────────────────────────────────────────────────────
  static const Color textPrimary   = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFF94A3B8); // slate-400
  static const Color textMuted     = Color(0xFF64748B); // slate-500
  static const Color textAction    = Color(0xFFF97316); // orange

  // ── Status ────────────────────────────────────────────────────────────────
  static const Color success = Color(0xFF84CC16); // lime (matches web gosport-lime)
  static const Color warning = Color(0xFFFFB800);
  static const Color error   = Color(0xFFEF4444); // gosport-danger
  static const Color info    = Color(0xFF60A5FA);

  // ── Role Accents ──────────────────────────────────────────────────────────
  static const Color roleCoach        = Color(0xFFF97316); // orange
  static const Color roleAthlete      = Color(0xFF84CC16); // lime
  static const Color roleDoctor       = Color(0xFF60A5FA);
  static const Color roleNutritionist = Color(0xFF34D399);
}

// ─────────────────────────────────────────────────────────────────────────────
// Text Styles – Bebas Neue for display, Inter for body
// ─────────────────────────────────────────────────────────────────────────────
abstract class AppTextStyles {
  // Display (Bebas Neue) – matches web font-display class
  static TextStyle displayXL({Color color = AppColors.textPrimary}) =>
      GoogleFonts.bebasNeue(fontSize: 48, color: color, letterSpacing: 1.5, height: 1.0);

  static TextStyle displayLarge({Color color = AppColors.textPrimary}) =>
      GoogleFonts.bebasNeue(fontSize: 38, color: color, letterSpacing: 1.2, height: 1.0);

  static TextStyle displayMedium({Color color = AppColors.textPrimary}) =>
      GoogleFonts.bebasNeue(fontSize: 28, color: color, letterSpacing: 1.0, height: 1.0);

  static TextStyle displaySmall({Color color = AppColors.textPrimary}) =>
      GoogleFonts.bebasNeue(fontSize: 22, color: color, letterSpacing: 1.0, height: 1.1);

  // Section labels – ALL CAPS, muted, tracking-widest
  static TextStyle sectionLabel({Color color = AppColors.textMuted}) =>
      const TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        letterSpacing: 1.8,
        color: AppColors.textMuted,
      );

  // Body
  static const TextStyle bodyLarge = TextStyle(
    fontSize: 16,
    color: AppColors.textPrimary,
    height: 1.5,
  );

  static const TextStyle bodyMedium = TextStyle(
    fontSize: 14,
    color: AppColors.textSecondary,
    height: 1.4,
  );

  static const TextStyle bodySmall = TextStyle(
    fontSize: 12,
    color: AppColors.textMuted,
  );

  // Badge / tag
  static const TextStyle badge = TextStyle(
    fontSize: 9,
    fontWeight: FontWeight.w900,
    letterSpacing: 0.8,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Theme
// ─────────────────────────────────────────────────────────────────────────────
class AppTheme {
  static ThemeData get darkTheme => ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        fontFamily: GoogleFonts.inter().fontFamily,
        colorScheme: const ColorScheme.dark(
          primary:     AppColors.primary,
          secondary:   AppColors.secondary,
          surface:     AppColors.surface,
          error:       AppColors.error,
          onPrimary:   Colors.white,
          onSecondary: Colors.black,
          onSurface:   AppColors.textPrimary,
        ),
        scaffoldBackgroundColor: AppColors.background,

        cardTheme: CardThemeData(
          color: AppColors.card,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: const BorderSide(color: AppColors.cardBorder, width: 1),
          ),
        ),

        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.transparent,
          foregroundColor: AppColors.textPrimary,
          elevation: 0,
          centerTitle: false,
          surfaceTintColor: Colors.transparent,
          titleTextStyle: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.3,
            color: AppColors.textPrimary,
          ),
        ),

        bottomNavigationBarTheme: const BottomNavigationBarThemeData(
          backgroundColor: Color(0xFF1E293B),
          selectedItemColor: AppColors.primary,   // orange
          unselectedItemColor: AppColors.textMuted,
          type: BottomNavigationBarType.fixed,
          elevation: 10,
        ),

        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,   // orange
            foregroundColor: Colors.white,
            minimumSize: const Size(double.infinity, 52),
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            textStyle: const TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 14,
              letterSpacing: 0.8,
            ),
          ),
        ),

        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.textPrimary,
            side: const BorderSide(color: AppColors.cardBorder),
            minimumSize: const Size(double.infinity, 52),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            textStyle: const TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 14,
            ),
          ),
        ),

        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: AppColors.surface,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.cardBorder),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.cardBorder),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide:
                const BorderSide(color: AppColors.primary, width: 1.5),
          ),
          labelStyle: const TextStyle(
              color: AppColors.textMuted, fontWeight: FontWeight.w500),
          hintStyle:
              const TextStyle(color: AppColors.textMuted, fontSize: 14),
        ),

        textTheme: TextTheme(
          headlineLarge: GoogleFonts.bebasNeue(
              fontSize: 42, letterSpacing: 1.2, color: AppColors.textPrimary),
          headlineMedium: GoogleFonts.bebasNeue(
              fontSize: 30, letterSpacing: 1.0, color: AppColors.textPrimary),
          titleLarge: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary),
          bodyLarge: const TextStyle(
              fontSize: 16,
              color: AppColors.textPrimary,
              height: 1.5),
          bodyMedium: const TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
              height: 1.4),
          bodySmall: const TextStyle(
              fontSize: 12, color: AppColors.textMuted),
          labelSmall: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.2,
              color: AppColors.textMuted),
        ),
      );

  // ── Glassmorphism Helper ──────────────────────────────────────────────────
  static Widget glassCard({
    required Widget child,
    double blur = 10,
    double opacity = 0.06,
    BorderRadius? borderRadius,
  }) {
    final br = borderRadius ?? BorderRadius.circular(20);
    return ClipRRect(
      borderRadius: br,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: opacity),
            borderRadius: br,
            border:
                Border.all(color: Colors.white.withValues(alpha: 0.08)),
          ),
          child: child,
        ),
      ),
    );
  }

  // ── Standard card decoration ──────────────────────────────────────────────
  static BoxDecoration cardDecoration({
    Color? borderColor,
    double radius = 20,
    Color? color,
  }) =>
      BoxDecoration(
        color: color ?? AppColors.card,
        borderRadius: BorderRadius.circular(radius),
        border:
            Border.all(color: borderColor ?? AppColors.cardBorder, width: 1),
      );

  // ── Input decoration helper ───────────────────────────────────────────────
  static InputDecoration inputDecoration({
    required String label,
    IconData? icon,
    Widget? suffixIcon,
    String? hint,
  }) =>
      InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: icon != null
            ? Icon(icon, color: AppColors.textMuted, size: 20)
            : null,
        suffixIcon: suffixIcon,
      );

  // ── Skewed logo mark (matches web sidebar "G" box) ───────────────────────
  static Widget logoMark({double size = 36}) {
    return Transform(
      transform: Matrix4.skewX(-0.2),
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: AppColors.primary,
          borderRadius: BorderRadius.circular(6),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.35),
              blurRadius: 12,
              spreadRadius: 0,
            ),
          ],
        ),
        child: Center(
          child: Transform(
            transform: Matrix4.skewX(0.2),
            child: Text(
              'G',
              style: GoogleFonts.bebasNeue(
                fontSize: size * 0.65,
                color: Colors.white,
                height: 1,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
