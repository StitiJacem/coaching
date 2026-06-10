import 'package:flutter/material.dart';
import 'dart:math' as math;
import '../../../../core/theme/app_theme.dart';

/// Donut-style macro ring showing proteins / carbs / fats distribution.
class MacroRing extends StatelessWidget {
  final double proteins;
  final double carbs;
  final double fats;
  final double calories;
  final double size;

  const MacroRing({
    super.key,
    required this.proteins,
    required this.carbs,
    required this.fats,
    required this.calories,
    this.size = 120,
  });

  @override
  Widget build(BuildContext context) {
    final total = proteins + carbs + fats;
    final proteinPct = total > 0 ? proteins / total : 0.33;
    final carbsPct = total > 0 ? carbs / total : 0.33;
    final fatsPct = total > 0 ? fats / total : 0.34;

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CustomPaint(
            size: Size(size, size),
            painter: _MacroRingPainter(
              proteinPct: proteinPct.toDouble(),
              carbsPct: carbsPct.toDouble(),
              fatsPct: fatsPct.toDouble(),
            ),
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                calories.toInt().toString(),
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  height: 1.0,
                ),
              ),
              const Text(
                'kcal',
                style: TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 9,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MacroRingPainter extends CustomPainter {
  final double proteinPct;
  final double carbsPct;
  final double fatsPct;

  _MacroRingPainter({
    required this.proteinPct,
    required this.carbsPct,
    required this.fatsPct,
  });

  @override
  void paint(Canvas canvas, Size size) {
    const strokeWidth = 10.0;
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width / 2) - strokeWidth / 2;

    final proteinPaint = Paint()
      ..color = AppColors.roleNutritionist
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    final carbsPaint = Paint()
      ..color = AppColors.primary
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    final fatsPaint = Paint()
      ..color = AppColors.info
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    final bgPaint = Paint()
      ..color = AppColors.cardBorder.withValues(alpha: 0.5)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;

    canvas.drawCircle(center, radius, bgPaint);

    const gapAngle = 0.08;
    final startAngle = -math.pi / 2;

    double currentAngle = startAngle;

    void drawArc(Paint paint, double pct) {
      if (pct <= 0) return;
      final sweep = (2 * math.pi * pct) - gapAngle;
      if (sweep > 0) {
        canvas.drawArc(
          Rect.fromCircle(center: center, radius: radius),
          currentAngle,
          sweep,
          false,
          paint,
        );
      }
      currentAngle += sweep + gapAngle;
    }

    drawArc(proteinPaint, proteinPct);
    drawArc(carbsPaint, carbsPct);
    drawArc(fatsPaint, fatsPct);
  }

  @override
  bool shouldRepaint(_MacroRingPainter old) =>
      old.proteinPct != proteinPct ||
      old.carbsPct != carbsPct ||
      old.fatsPct != fatsPct;
}

/// Horizontal macro bar legend (P / C / F percentages).
class MacroLegend extends StatelessWidget {
  final double proteins;
  final double carbs;
  final double fats;

  const MacroLegend({
    super.key,
    required this.proteins,
    required this.carbs,
    required this.fats,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _LegendDot(
            color: AppColors.roleNutritionist,
            label: 'P',
            value: '${proteins.toInt()}g'),
        const SizedBox(width: 16),
        _LegendDot(
            color: AppColors.primary,
            label: 'G',
            value: '${carbs.toInt()}g'),
        const SizedBox(width: 16),
        _LegendDot(
            color: AppColors.info, label: 'L', value: '${fats.toInt()}g'),
      ],
    );
  }
}

class _LegendDot extends StatelessWidget {
  final Color color;
  final String label;
  final String value;

  const _LegendDot(
      {required this.color, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 5),
        Text(
          '$label: $value',
          style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 11,
              fontWeight: FontWeight.w600),
        ),
      ],
    );
  }
}
