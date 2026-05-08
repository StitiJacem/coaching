import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:coaching_mobile/core/theme/app_theme.dart';
import 'package:coaching_mobile/features/workout/data/exercise_model.dart';
import 'package:coaching_mobile/features/workout/data/exercise_repository.dart';
import 'package:coaching_mobile/features/sessions/data/sessions_repository.dart';
import 'package:coaching_mobile/shared/providers/auth_provider.dart';
import 'package:intl/intl.dart';

class WorkoutBuilderScreen extends ConsumerStatefulWidget {
  final int? athleteId;
  final DateTime date;
  final dynamic existingSession;

  const WorkoutBuilderScreen({
    super.key,
    this.athleteId,
    required this.date,
    this.existingSession,
  });

  @override
  ConsumerState<WorkoutBuilderScreen> createState() => _WorkoutBuilderScreenState();
}

class _WorkoutBuilderScreenState extends ConsumerState<WorkoutBuilderScreen> {
  final _titleCtrl = TextEditingController(text: 'New Workout');
  String _workoutType = 'Strength';
  List<Map<String, dynamic>> _addedExercises = [];
  
  List<Exercise> _library = [];
  bool _loadingLibrary = false;
  String _searchQuery = '';
  String _activeBodyPart = 'ALL';

  final List<Map<String, String>> _bodyParts = [
    {'id': 'ALL', 'label': 'All'},
    {'id': 'back', 'label': 'Back'},
    {'id': 'cardio', 'label': 'Cardio'},
    {'id': 'chest', 'label': 'Chest'},
    {'id': 'lower arms', 'label': 'Arms'},
    {'id': 'lower legs', 'label': 'Legs'},
    {'id': 'neck', 'label': 'Neck'},
    {'id': 'shoulders', 'label': 'Shoulders'},
    {'id': 'upper arms', 'label': 'Triceps'},
    {'id': 'upper legs', 'label': 'Glutes'},
    {'id': 'waist', 'label': 'Abs'},
  ];

  @override
  void initState() {
    super.initState();
    _loadLibrary();
    if (widget.existingSession != null) {
      _loadExisting();
    }
  }

  void _loadExisting() {
    final s = widget.existingSession;
    _titleCtrl.text = s['title'] ?? 'New Workout';
    _workoutType = s['type'] ?? 'Strength';
    if (s['workoutData'] != null && s['workoutData']['exercises'] != null) {
      final List exList = s['workoutData']['exercises'];
      _addedExercises = exList.map((e) => Map<String, dynamic>.from(e)).toList();
    }
  }

  Future<void> _loadLibrary() async {
    setState(() => _loadingLibrary = true);
    try {
      final repo = ref.read(exerciseRepositoryProvider);
      if (_searchQuery.isNotEmpty) {
        _library = await repo.search(_searchQuery);
      } else if (_activeBodyPart != 'ALL') {
        _library = await repo.getByBodyPart(_activeBodyPart);
      } else {
        _library = await repo.getAll();
      }
    } catch (_) {}
    if (mounted) setState(() => _loadingLibrary = false);
  }

  void _addToList(Exercise ex) {
    if (_addedExercises.any((e) => e['id'] == ex.id)) return;
    setState(() {
      _addedExercises.add({
        'id': ex.id,
        'name': ex.name,
        'gifUrl': ex.gifUrl,
        'bodyPart': ex.bodyPart,
        'category': ex.category,
        'difficulty': ex.difficulty,
        'instructions': ex.instructions,
        'sets': 3,
        'reps': 12,
        'rest': 60,
        'targetWeights': [0.0, 0.0, 0.0],
      });
    });
  }

  void _removeFromList(int index) {
    setState(() => _addedExercises.removeAt(index));
  }

  Future<void> _save() async {
    if (_addedExercises.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Workout is empty! Add exercises.')),
      );
      return;
    }

    try {
      final coach = ref.read(currentUserProvider);
      final payload = {
        'athleteId': widget.athleteId,
        'coachId': coach?.id,
        'date': DateFormat('yyyy-MM-dd').format(widget.date),
        'title': _titleCtrl.text.trim(),
        'type': _workoutType,
        'status': 'draft',
        'workoutData': {'exercises': _addedExercises},
      };

      final repo = ref.read(sessionsRepositoryProvider);
      if (widget.existingSession != null && widget.existingSession['id'] != null) {
        await repo.update(widget.existingSession['id'], payload);
      } else {
        await repo.create(payload);
      }
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  void _showExercisePreview(Exercise ex) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.background,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Container(
        height: MediaQuery.of(context).size.height * 0.65,
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.cardBorder, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 24),
            Text(ex.name.toUpperCase(), textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textPrimary, fontSize: 20, fontWeight: FontWeight.w900)),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
              child: Text(ex.bodyPart.toUpperCase(), style: const TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.w800)),
            ),
            const SizedBox(height: 24),
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: CachedNetworkImage(
                  imageUrl: ex.gifUrl,
                  fit: BoxFit.cover,
                  errorWidget: (context, url, error) => Container(
                    color: AppColors.surface,
                    child: const Icon(Icons.fitness_center_rounded, size: 80, color: AppColors.textMuted),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () {
                _addToList(ex);
                Navigator.pop(ctx);
              },
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(double.infinity, 56),
                backgroundColor: AppColors.primary,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: const Text('ADD TO WORKOUT', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
            )
          ],
        ),
      ),
    );
  }

  void _showExerciseEditor(int index) {
    final ex = _addedExercises[index];
    final setsCtrl = TextEditingController(text: ex['sets'].toString());
    final repsCtrl = TextEditingController(text: ex['reps'].toString());
    final restCtrl = TextEditingController(text: ex['rest'].toString());
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.background,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('CONFIGURE ${ex['name'].toUpperCase()}', style: const TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w900)),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(child: _buildNumberField('SETS', setsCtrl)),
                  const SizedBox(width: 12),
                  Expanded(child: _buildNumberField('REPS', repsCtrl)),
                  const SizedBox(width: 12),
                  Expanded(child: _buildNumberField('REST (S)', restCtrl)),
                ],
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        _removeFromList(index);
                        Navigator.pop(ctx);
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.error,
                        side: const BorderSide(color: AppColors.error),
                        minimumSize: const Size(0, 56),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: const Text('REMOVE'),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      onPressed: () {
                        setState(() {
                          ex['sets'] = int.tryParse(setsCtrl.text) ?? 3;
                          ex['reps'] = int.tryParse(repsCtrl.text) ?? 12;
                          ex['rest'] = int.tryParse(restCtrl.text) ?? 60;
                        });
                        Navigator.pop(ctx);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        minimumSize: const Size(0, 56),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: const Text('SAVE CARD', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
                    ),
                  ),
                ],
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNumberField(String label, TextEditingController ctrl) {
    return TextField(
      controller: ctrl,
      keyboardType: TextInputType.number,
      textAlign: TextAlign.center,
      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
      decoration: InputDecoration(
        labelText: label,
        filled: true,
        fillColor: AppColors.surface,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(widget.existingSession != null ? 'EDIT WORKOUT' : 'NEW WORKOUT',
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
        actions: [
          TextButton(
            onPressed: _save,
            child: const Text('SAVE', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          // Header config
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _titleCtrl,
                    decoration: InputDecoration(
                      hintText: 'Workout Title',
                      filled: true,
                      fillColor: AppColors.surface,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12)
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12)),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _workoutType,
                      dropdownColor: AppColors.surface,
                      items: ['Strength', 'Cardio', 'HIIT']
                          .map((t) => DropdownMenuItem(value: t, child: Text(t, style: const TextStyle(fontWeight: FontWeight.w700))))
                          .toList(),
                      onChanged: (v) => setState(() => _workoutType = v!),
                    ),
                  ),
                )
              ],
            ),
          ),
          
          const SizedBox(height: 16),

          // ─── THE WORKOUT ──────────────────────────────────────────────────
          Container(
            height: 160,
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: AppColors.cardBorder, width: 2)),
              color: AppColors.background
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('ACTIVE WORKOUT', style: TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w800, letterSpacing: 1.5)),
                      Text('${_addedExercises.length} EXERCISES', style: const TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.w800)),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                Expanded(
                  child: _addedExercises.isEmpty
                    ? const Center(child: Text('Workout is empty.\nTap an exercise below to add.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textMuted, fontStyle: FontStyle.italic)))
                    : ListView.builder(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        itemCount: _addedExercises.length,
                        itemBuilder: (ctx, i) {
                          final ex = _addedExercises[i];
                          return GestureDetector(
                            onTap: () => _showExerciseEditor(i),
                            child: Container(
                              width: 110,
                              margin: const EdgeInsets.symmetric(horizontal: 4),
                              decoration: BoxDecoration(
                                color: AppColors.card,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppColors.primary.withOpacity(0.5), width: 2),
                                boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.1), blurRadius: 10, spreadRadius: 1)]
                              ),
                              child: Stack(
                                children: [
                                  Positioned.fill(
                                    child: ClipRRect(
                                      borderRadius: BorderRadius.circular(14),
                                      child: Opacity(
                                        opacity: 0.2,
                                        child: CachedNetworkImage(
                                          imageUrl: ex['gifUrl'],
                                          fit: BoxFit.cover,
                                          errorWidget: (_,__,___) => const Icon(Icons.fitness_center),
                                        ),
                                      ),
                                    ),
                                  ),
                                  Padding(
                                    padding: const EdgeInsets.all(12),
                                    child: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Text(ex['name'].toUpperCase(), textAlign: TextAlign.center, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w900)),
                                        const Spacer(),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(6)),
                                          child: Text('${ex['sets']} x ${ex['reps']}', style: const TextStyle(color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.w800)),
                                        )
                                      ],
                                    ),
                                  )
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                )
              ],
            ),
          ),

          // ─── THE COLLECTION ───────────────────────────────────────────
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      const Text('COLLECTION', style: TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w800, letterSpacing: 1.5)),
                      const Spacer(),
                      SizedBox(
                        height: 32,
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _activeBodyPart,
                            dropdownColor: AppColors.card,
                            icon: const Icon(Icons.filter_list, size: 16),
                            style: const TextStyle(fontSize: 12, color: AppColors.textPrimary, fontWeight: FontWeight.w700),
                            items: _bodyParts.map((bp) => DropdownMenuItem(value: bp['id'], child: Text(bp['label']!))).toList(),
                            onChanged: (v) {
                              setState(() => _activeBodyPart = v!);
                              _loadLibrary();
                            },
                          ),
                        ),
                      )
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: TextField(
                    decoration: InputDecoration(
                      hintText: 'Search collection...',
                      prefixIcon: const Icon(Icons.search, size: 18),
                      filled: true,
                      fillColor: AppColors.surface,
                      contentPadding: const EdgeInsets.all(12),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    ),
                    onChanged: (v) {
                      _searchQuery = v;
                      _loadLibrary();
                    },
                  ),
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: _loadingLibrary
                    ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                    : GridView.builder(
                        padding: const EdgeInsets.all(16),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 3,
                          childAspectRatio: 0.8,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                        ),
                        itemCount: _library.length,
                        itemBuilder: (ctx, i) {
                          final ex = _library[i];
                          final isInWorkout = _addedExercises.any((e) => e['id'] == ex.id);
                          
                          return GestureDetector(
                            onTap: () => _showExercisePreview(ex),
                            child: Container(
                              decoration: BoxDecoration(
                                color: AppColors.card,
                                borderRadius: BorderRadius.circular(12),
                                border: isInWorkout ? Border.all(color: AppColors.success, width: 2) : Border.all(color: AppColors.cardBorder),
                              ),
                              child: Stack(
                                children: [
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.stretch,
                                    children: [
                                      Expanded(
                                        child: ClipRRect(
                                          borderRadius: const BorderRadius.vertical(top: Radius.circular(10)),
                                          child: CachedNetworkImage(
                                            imageUrl: ex.gifUrl,
                                            fit: BoxFit.cover,
                                            errorWidget: (_,__,___) => const Icon(Icons.fitness_center, color: AppColors.textMuted),
                                          ),
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.all(6),
                                        child: Text(
                                          ex.name.toUpperCase(),
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                          textAlign: TextAlign.center,
                                          style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                                        ),
                                      )
                                    ],
                                  ),
                                  if (isInWorkout)
                                    Positioned(
                                      top: 4, right: 4,
                                      child: Container(
                                        padding: const EdgeInsets.all(2),
                                        decoration: const BoxDecoration(color: AppColors.success, shape: BoxShape.circle),
                                        child: const Icon(Icons.check, size: 12, color: Colors.white),
                                      )
                                    )
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                )
              ],
            ),
          )
        ],
      ),
    );
  }
}
