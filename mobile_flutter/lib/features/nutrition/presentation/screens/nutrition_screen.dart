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
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              floating: true,
              backgroundColor: AppColors.background,
              title: const Text('Nutrition',
                  style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 22,
                      fontWeight: FontWeight.w800)),
              actions: [
                IconButton(
                  icon: const Icon(Icons.history_rounded, color: AppColors.textPrimary),
                  onPressed: () {},
                ),
              ],
            ),
            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // AI Scanner CTA
                  _ScanMealCard(),
                  const SizedBox(height: 24),

                  // Section Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Recent Meals',
                          style: TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 18,
                              fontWeight: FontWeight.w700)),
                      TextButton(
                        onPressed: () {},
                        child: const Text('View All',
                            style: TextStyle(color: AppColors.primary)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  if (_loading)
                    const Center(child: CircularProgressIndicator(color: AppColors.primary))
                  else if (_recentLogs.isEmpty)
                    _EmptyLogsPlaceholder()
                  else
                    ..._recentLogs.map((log) => _MealLogTile(log: log)),
                ]),
              ),
            ),
          ],
        ),
      ),
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
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppColors.primary, Color(0xFFBF4D10)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.3),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text(
                        'AI POWERED',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1),
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Scan Your Meal',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                          height: 1.1),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Take a photo to track calories and macros instantly.',
                      style: TextStyle(
                          color: Colors.white70,
                          fontSize: 14,
                          fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(Icons.camera_alt_rounded,
                    color: AppColors.primary, size: 32),
              ),
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
    final calories = log['calories'] ?? 0;
    final protein = log['protein'] ?? 0;
    final carbs = log['carbs'] ?? 0;
    final fat = log['fat'] ?? 0;
    final date = DateTime.parse(log['date'] ?? DateTime.now().toIso8601String());

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Row(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: AppColors.surfaceVariant,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.restaurant_rounded, color: AppColors.primary),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(foodName,
                    style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w700,
                        fontSize: 16)),
                const SizedBox(height: 4),
                Text(
                  '${calories}kcal • P:${protein}g C:${carbs}g F:${fat}g',
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
                ),
              ],
            ),
          ),
          Text(
            '${date.hour}:${date.minute.toString().padLeft(2, '0')}',
            style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
          ),
        ],
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
          const SizedBox(height: 40),
          Icon(Icons.restaurant_menu_rounded,
              size: 64, color: AppColors.textMuted.withValues(alpha: 0.3)),
          const SizedBox(height: 16),
          const Text('No meals logged yet',
              style: TextStyle(color: AppColors.textMuted, fontSize: 16)),
          const SizedBox(height: 8),
          const Text('Start by scanning your first meal!',
              style: TextStyle(color: AppColors.textMuted, fontSize: 14)),
        ],
      ),
    );
  }
}
