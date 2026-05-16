import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/animate_in.dart';
import '../../data/nutrition_repository.dart';

class NutritionScreen extends ConsumerStatefulWidget {
  const NutritionScreen({super.key});

  @override
  ConsumerState<NutritionScreen> createState() => _NutritionScreenState();
}

class _NutritionScreenState extends ConsumerState<NutritionScreen> {
  bool _loading = false;
  List<dynamic> _recentLogs = [];

  @override
  void initState() {
    super.initState();
    _loadLogs();
  }

  Future<void> _loadLogs() async {
    setState(() => _loading = true);
    try {
      final logs = await ref.read(nutritionRepositoryProvider).getMealLogs();
      setState(() => _recentLogs = logs);
    } catch (e) {
      debugPrint('Error loading logs: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    int totalCals = 0;
    int totalP = 0;
    int totalC = 0;
    int totalF = 0;
    
    for (var log in _recentLogs) {
      totalCals += (log['calories'] as num? ?? 0).toInt();
      totalP += (log['protein'] as num? ?? 0).toInt();
      totalC += (log['carbs'] as num? ?? 0).toInt();
      totalF += (log['fat'] as num? ?? 0).toInt();
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverAppBar(
              floating: true,
              backgroundColor: Colors.transparent,
              elevation: 0,
              centerTitle: false,
              title: const Text('NUTRITION', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
              actions: [
                IconButton(icon: const Icon(Icons.history_rounded, color: Colors.white), onPressed: () {}),
              ],
            ),
            SliverPadding(
              padding: const EdgeInsets.all(20),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  _buildDailySummary(totalCals, totalP, totalC, totalF),
                  const SizedBox(height: 32),
                  _ScanMealCard(),
                  const SizedBox(height: 40),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('LOG HISTORY', style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1.5)),
                      TextButton(onPressed: () {}, child: const Text('VIEW ALL', style: TextStyle(color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.w900))),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (_loading)
                    const Center(child: Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator(color: AppColors.primary)))
                  else if (_recentLogs.isEmpty)
                    _EmptyLogsPlaceholder()
                  else
                    ...List.generate(_recentLogs.length, (i) => AnimateIn(delay: i * 50, child: _MealLogTile(log: _recentLogs[i]))),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDailySummary(int cals, int p, int c, int f) {
    return AppTheme.glassCard(
      opacity: 0.1,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('DAILY TOTAL', style: TextStyle(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
                    Text('$cals kcal', style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900, letterSpacing: -1)),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(12)),
                  child: const Text('ON TRACK', style: TextStyle(color: AppColors.primary, fontSize: 10, fontWeight: FontWeight.w900)),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _MacroIndicator(label: 'PROTEIN', value: '${p}g', color: AppColors.primary, progress: p / 180),
                _MacroIndicator(label: 'CARBS', value: '${c}g', color: AppColors.accent, progress: c / 250),
                _MacroIndicator(label: 'FATS', value: '${f}g', color: Colors.purpleAccent, progress: f / 70),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _MacroIndicator extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final double progress;

  const _MacroIndicator({required this.label, required this.value, required this.color, required this.progress});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          width: 60, height: 60,
          child: Stack(
            alignment: Alignment.center,
            children: [
              CircularProgressIndicator(value: 1.0, strokeWidth: 4, color: color.withValues(alpha: 0.1)),
              CircularProgressIndicator(value: progress.clamp(0, 1), strokeWidth: 4, color: color, strokeCap: StrokeCap.round),
              Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900)),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 9, fontWeight: FontWeight.w900)),
      ],
    );
  }
}

class _ScanMealCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return AnimateIn(
      child: GestureDetector(
        onTap: () => context.push('/nutrition/scan'),
        child: Container(
          padding: const EdgeInsets.all(28),
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [AppColors.primary, Color(0xFFE8621A)], begin: Alignment.topLeft, end: Alignment.bottomRight),
            borderRadius: BorderRadius.circular(28),
            boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.3), blurRadius: 30, offset: const Offset(0, 12))],
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(20)), child: const Text('NEURAL SCAN', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1.5))),
                    const SizedBox(height: 16),
                    const Text('SCAN MEAL', style: TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
                    const SizedBox(height: 6),
                    const Text('INSTANT MACRO DETECTION', style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
              Container(width: 64, height: 64, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)), child: const Icon(Icons.camera_alt_rounded, color: Colors.black, size: 32)),
            ],
          ),
        ),
      ),
    );
  }
}

class _MealLogTile extends StatelessWidget {
  final Map<String, dynamic> log;
  const _MealLogTile({required this.log});

  @override
  Widget build(BuildContext context) {
    final foodName = log['foodName'] ?? 'Unknown Meal';
    final calories = (log['calories'] as num? ?? 0).toInt();
    final protein = (log['protein'] as num? ?? 0).toInt();
    final carbs = (log['carbs'] as num? ?? 0).toInt();
    final fat = (log['fat'] as num? ?? 0).toInt();
    final date = DateTime.parse(log['date'] ?? DateTime.now().toIso8601String());

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: AppTheme.glassCard(
        opacity: 0.05,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(width: 52, height: 52, decoration: BoxDecoration(color: AppColors.surfaceVariant, borderRadius: BorderRadius.circular(16)), child: const Icon(Icons.restaurant_rounded, color: AppColors.primary, size: 24)),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(foodName.toUpperCase(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 14, letterSpacing: -0.2)),
                    const SizedBox(height: 4),
                    Text('${calories}KCAL • P:${protein}G C:${carbs}G F:${fat}G', style: const TextStyle(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w900)),
                  ],
                ),
              ),
              Text('${date.hour}:${date.minute.toString().padLeft(2, '0')}', style: const TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.bold, fontFamily: 'Inter')),
            ],
          ),
        ),
      ),
    );
  }
}

class _EmptyLogsPlaceholder extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        children: [
          const SizedBox(height: 60),
          Icon(Icons.restaurant_menu_rounded, size: 64, color: AppColors.surfaceVariant),
          const SizedBox(height: 24),
          const Text('NO MEALS RECORDED', style: TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 2)),
        ],
      ),
    );
  }
}
