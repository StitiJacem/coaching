import 'package:flutter/material.dart';
import 'dart:ui';

abstract class AppColors {
  // ── Premium Brand ─────────────────────────────────────────────────────────
  static const Color primary = Color(0xFFCCFF00);       // Cyber Lime
  static const Color secondary = Color(0xFF6600FF);     // Electric Indigo
  static const Color accent = Color(0xFF00F0FF);        // Neon Cyan
  
  // ── Deep Obsidian Palette ─────────────────────────────────────────────────
  static const Color background = Color(0xFF050505);    // Absolute Depth
  static const Color surface = Color(0xFF111111);       // Dark Obsidian
  static const Color surfaceVariant = Color(0xFF1A1A1A);
  static const Color card = Color(0xFF161616);
  static const Color cardBorder = Color(0xFF252525);
  static const Color glassBackground = Color(0x1AFFFFFF); // Translucent for blur
  
  // ── Typography ────────────────────────────────────────────────────────────
  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFFB0B0B0);
  static const Color textMuted = Color(0xFF606060);
  static const Color textAction = Color(0xFFCCFF00);

  // ── Status ────────────────────────────────────────────────────────────────
  static const Color success = Color(0xFF00FF94);
  static const Color warning = Color(0xFFFFB800);
  static const Color error = Color(0xFFFF3B3B);
  static const Color info = Color(0xFF00A3FF);

  // ── Role Accents ─────────────────────────────────────────────────────────
  static const Color roleCoach = Color(0xFFCCFF00);      
  static const Color roleAthlete = Color(0xFF00F0FF);    
  static const Color roleDoctor = Color(0xFF60A5FA);     
  static const Color roleNutritionist = Color(0xFF34D399); 
}

class AppTheme {
  static ThemeData get darkTheme => ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        fontFamily: 'Inter',
        colorScheme: const ColorScheme.dark(
          primary: AppColors.primary,
          secondary: AppColors.secondary,
          surface: AppColors.surface,
          error: AppColors.error,
          onPrimary: Colors.black,
          onSecondary: Colors.white,
          onSurface: AppColors.textPrimary,
        ),
        scaffoldBackgroundColor: AppColors.background,
        cardTheme: CardThemeData(
          color: AppColors.card,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
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
            fontFamily: 'Inter',
            fontSize: 22,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.5,
            color: AppColors.textPrimary,
          ),
        ),
        bottomNavigationBarTheme: const BottomNavigationBarThemeData(
          backgroundColor: Color(0xFF0A0A0A),
          selectedItemColor: AppColors.primary,
          unselectedItemColor: AppColors.textMuted,
          type: BottomNavigationBarType.fixed,
          elevation: 10,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.black,
            minimumSize: const Size(double.infinity, 56),
            elevation: 8,
            shadowColor: AppColors.primary.withValues(alpha: 0.3),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            textStyle: const TextStyle(
              fontFamily: 'Inter',
              fontWeight: FontWeight.w800,
              fontSize: 16,
              letterSpacing: 0.5,
            ),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: AppColors.surfaceVariant,
          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide.none,
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: const BorderSide(color: AppColors.cardBorder),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
          ),
          labelStyle: const TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w500),
          hintStyle: const TextStyle(color: AppColors.textMuted),
        ),
        textTheme: const TextTheme(
          headlineLarge: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, letterSpacing: -1.0),
          headlineMedium: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, letterSpacing: -0.5),
          titleLarge: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
          bodyLarge: TextStyle(fontSize: 16, color: AppColors.textPrimary, height: 1.5),
          bodyMedium: TextStyle(fontSize: 14, color: AppColors.textSecondary),
        ),
      );

  // ── Glassmorphism Helper ──────────────────────────────────────────────────
  static Widget glassCard({required Widget child, double blur = 10, double opacity = 0.1}) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: opacity),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
          ),
          child: child,
        ),
      ),
    );
  }
}

