import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:coaching_mobile/core/theme/app_theme.dart';
import 'package:coaching_mobile/core/api/api_client.dart';
import 'package:coaching_mobile/features/auth/data/auth_repository.dart';
import 'package:coaching_mobile/features/dashboard/data/dashboard_repository.dart';
import 'package:intl/intl.dart';
import 'package:coaching_mobile/shared/widgets/animate_in.dart';

class WorkoutPlayerScreen extends ConsumerStatefulWidget {
  final int workoutLogId;
  const WorkoutPlayerScreen({super.key, required this.workoutLogId});

  @override
  ConsumerState<WorkoutPlayerScreen> createState() => _WorkoutPlayerScreenState();
}

class _WorkoutPlayerScreenState extends ConsumerState<WorkoutPlayerScreen> {
  bool _started = false;
  bool _loading = true;
  dynamic _session;
  int _currentExIdx = 0;
  
  // Track completed sets: {exerciseId: [set1_done, set2_done, ...]}
  Map<String, List<bool>> _setsDone = {};
  
  // Rest timer
  int _restSeconds = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      // For now using sessions repository logic
      final repo = ref.read(dashboardRepositoryProvider);
      // Fetching specific session details
      final resp = await ref.read(apiClientProvider).get('/sessions/${widget.workoutLogId}');
      _session = resp.data;
      
      // Initialize sets tracking
      if (_session['workoutData'] != null && _session['workoutData']['exercises'] != null) {
        final List exercises = _session['workoutData']['exercises'];
        for (var ex in exercises) {
          final int sets = int.tryParse(ex['sets'].toString()) ?? 1;
          _setsDone[ex['id'].toString()] = List.generate(sets, (_) => false);
        }
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  void _startRest(int seconds) {
    _timer?.cancel();
    setState(() => _restSeconds = seconds);
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_restSeconds > 0) {
        setState(() => _restSeconds--);
      } else {
        t.cancel();
      }
    });
  }

  void _toggleSet(String exId, int setIdx, int rest) {
    setState(() {
      final done = _setsDone[exId]![setIdx];
      _setsDone[exId]![setIdx] = !done;
      if (!done) {
        // Just completed a set -> Start rest timer
        _startRest(rest);
      }
    });
  }

  Future<void> _finish() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Finish Workout?'),
        content: const Text('Great job! Ready to log your hard work?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Not yet')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('FINISH', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await ref.read(apiClientProvider).patch('/sessions/${widget.workoutLogId}', data: {
          'status': 'completed',
        });
        if (mounted) {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('🏆 Workout Logged! Well done.')),
          );
        }
      } catch (e) {
        debugPrint('Finish error: $e');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (!_started) {
      return _buildStartSplash();
    }

    final List exercises = _session['workoutData']['exercises'] ?? [];
    final currentEx = exercises[_currentExIdx];
    final totalEx = exercises.length;
    final progress = (_currentExIdx + 1) / totalEx;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
        title: Text(_session['title']?.toString().toUpperCase() ?? 'WORKOUT', 
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
        actions: [
          TextButton(onPressed: _finish, child: const Text('FINISH', style: TextStyle(color: AppColors.primary))),
        ],
      ),
      body: Column(
        children: [
          // Progress bar
          LinearProgressIndicator(
            value: progress,
            backgroundColor: AppColors.surface,
            color: AppColors.primary,
            minHeight: 6,
          ),
          
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                   // Exercise Header
                   AnimateIn(
                     delay: 100,
                     child: Row(
                       children: [
                          Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.2),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(16),
                              child: Image.network(
                                currentEx['gifUrl'], 
                                width: 90, 
                                height: 90, 
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => Container(
                                  width: 90, height: 90, color: AppColors.surfaceVariant,
                                  child: const Icon(Icons.fitness_center_rounded, color: AppColors.textMuted),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('EXERCISE ${_currentExIdx + 1} OF $totalEx', 
                                    style: const TextStyle(color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
                                const SizedBox(height: 4),
                                Text(currentEx['name'].toString().toUpperCase(), 
                                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
                              ],
                            ),
                          ),
                       ],
                     ),
                   ),
                   const SizedBox(height: 32),

                   // Set list
                   AnimateIn(
                     delay: 200,
                     child: const Text('SETS TO COMPLETE', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.textMuted, letterSpacing: 1.5)),
                   ),
                   const SizedBox(height: 14),
                   ...List.generate(int.tryParse(currentEx['sets'].toString()) ?? 1, (idx) {
                      final exId = currentEx['id'].toString();
                      final isDone = _setsDone[exId]![idx];
                      final targetWeight = (currentEx['targetWeights'] as List?)?[idx] ?? 0.0;
                      final rest = int.tryParse(currentEx['rest'].toString()) ?? 60;

                      return AnimateIn(
                        delay: 300 + (idx * 50),
                        child: GestureDetector(
                          onTap: () => _toggleSet(exId, idx, rest),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
                            decoration: BoxDecoration(
                              color: isDone ? AppColors.success.withOpacity(0.08) : AppColors.card,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: isDone ? AppColors.success.withOpacity(0.5) : AppColors.cardBorder,
                                width: isDone ? 2 : 1,
                              ),
                              boxShadow: isDone ? [] : [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.03),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                )
                              ],
                            ),
                            child: Row(
                              children: [
                                 Container(
                                   width: 32,
                                   height: 32,
                                   decoration: BoxDecoration(
                                     color: isDone ? AppColors.success : AppColors.surfaceVariant,
                                     shape: BoxShape.circle,
                                   ),
                                   child: Center(
                                     child: Text('${idx + 1}', 
                                         style: TextStyle(
                                           fontSize: 12, 
                                           fontWeight: FontWeight.w800, 
                                           color: isDone ? Colors.white : AppColors.textSecondary
                                         )),
                                   ),
                                 ),
                                 const SizedBox(width: 16),
                                 Expanded(
                                   child: Column(
                                     crossAxisAlignment: CrossAxisAlignment.start,
                                     children: [
                                       Text('${currentEx['reps']} REPS', 
                                           style: TextStyle(
                                             fontWeight: FontWeight.w600, 
                                             fontSize: 12,
                                             color: isDone ? AppColors.success : AppColors.textMuted
                                           )),
                                       Text('${targetWeight} KG', 
                                           style: TextStyle(
                                             fontWeight: FontWeight.w900, 
                                             fontSize: 18,
                                             color: isDone ? AppColors.success : AppColors.textPrimary
                                           )),
                                     ],
                                   ),
                                 ),
                                 if (isDone) 
                                   const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 28)
                                 else 
                                   Icon(Icons.radio_button_off_rounded, color: AppColors.textMuted.withOpacity(0.3), size: 28),
                              ],
                            ),
                          ),
                        ),
                      );
                   }),

                   if (_restSeconds > 0)
                    AnimateIn(
                      delay: 0,
                      transitionType: AnimateInTransitionType.slideUp,
                      child: Container(
                        margin: const EdgeInsets.only(top: 20),
                        padding: const EdgeInsets.all(22),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [AppColors.primary, Color(0xFFE8621A)],
                          ),
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 8))],
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.timer_outlined, color: Colors.white, size: 28),
                            const SizedBox(width: 16),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('REST TIME', style: TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1)),
                                Text('$_restSeconds s', style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900)),
                              ],
                            ),
                            const Spacer(),
                            TextButton(
                              onPressed: () => setState(() => _restSeconds = 0),
                              style: TextButton.styleFrom(
                                backgroundColor: Colors.white.withOpacity(0.2),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              child: const Text('SKIP', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 12)),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),

          // Bottom Nav
          Container(
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              color: AppColors.surface,
              border: Border(top: BorderSide(color: AppColors.cardBorder)),
            ),
            child: Row(
              children: [
                if (_currentExIdx > 0)
                  IconButton(
                    onPressed: () => setState(() => _currentExIdx--),
                    icon: const Icon(Icons.arrow_back),
                  ),
                const Spacer(),
                ElevatedButton(
                  onPressed: _currentExIdx < exercises.length - 1 
                      ? () => setState(() {
                            _currentExIdx++;
                            _restSeconds = 0;
                          })
                      : _finish,
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size(160, 50),
                    backgroundColor: _currentExIdx < exercises.length - 1 ? AppColors.primary : AppColors.success,
                  ),
                  child: Text(_currentExIdx < exercises.length - 1 ? 'NEXT EXERCISE' : 'FINISH WORKOUT', 
                      style: const TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStartSplash() {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          // Background Gradient Flares
          Positioned(
            top: -150,
            left: -100,
            child: Container(
              width: 400,
              height: 400,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.primary.withOpacity(0.08),
              ),
            ),
          ),
          Positioned(
            bottom: -50,
            right: -100,
            child: Container(
              width: 350,
              height: 350,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.accent.withOpacity(0.05),
              ),
            ),
          ),
          
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Spacer(),
                  const AnimateIn(
                    delay: 200,
                    child: Text('GET READY', 
                        style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w900, letterSpacing: 3, fontSize: 13)),
                  ),
                  const SizedBox(height: 12),
                  AnimateIn(
                    delay: 400,
                    child: Text(_session['title']?.toString().toUpperCase() ?? 'DAILY WORKOUT', 
                        style: const TextStyle(fontSize: 48, fontWeight: FontWeight.w900, height: 1.0, letterSpacing: -1.5)),
                  ),
                  const SizedBox(height: 24),
                  AnimateIn(
                    delay: 600,
                    child: Row(
                      children: [
                         _InfoBadge(icon: Icons.timer_rounded, label: '${_session['duration'] ?? 45} MIN'),
                         const SizedBox(width: 12),
                         _InfoBadge(icon: Icons.fitness_center_rounded, label: '${(_session['workoutData']?['exercises'] as List?)?.length ?? 0} EXERCISES'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 48),
                  AnimateIn(
                    delay: 800,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('YOUR FOCUS FOR TODAY', 
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.textMuted, letterSpacing: 1)),
                        const SizedBox(height: 12),
                        Text(_session['notes'] ?? 'Push your limits and stay consistent. You\'ve got this!', 
                            style: TextStyle(fontSize: 16, color: AppColors.textPrimary.withOpacity(0.7), height: 1.6, fontWeight: FontWeight.w500)),
                      ],
                    ),
                  ),
                  const Spacer(),
                  AnimateIn(
                    delay: 1000,
                    transitionType: AnimateInTransitionType.slideUp,
                    child: Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withOpacity(0.3),
                            blurRadius: 25,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: ElevatedButton(
                        onPressed: () => setState(() => _started = true),
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size(double.infinity, 64),
                          backgroundColor: AppColors.primary,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        ),
                        child: const Text('START WORKOUT', 
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, letterSpacing: 2, color: Colors.white)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 30),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoBadge extends StatelessWidget {
  final IconData icon;
  final String label;
  const _InfoBadge({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.cardBorder)),
      child: Row(
        children: [
          Icon(icon, size: 14, color: AppColors.primary),
          const SizedBox(width: 8),
          Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
        ],
      ),
    );
  }
}
