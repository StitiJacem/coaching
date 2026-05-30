import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/animate_in.dart';
import '../../data/nutrition_repository.dart';
import '../../../../shared/providers/auth_provider.dart';

class NutritionScreen extends ConsumerStatefulWidget {
  const NutritionScreen({super.key});

  @override
  ConsumerState<NutritionScreen> createState() => _NutritionScreenState();
}

class _NutritionScreenState extends ConsumerState<NutritionScreen> {
  bool _loading = false;
  Map<String, dynamic>? _summary;
  Map<String, dynamic>? _activePlan;
  List<dynamic> _recentLogs = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final user = ref.read(currentUserProvider);
      if (user?.athleteId == null) {
        debugPrint('No athleteId found');
        return;
      }
      final athleteId = user!.athleteId!;
      final repo = ref.read(nutritionRepositoryProvider);
      
      final results = await Future.wait([
        repo.getNutritionSummary(athleteId).catchError((_) => null),
        repo.getActivePlan(athleteId).catchError((_) => null),
        repo.getMealLogs(athleteId, date: DateTime.now().toIso8601String().split('T')[0]).catchError((_) => []),
      ]);
      
      setState(() {
        _summary = results[0] as Map<String, dynamic>?;
        _activePlan = results[1] as Map<String, dynamic>?;
        _recentLogs = results[2] as List<dynamic>? ?? [];
      });
    } catch (e) {
      debugPrint('Error loading nutrition data: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // If no summary use 0 targets
    final target = _summary?['target'] ?? {};
    final actual = _summary?['actual'] ?? {};
    final tCals = (target['calories'] ?? 2000).toInt();
    final aCals = (actual['calories'] ?? 0).toInt();
    
    final tP = (target['protein'] ?? 150).toInt();
    final aP = (actual['protein'] ?? 0).toInt();
    
    final tC = (target['carbs'] ?? 250).toInt();
    final aC = (actual['carbs'] ?? 0).toInt();
    
    final tF = (target['fats'] ?? 70).toInt();
    final aF = (actual['fats'] ?? 0).toInt();

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadData,
          color: AppColors.primary,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
            slivers: [
              SliverAppBar(
                floating: true,
                backgroundColor: Colors.transparent,
                elevation: 0,
                centerTitle: false,
                title: Text('NUTRITION', style: GoogleFonts.bebasNeue(color: Colors.white, fontSize: 36, letterSpacing: 2, height: 1.0)),
                actions: [
                  IconButton(icon: const Icon(Icons.history_rounded, color: Colors.white), onPressed: () {}),
                ],
              ),
              SliverPadding(
                padding: const EdgeInsets.all(20),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    if (_activePlan != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: Row(
                          children: [
                            const Icon(Icons.verified, color: AppColors.primary, size: 16),
                            const SizedBox(width: 8),
                            Text('Active Protocol: ${_activePlan!['name']}', style: const TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                          ],
                        ),
                      ),
                    _buildDailySummary(tCals, aCals, tP, aP, tC, aC, tF, aF),
                    const SizedBox(height: 32),
                    _ScanMealCard(),
                    const SizedBox(height: 40),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('TODAY\'S LOGS', style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1.5)),
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
      ),
    );
  }

  Widget _buildDailySummary(int tC, int aC, int tP, int aP, int tCarb, int aCarb, int tF, int aF) {
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
                    const Text('ENERGY INTAKE', style: TextStyle(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Text('$aC', style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w900, letterSpacing: -1)),
                        Text(' / $tC kcal', style: const TextStyle(color: AppColors.textMuted, fontSize: 14, fontWeight: FontWeight.w900)),
                      ],
                    )
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(12)),
                  child: Text('${((aC/tC.clamp(1, 10000))*100).toStringAsFixed(0)}%', style: const TextStyle(color: AppColors.primary, fontSize: 10, fontWeight: FontWeight.w900)),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _MacroIndicator(label: 'PROTEIN', value: '${aP}g', targetValue: '${tP}g', color: AppColors.primary, progress: aP / tP.clamp(1, 1000)),
                _MacroIndicator(label: 'CARBS', value: '${aCarb}g', targetValue: '${tCarb}g', color: AppColors.accent, progress: aCarb / tCarb.clamp(1, 1000)),
                _MacroIndicator(label: 'FATS', value: '${aF}g', targetValue: '${tF}g', color: Colors.purpleAccent, progress: aF / tF.clamp(1, 1000)),
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
  final String targetValue;
  final Color color;
  final double progress;

  const _MacroIndicator({required this.label, required this.value, required this.targetValue, required this.color, required this.progress});

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
        Text(targetValue, style: const TextStyle(color: AppColors.textMuted, fontSize: 8, fontWeight: FontWeight.bold)),
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
