import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:coaching_mobile/core/theme/app_theme.dart';
import 'package:coaching_mobile/core/constants/app_constants.dart';
import 'package:coaching_mobile/features/workout/data/workout_log_repository.dart';
import 'package:coaching_mobile/shared/widgets/animate_in.dart';
import 'package:cached_network_image/cached_network_image.dart';

class WorkoutPlayerScreen extends ConsumerStatefulWidget {
  final int workoutLogId;
  const WorkoutPlayerScreen({super.key, required this.workoutLogId});

  @override
  ConsumerState<WorkoutPlayerScreen> createState() => _WorkoutPlayerScreenState();
}

class _WorkoutPlayerScreenState extends ConsumerState<WorkoutPlayerScreen> with TickerProviderStateMixin {
  bool _isLoading = true;
  bool _isCompleting = false;
  bool _showOverviewMap = true;
  bool _showCompletionScreen = false;
  
  Map<String, dynamic>? _workoutLog;
  List<dynamic> _exercises = [];
  int _currentExIdx = 0;
  
  DateTime? _startTime;
  int _elapsedSeconds = 0;
  Timer? _timer;

  int _restSeconds = 0;
  Timer? _restTimer;

  Map<int, List<Map<String, dynamic>>> _setLogs = {}; 
  int _currentSetIndex = 0;

  bool _isSubmittingQuiz = false;
  double _quizDifficulty = 5.0;
  double _quizForm = 3.0;
  bool _quizPain = false;

  double _overallRating = 5.0;
  final TextEditingController _notesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadWorkout();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _restTimer?.cancel();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _loadWorkout() async {
    setState(() => _isLoading = true);
    try {
      final repo = ref.read(workoutLogRepositoryProvider);
      final log = await repo.getById(widget.workoutLogId);
      
      List<dynamic> rawExercises = [];
      if (log['session']?['workoutData']?['exercises'] != null && 
          (log['session']['workoutData']['exercises'] as List).isNotEmpty) {
        rawExercises = List.from(log['session']['workoutData']['exercises']);
      } else if (log['programDay']?['exercises'] != null && 
                 (log['programDay']['exercises'] as List).isNotEmpty) {
        rawExercises = List.from(log['programDay']['exercises']);
      }
      
      rawExercises.sort((a, b) => (a['order'] ?? 0).compareTo(b['order'] ?? 0));

      setState(() {
        _workoutLog = log;
        _exercises = rawExercises;
        _isLoading = false;
      });

      if (log['status'] == 'scheduled') {
        repo.startWorkout(widget.workoutLogId);
      }
    } catch (e) {
      if (mounted) Navigator.pop(context);
    }
  }

  void _startTimer() {
    if (_timer != null) return;
    _startTime = DateTime.now();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          _elapsedSeconds = DateTime.now().difference(_startTime!).inSeconds;
        });
      }
    });
  }

  void _initSetLogs(int exIdx) {
    if (_setLogs.containsKey(exIdx)) return;
    final ex = _exercises[exIdx];
    final int sets = int.tryParse(ex['sets']?.toString() ?? '3') ?? 3;
    final int reps = int.tryParse(ex['reps']?.toString() ?? '12') ?? 12;
    final List<dynamic> targetWeights = ex['targetWeights'] ?? [];

    _setLogs[exIdx] = List.generate(sets, (i) => {
      'reps': reps,
      'weightKg': (targetWeights.length > i) ? targetWeights[i] : 0.0,
      'done': false,
    });
  }

  void _startAtExercise(int index) {
    setState(() {
      _currentExIdx = index;
      _showOverviewMap = false;
      _currentSetIndex = 0;
      _initSetLogs(index);
    });
    _startTimer();
  }

  void _markSetDone() {
    final logs = _setLogs[_currentExIdx]!;
    if (_currentSetIndex >= logs.length) return;

    setState(() {
      logs[_currentSetIndex]['done'] = true;
    });

    if (_currentSetIndex == 0 && logs.length > 1) {
      _showQuizDialog();
    } else if (_currentSetIndex < logs.length - 1) {
      _startRestTimer();
    }
  }

  void _startRestTimer() {
    final ex = _exercises[_currentExIdx];
    final rest = int.tryParse(ex['rest_seconds']?.toString() ?? '60') ?? 60;
    setState(() {
      _currentSetIndex++;
      _restSeconds = rest;
    });

    _restTimer?.cancel();
    _restTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_restSeconds > 0) {
        setState(() => _restSeconds--);
      } else {
        _skipRest();
      }
    });
  }

  void _skipRest() {
    _restTimer?.cancel();
    setState(() => _restSeconds = 0);
  }

  void _showQuizDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: AppColors.surface,
          surfaceTintColor: Colors.transparent,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24), side: const BorderSide(color: AppColors.cardBorder)),
          title: const Text('CHECK-IN', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Difficulty (RPE 1-10)', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: AppColors.textMuted)),
              Slider(
                value: _quizDifficulty,
                min: 1, max: 10, divisions: 9,
                activeColor: AppColors.primary,
                label: _quizDifficulty.round().toString(),
                onChanged: (v) => setDialogState(() => _quizDifficulty = v),
              ),
              const SizedBox(height: 12),
              const Text('Form Quality (1-5)', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: AppColors.textMuted)),
              Slider(
                value: _quizForm,
                min: 1, max: 5, divisions: 4,
                activeColor: AppColors.accent,
                label: _quizForm.round().toString(),
                onChanged: (v) => setDialogState(() => _quizForm = v),
              ),
              const SizedBox(height: 12),
              SwitchListTile(
                title: const Text('PHYSICAL PAIN?', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                value: _quizPain,
                activeColor: Colors.red,
                onChanged: (v) => setDialogState(() => _quizPain = v),
              ),
            ],
          ),
          actions: [
            if (_isSubmittingQuiz)
              const CircularProgressIndicator()
            else
              TextButton(
                onPressed: () async {
                  setDialogState(() => _isSubmittingQuiz = true);
                  await _submitQuiz();
                  if (mounted) Navigator.pop(ctx);
                },
                child: const Text('SUBMIT', style: TextStyle(fontWeight: FontWeight.w900, color: AppColors.primary)),
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _submitQuiz() async {
    try {
      final repo = ref.read(workoutLogRepositoryProvider);
      final ex = _exercises[_currentExIdx];
      await repo.emitEvent(widget.workoutLogId, 'quiz_answer', {
        'programExerciseId': ex['id'] ?? ex['exercise_id'],
        'exercise_name': ex['name'] ?? ex['exercise_name'],
        'rpe': _quizDifficulty.round(),
        'form': _quizForm.round(),
        'pain': _quizPain,
      });
    } catch (_) {}
    setState(() => _isSubmittingQuiz = false);
    _startRestTimer();
  }

  void _nextExercise() {
    _saveExerciseLog();
    if (_currentExIdx < _exercises.length - 1) {
      setState(() {
        _currentExIdx++;
        _currentSetIndex = 0;
        _initSetLogs(_currentExIdx);
      });
    } else {
      _timer?.cancel();
      setState(() => _showCompletionScreen = true);
    }
  }

  Future<void> _saveExerciseLog() async {
    try {
      final ex = _exercises[_currentExIdx];
      final logs = _setLogs[_currentExIdx]!;
      final repo = ref.read(workoutLogRepositoryProvider);
      await repo.logExercise(widget.workoutLogId, {
        'programExerciseId': ex['id'] ?? ex['exercise_id'],
        'exercise_name': ex['name'] ?? ex['exercise_name'],
        'exercise_id': ex['id'] ?? ex['exercise_id'],
        'setsCompleted': logs.where((s) => s['done']).length,
        'repsPerSet': logs.map((s) => s['reps']).toList(),
        'weightKgPerSet': logs.map((s) => s['weightKg']).toList(),
      });
    } catch (_) {}
  }

  Future<void> _finishWorkout() async {
    setState(() => _isCompleting = true);
    try {
      final repo = ref.read(workoutLogRepositoryProvider);
      final durationMinutes = (_elapsedSeconds / 60).round();
      await repo.updateWorkout(widget.workoutLogId, {
        'status': 'completed',
        'durationMinutes': durationMinutes,
        'notes': _notesController.text,
        'overallRating': _overallRating.round(),
      });
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('🏆 WORKOUT LOGGED! MISSION ACCOMPLISHED.'), backgroundColor: AppColors.success, behavior: SnackBarBehavior.floating));
      }
    } catch (e) {
      setState(() => _isCompleting = false);
    }
  }

  Future<void> _confirmQuit() async {
    final bool? confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Quit Workout?', style: TextStyle(fontWeight: FontWeight.w900)),
        content: const Text('Are you sure you want to abandon this session? Progress will be marked as missed.', style: TextStyle(color: AppColors.textMuted)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('CANCEL', style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            child: const Text('QUIT', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        final repo = ref.read(workoutLogRepositoryProvider);
        await repo.quitWorkout(widget.workoutLogId);
      } catch (_) {}
      if (mounted) {
        Navigator.pop(context);
      }
    }
  }

  String get _formattedTime {
    final m = (_elapsedSeconds ~/ 60).toString().padLeft(2, '0');
    final s = (_elapsedSeconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(backgroundColor: AppColors.background, body: Center(child: CircularProgressIndicator(color: AppColors.primary)));
    if (_showCompletionScreen) return _buildCompletionScreen();
    if (_showOverviewMap) return _buildOverviewMap();
    return _buildPlayer();
  }

  Widget _buildOverviewMap() {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('BATTLE PLAN', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.5)),
        leading: IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => Navigator.pop(context)),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        itemCount: _exercises.length,
        itemBuilder: (ctx, i) {
          final ex = _exercises[i];
          final bool isDone = _setLogs[i]?.every((s) => s['done']) ?? false;
          final String rawGif = ex['gifUrl'] ?? ex['exercise_gif'] ?? '';
          final String resolvedGifUrl = rawGif.startsWith('/api') 
              ? '${AppConstants.baseUrl.replaceAll('/api', '')}$rawGif' 
              : rawGif;

          return AnimateIn(
            delay: i * 50,
            child: Card(
              margin: const EdgeInsets.only(bottom: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              color: AppColors.card,
              child: ListTile(
                contentPadding: const EdgeInsets.all(12),
                leading: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: CachedNetworkImage(
                    imageUrl: resolvedGifUrl,
                    width: 50, height: 50, fit: BoxFit.cover,
                    placeholder: (ctx, url) => Container(color: AppColors.surfaceVariant),
                    errorWidget: (ctx, url, err) => const Icon(Icons.fitness_center),
                  ),
                ),
                title: Text((ex['name'] ?? ex['exercise_name'] ?? '').toString().toUpperCase(), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                subtitle: Text('${ex['sets']} SETS × ${ex['reps']} REPS', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                trailing: isDone 
                    ? const Icon(Icons.check_circle, color: AppColors.success)
                    : const Icon(Icons.play_circle_outline, color: AppColors.primary),
                onTap: () => _startAtExercise(i),
              ),
            ),
          );
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildPlayer() {
    if (_exercises.isEmpty) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
        body: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.fitness_center, size: 64, color: AppColors.textMuted),
              SizedBox(height: 16),
              Text('No exercises found in this session.', style: TextStyle(color: Colors.white)),
            ],
          ),
        ),
      );
    }

    final ex = _exercises[_currentExIdx];
    final progress = (_currentExIdx + 1) / _exercises.length;
    final logs = _setLogs[_currentExIdx]!;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.grid_view_rounded, color: AppColors.primary),
          onPressed: () => setState(() => _showOverviewMap = true),
        ),
        title: Text(
          _formattedTime,
          style: const TextStyle(
            fontFamily: 'Monospace',
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert, color: Colors.white),
            onSelected: (value) {
              if (value == 'quit') {
                _confirmQuit();
              }
            },
            itemBuilder: (BuildContext context) => [
              const PopupMenuItem(
                value: 'quit',
                child: Row(
                  children: [
                    Icon(Icons.exit_to_app, color: Colors.red, size: 20),
                    SizedBox(width: 12),
                    Text('Quit Workout', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.close, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),
        ],
      ),
      body: Stack(
        children: [
<<<<<<< Updated upstream
          LinearProgressIndicator(
            value: progress.isFinite ? progress : 0.0,
            backgroundColor: AppColors.surfaceVariant,
            color: AppColors.primary,
            minHeight: 4,
          ),
          Expanded(
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Media Card
                  Container(
                    height: 220,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(24),
                      color: AppColors.card,
                      border: Border.all(color: AppColors.cardBorder),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.3),
                          blurRadius: 20,
                          offset: const Offset(0, 10),
                        )
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(24),
                      child: Builder(
                        builder: (context) {
                          final rawUrl = (ex['gifUrl'] ?? ex['exercise_gif'] ?? '').toString();
                          if (rawUrl.isEmpty) {
                            return Container(
                              color: AppColors.surfaceVariant,
                              child: const Center(
                                child: Icon(Icons.fitness_center, size: 60, color: AppColors.textMuted),
                              ),
                            );
                          }
                          final resolvedUrl = rawUrl.startsWith('/api') 
                              ? '${AppConstants.baseUrl.replaceAll('/api', '')}$rawUrl' 
                              : rawUrl;
                          
                          return CachedNetworkImage(
                            imageUrl: resolvedUrl,
                            fit: BoxFit.cover,
                            placeholder: (ctx, url) => const Center(child: CircularProgressIndicator()),
                            errorWidget: (ctx, url, err) => Container(
                              color: AppColors.surfaceVariant,
                              child: const Center(
                                child: Icon(Icons.broken_image, size: 60, color: AppColors.textMuted),
                              ),
                            ),
                          );
                        }
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'EXERCISE ${_currentExIdx + 1} OF ${_exercises.length}'.toUpperCase(),
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2.0,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    (ex['name'] ?? ex['exercise_name'] ?? 'Unknown Exercise').toString().toUpperCase(),
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                      letterSpacing: -0.5,
                      height: 1.1,
                    ),
                  ),
                  
                  const SizedBox(height: 32),
                  Row(
                    children: [
                      Container(
                        width: 4,
                        height: 16,
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Text(
                        'SET LIST',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          color: AppColors.textPrimary,
                          letterSpacing: 1,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  
                  ...List.generate(logs.length, (idx) {
                    final isCurrent = idx == _currentSetIndex;
                    final isDone = logs[idx]['done'];
                    
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isCurrent ? AppColors.primary.withOpacity(0.1) : (isDone ? AppColors.success.withOpacity(0.05) : AppColors.card),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isCurrent ? AppColors.primary : (isDone ? AppColors.success.withOpacity(0.5) : Colors.transparent),
                          width: 1.5,
                        ),
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 14,
                            backgroundColor: isDone ? AppColors.success : (isCurrent ? AppColors.primary : AppColors.surfaceVariant),
                            child: Text('${idx + 1}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
=======
          Column(
            children: [
              Container(height: 2, width: double.infinity, color: AppColors.surfaceVariant, child: FractionallySizedBox(alignment: Alignment.centerLeft, widthFactor: progress, child: Container(color: AppColors.primary))),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      AppTheme.glassCard(
                        opacity: 0.1,
                        child: Container(
                          height: 240, width: double.infinity,
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(24),
                            child: CachedNetworkImage(imageUrl: ex['exercise_gif'] ?? '', fit: BoxFit.cover, placeholder: (_,__) => const Center(child: CircularProgressIndicator()), errorWidget: (_,__,___) => const Icon(Icons.fitness_center, size: 80, color: AppColors.textMuted)),
>>>>>>> Stashed changes
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('EXERCISE ${_currentExIdx + 1}/${_exercises.length}', style: const TextStyle(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2)),
                              const SizedBox(height: 4),
                              Text(ex['exercise_name'].toString().toUpperCase(), style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 32),
                      const Text('ACTIVE SETS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: AppColors.textMuted, letterSpacing: 1.5)),
                      const SizedBox(height: 16),
                      ...List.generate(logs.length, (idx) {
                        final isCurrent = idx == _currentSetIndex;
                        final isDone = logs[idx]['done'];
                        return AnimatedContainer(
                          duration: const Duration(milliseconds: 400),
                          margin: const EdgeInsets.only(bottom: 16),
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: isCurrent ? AppColors.primary.withValues(alpha: 0.05) : (isDone ? AppColors.success.withValues(alpha: 0.05) : AppColors.card),
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(color: isCurrent ? AppColors.primary : (isDone ? AppColors.success.withValues(alpha: 0.3) : AppColors.cardBorder), width: 2),
                          ),
                          child: Row(
                            children: [
                              Container(width: 32, height: 32, decoration: BoxDecoration(color: isDone ? AppColors.success : (isCurrent ? AppColors.primary : AppColors.surfaceVariant), shape: BoxShape.circle), child: Center(child: Text('${idx + 1}', style: const TextStyle(fontWeight: FontWeight.w900, color: Colors.black, fontSize: 12)))),
                              const SizedBox(width: 20),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('${logs[idx]['reps']} REPS', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: isDone ? AppColors.success : AppColors.textMuted)),
                                    Text('${logs[idx]['weightKg']} KG', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
                                  ],
                                ),
                              ),
                              if (isCurrent && !isDone)
                                ElevatedButton(
                                  onPressed: _markSetDone,
                                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.black, minimumSize: const Size(80, 44), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                                  child: const Text('DONE', style: TextStyle(fontWeight: FontWeight.w900)),
                                )
                              else if (isDone)
                                const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 28),
                            ],
                          ),
                        );
                      }),
                    ],
                  ),
                ),
              ),
              _buildBottomControls(),
            ],
          ),
          if (_restSeconds > 0) _buildRestCinematic(),
        ],
      ),
    );
  }

  Widget _buildRestCinematic() {
    return Positioned.fill(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          color: Colors.black.withValues(alpha: 0.8),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text('REST PHASE', style: TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 5)),
                const SizedBox(height: 20),
                Stack(
                  alignment: Alignment.center,
                  children: [
                    SizedBox(width: 200, height: 200, child: CircularProgressIndicator(value: 1 - (_restSeconds / 60), strokeWidth: 12, color: AppColors.primary, backgroundColor: AppColors.surfaceVariant, strokeCap: StrokeCap.round)),
                    Text('${_restSeconds}s', style: const TextStyle(fontSize: 64, fontWeight: FontWeight.w900, color: Colors.white)),
                  ],
                ),
                const SizedBox(height: 48),
                OutlinedButton(onPressed: _skipRest, style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.white24), padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30))), child: const Text('SKIP REST', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900))),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBottomControls() {
    final allDone = _setLogs[_currentExIdx]?.every((s) => s['done']) ?? false;
<<<<<<< Updated upstream
    final hasNext = _currentExIdx < _exercises.length - 1;
    final nextEx = hasNext ? _exercises[_currentExIdx + 1] : null;

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface, 
        border: Border(top: BorderSide(color: AppColors.cardBorder))
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (hasNext && nextEx != null)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                color: AppColors.surfaceVariant.withOpacity(0.5),
                child: Row(
                  children: [
                    const Icon(Icons.arrow_forward_rounded, size: 14, color: AppColors.textMuted),
                    const SizedBox(width: 8),
                    const Text('NEXT:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: AppColors.textMuted)),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        (nextEx['name'] ?? nextEx['exercise_name'] ?? '').toString().toUpperCase(),
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Text('${nextEx['sets']}×${nextEx['reps']}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textMuted)),
                  ],
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  if (_currentExIdx > 0)
                    IconButton(
                      onPressed: () => setState(() {
                        _currentExIdx--;
                        _currentSetIndex = 0;
                        _initSetLogs(_currentExIdx);
                      }),
                      icon: const Icon(Icons.arrow_back_ios_new_rounded),
                    ),
                  const Spacer(),
                  ElevatedButton(
                    onPressed: allDone ? _nextExercise : null,
                    style: ElevatedButton.styleFrom(
                      minimumSize: const Size(180, 56),
                      backgroundColor: hasNext ? AppColors.primary : AppColors.success,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: Text(
                      hasNext ? 'NEXT EXERCISE' : 'FINISH WORKOUT',
                      style: const TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCompletionScreen() {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('SESSION', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w900, letterSpacing: 4, fontSize: 14)),
              const Text('TERMINATED', style: TextStyle(fontSize: 52, fontWeight: FontWeight.w900, height: 1.0, letterSpacing: -2)),
              const SizedBox(height: 48),
              const Text('OVERALL PERFORMANCE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: AppColors.textMuted, letterSpacing: 1.5)),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: List.generate(10, (i) {
                  final val = i + 1;
                  final selected = _overallRating >= val;
                  return GestureDetector(
                    onTap: () => setState(() => _overallRating = val.toDouble()),
                    child: Container(width: 28, height: 40, decoration: BoxDecoration(color: selected ? AppColors.primary : AppColors.surfaceVariant, borderRadius: BorderRadius.circular(8)), child: Center(child: Text('$val', style: TextStyle(fontWeight: FontWeight.w900, color: selected ? Colors.black : AppColors.textMuted, fontSize: 12)))),
                  );
                }),
              ),
              const SizedBox(height: 40),
              const Text('MISSION NOTES', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: AppColors.textMuted, letterSpacing: 1.5)),
              const SizedBox(height: 16),
              TextField(
                controller: _notesController,
                maxLines: 4,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(hintText: 'Any thoughts on today\'s grind?', filled: true, fillColor: AppColors.card, border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none)),
              ),
              const Spacer(),
              _isCompleting 
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                : ElevatedButton(
                    onPressed: _finishWorkout,
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.black, minimumSize: const Size(double.infinity, 72), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24))),
                    child: const Text('SUBMIT DATA', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: 2)),
                  ),
            ],
          ),
        ),
      ),
    );
  }
}

