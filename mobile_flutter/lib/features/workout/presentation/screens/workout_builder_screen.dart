import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:coaching_mobile/core/theme/app_theme.dart';
import 'package:coaching_mobile/features/workout/data/exercise_model.dart';
import 'package:coaching_mobile/features/workout/data/exercise_repository.dart';
import 'package:coaching_mobile/features/sessions/data/sessions_repository.dart';
import 'package:coaching_mobile/shared/providers/auth_provider.dart';
import 'package:coaching_mobile/features/auth/data/auth_repository.dart';
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
        'videoId': ex.videoId,
        'videoTitle': ex.videoTitle,
        'sets': 3,
        'reps': 12,
        'rest': 60,
        'targetWeights': [0.0, 0.0, 0.0],
      });
    });
  }

  Future<void> _save() async {
    if (_addedExercises.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Add at least one exercise')),
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
        'status': 'upcoming',
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
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
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
          // ── Config Header ──────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _titleCtrl,
                    decoration: const InputDecoration(
                      labelText: 'WORKOUT TITLE',
                      hintText: 'e.g. Chest & Triceps',
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                _TypePicker(
                  selected: _workoutType,
                  onChanged: (v) => setState(() => _workoutType = v),
                ),
              ],
            ),
          ),

          Expanded(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Library Column ───────────────────────────────────
                Container(
                  width: 140,
                  decoration: const BoxDecoration(
                    border: Border(right: BorderSide(color: AppColors.cardBorder)),
                  ),
                  child: Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(8),
                        child: TextField(
                          decoration: InputDecoration(
                            hintText: 'Search...',
                            contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                            prefixIcon: const Icon(Icons.search, size: 16),
                            fillColor: AppColors.surface,
                          ),
                          style: const TextStyle(fontSize: 12),
                          onChanged: (v) {
                            _searchQuery = v;
                            _loadLibrary();
                          },
                        ),
                      ),
                      SizedBox(
                        height: 40,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 4),
                          itemCount: _bodyParts.length,
                          itemBuilder: (ctx, i) {
                            final bp = _bodyParts[i];
                            final selected = _activeBodyPart == bp['id'];
                            return Padding(
                              padding: const EdgeInsets.only(right: 4),
                              child: ChoiceChip(
                                label: Text(bp['label']!, style: const TextStyle(fontSize: 10)),
                                selected: selected,
                                onSelected: (s) {
                                  if (s) {
                                    setState(() => _activeBodyPart = bp['id']!);
                                    _loadLibrary();
                                  }
                                },
                              ),
                            );
                          },
                        ),
                      ),
                      Expanded(
                        child: _loadingLibrary
                            ? const Center(child: CircularProgressIndicator(strokeWidth: 2))
                            : ListView.builder(
                                padding: const EdgeInsets.all(8),
                                itemCount: _library.length,
                                itemBuilder: (ctx, i) {
                                  final ex = _library[i];
                                  return GestureDetector(
                                    onTap: () => _addToList(ex),
                                    child: Container(
                                      margin: const EdgeInsets.only(bottom: 8),
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(color: AppColors.cardBorder),
                                      ),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          ClipRRect(
                                            borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
                                            child: Image.network(ex.gifUrl, height: 80, width: double.infinity, fit: BoxFit.cover),
                                          ),
                                          Padding(
                                            padding: const EdgeInsets.all(4),
                                            child: Text(ex.name, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold), maxLines: 2),
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                },
                              ),
                      ),
                    ],
                  ),
                ),

                // ── Selected Column ──────────────────────────────────
                Expanded(
                  child: _addedExercises.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.add_circle_outline, size: 48, color: AppColors.textMuted.withOpacity(0.2)),
                              const SizedBox(height: 12),
                              const Text('Tap an exercise to add', style: TextStyle(color: AppColors.textMuted)),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _addedExercises.length,
                          itemBuilder: (ctx, i) {
                            final item = _addedExercises[i];
                            return _WorkoutItemCard(
                              item: item,
                              onRemove: () => setState(() => _addedExercises.removeAt(i)),
                              onUpdate: () => setState(() {}),
                            );
                          },
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TypePicker extends StatelessWidget {
  final String selected;
  final ValueChanged<String> onChanged;
  const _TypePicker({required this.selected, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: ['Strength', 'Cardio', 'HIIT'].map((t) {
          final isSel = selected == t;
          return GestureDetector(
            onTap: () => onChanged(t),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: isSel ? AppColors.primary : Colors.transparent,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(t,
                  style: TextStyle(
                    color: isSel ? Colors.white : AppColors.textSecondary,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  )),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _WorkoutItemCard extends StatelessWidget {
  final Map<String, dynamic> item;
  final VoidCallback onRemove;
  final VoidCallback onUpdate;
  const _WorkoutItemCard({required this.item, required this.onRemove, required this.onUpdate});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(item['gifUrl'], width: 60, height: 60, fit: BoxFit.cover),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item['name'].toString().toUpperCase(), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: AppColors.textPrimary)),
                      Text(item['bodyPart'].toString().toUpperCase(), style: const TextStyle(fontSize: 10, color: AppColors.primary, letterSpacing: 1)),
                    ],
                  ),
                ),
                IconButton(onPressed: onRemove, icon: const Icon(Icons.close, size: 18, color: AppColors.textMuted)),
              ],
            ),
          ),
          const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                _MiniInput(label: 'SETS', value: item['sets'].toString(), onChanged: (v) {
                  item['sets'] = int.tryParse(v) ?? 1;
                  // Sync target weights length
                  final List<double> w = List<double>.from(item['targetWeights'] ?? []);
                  if (w.length < item['sets']) {
                    w.addAll(List.generate(item['sets'] - w.length, (_) => 0.0));
                  } else if (w.length > item['sets']) {
                    w.removeRange(item['sets'], w.length);
                  }
                  item['targetWeights'] = w;
                  onUpdate();
                }),
                const SizedBox(width: 12),
                _MiniInput(label: 'REPS', value: item['reps'].toString(), onChanged: (v) => item['reps'] = int.tryParse(v) ?? 1),
                const SizedBox(width: 12),
                _MiniInput(label: 'REST(S)', value: item['rest'].toString(), onChanged: (v) => item['rest'] = int.tryParse(v) ?? 60),
              ],
            ),
          ),
          // Target Weights (Scrollable row of inputs)
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 12),
            child: Align(alignment: Alignment.centerLeft, child: Text('TARGET WEIGHTS (KG)', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: AppColors.textMuted))),
          ),
          SizedBox(
            height: 50,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              itemCount: item['sets'],
              itemBuilder: (ctx, idx) {
                final List weights = item['targetWeights'];
                return Container(
                  width: 50,
                  margin: const EdgeInsets.only(right: 8),
                  child: TextField(
                    controller: TextEditingController(text: weights[idx].toString())..selection = TextSelection.fromPosition(TextPosition(offset: weights[idx].toString().length)),
                    keyboardType: TextInputType.number,
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                    decoration: InputDecoration(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                      prefixText: 'S${idx + 1} ',
                      prefixStyle: const TextStyle(fontSize: 8, color: AppColors.primary),
                      fillColor: AppColors.background,
                    ),
                    onChanged: (v) {
                      weights[idx] = double.tryParse(v) ?? 0.0;
                    },
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}

class _MiniInput extends StatelessWidget {
  final String label;
  final String value;
  final ValueChanged<String> onChanged;
  const _MiniInput({required this.label, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: AppColors.textMuted)),
          const SizedBox(height: 4),
          TextField(
            controller: TextEditingController(text: value)..selection = TextSelection.fromPosition(TextPosition(offset: value.length)),
            keyboardType: TextInputType.number,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
            decoration: const InputDecoration(
              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              fillColor: AppColors.background,
            ),
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }
}
