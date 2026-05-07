import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/providers/auth_provider.dart';
import '../../data/programs_repository.dart';
import '../../../workout/data/exercise_repository.dart';

// ─── Model ───────────────────────────────────────────────────────────────────
class _DayWorkout {
  String title;
  List<_ExerciseEntry> exercises;
  _DayWorkout({required this.title, required this.exercises});
}

class _ExerciseEntry {
  final String id;
  final String name;
  final String gifUrl;
  int sets;
  int reps;
  int restSeconds;
  _ExerciseEntry({
    required this.id,
    required this.name,
    required this.gifUrl,
    this.sets = 3,
    this.reps = 12,
    this.restSeconds = 60,
  });
}

// ─── Screen ──────────────────────────────────────────────────────────────────
class ProgramBuilderScreen extends ConsumerStatefulWidget {
  final int? programId;
  const ProgramBuilderScreen({super.key, this.programId});

  @override
  ConsumerState<ProgramBuilderScreen> createState() => _ProgramBuilderScreenState();
}

class _ProgramBuilderScreenState extends ConsumerState<ProgramBuilderScreen> {
  final _nameCtrl = TextEditingController(text: 'New Training Program');
  final _descCtrl = TextEditingController();
  int _totalDays = 14;
  // dayNumber (1-based) -> workout
  final Map<int, _DayWorkout> _days = {};
  bool _saving = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  void _openDayBuilder(int dayNumber) async {
    final existing = _days[dayNumber];
    final result = await showModalBottomSheet<_DayWorkout>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _DayBuilderSheet(
        dayNumber: dayNumber,
        existing: existing,
        ref: ref,
      ),
    );
    if (result != null) {
      setState(() => _days[dayNumber] = result);
    }
  }

  void _clearDay(int dayNumber) {
    setState(() => _days.remove(dayNumber));
  }

  Future<void> _save() async {
    if (_days.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Add at least one workout day first.')),
      );
      return;
    }
    setState(() => _saving = true);
    try {
      final user = ref.read(currentUserProvider)!;
      final repo = ref.read(programsRepositoryProvider);

      final daysPayload = _days.entries.map((e) => {
        'day_number': e.key,
        'title': e.value.title,
        'exercises': e.value.exercises.asMap().entries.map((ex) => {
          'exercise_id': ex.value.id,
          'exercise_name': ex.value.name,
          'exercise_gif': ex.value.gifUrl,
          'sets': ex.value.sets,
          'reps': ex.value.reps,
          'rest_seconds': ex.value.restSeconds,
          'order': ex.key,
        }).toList(),
      }).toList();

      await repo.create({
        'name': _nameCtrl.text.trim(),
        'description': _descCtrl.text.trim(),
        'coachId': user.id,
        'status': 'draft',
        'startDate': DateTime.now().toIso8601String(),
        'days': daysPayload,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Program saved to drafts!'),
            backgroundColor: AppColors.success,
          ),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.pop(),
        ),
        title: const Text('PROGRAM BUILDER', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: _saving
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : ElevatedButton(
                    onPressed: _save,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.success,
                      minimumSize: const Size(0, 36),
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                    ),
                    child: const Text('SAVE DRAFT', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Meta section
          Container(
            color: AppColors.surface,
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
            child: Column(
              children: [
                TextField(
                  controller: _nameCtrl,
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
                  decoration: const InputDecoration(
                    border: InputBorder.none,
                    hintText: 'Program Name',
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
                const Divider(color: AppColors.cardBorder),
                TextField(
                  controller: _descCtrl,
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
                  decoration: const InputDecoration(
                    border: InputBorder.none,
                    hintText: 'Description (optional)',
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
                const SizedBox(height: 8),
                // Week toggle
                Row(
                  children: [
                    const Text('DURATION', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.textMuted)),
                    const Spacer(),
                    for (final d in [7, 14, 21, 28])
                      Padding(
                        padding: const EdgeInsets.only(left: 6),
                        child: GestureDetector(
                          onTap: () => setState(() => _totalDays = d),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: _totalDays == d ? AppColors.primary : AppColors.surfaceVariant,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              '${d ~/ 7}W',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: _totalDays == d ? Colors.white : AppColors.textMuted,
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
          // Calendar grid
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(12),
              child: _buildGrid(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGrid() {
    final weeks = (_totalDays / 7).ceil();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Day-of-week header
        Row(
          children: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d) =>
            Expanded(
              child: Center(
                child: Text(d, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: AppColors.textMuted, letterSpacing: 0.5)),
              ),
            ),
          ).toList(),
        ),
        const SizedBox(height: 8),
        for (int week = 0; week < weeks; week++) ...[
          Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Text('WEEK ${week + 1}', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.primary, letterSpacing: 1)),
          ),
          Row(
            children: List.generate(7, (dow) {
              final dayNum = (week * 7) + dow + 1;
              if (dayNum > _totalDays) return const Expanded(child: SizedBox());
              final hasWorkout = _days.containsKey(dayNum);
              final workout = _days[dayNum];
              return Expanded(
                child: GestureDetector(
                  onTap: () => _openDayBuilder(dayNum),
                  onLongPress: hasWorkout ? () => _clearDay(dayNum) : null,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.all(2),
                    height: 80,
                    decoration: BoxDecoration(
                      color: hasWorkout ? AppColors.primary.withOpacity(0.12) : AppColors.card,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: hasWorkout ? AppColors.primary.withOpacity(0.6) : AppColors.cardBorder,
                        width: hasWorkout ? 1.5 : 1,
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('$dayNum', style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          color: hasWorkout ? AppColors.primary : AppColors.textMuted,
                        )),
                        if (hasWorkout) ...[
                          const SizedBox(height: 4),
                          Text(
                            '${workout!.exercises.length} ex.',
                            style: const TextStyle(fontSize: 9, color: AppColors.primary, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 2),
                          const Icon(Icons.fitness_center_rounded, size: 12, color: AppColors.primary),
                        ] else
                          const Icon(Icons.add_rounded, size: 14, color: AppColors.textMuted),
                      ],
                    ),
                  ),
                ),
              );
            }),
          ),
          const SizedBox(height: 8),
        ],
        const SizedBox(height: 60),
        // Summary
        if (_days.isNotEmpty) ...[
          const Text('SUMMARY', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.textMuted, letterSpacing: 1)),
          const SizedBox(height: 8),
          ..._days.entries.map((e) => Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.cardBorder)),
            child: Row(
              children: [
                Container(
                  width: 32, height: 32,
                  decoration: BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                  child: Center(child: Text('${e.key}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12))),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(e.value.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                      Text('${e.value.exercises.length} exercises', style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => _openDayBuilder(e.key),
                  icon: const Icon(Icons.edit_rounded, size: 16, color: AppColors.textMuted),
                ),
              ],
            ),
          )),
        ],
      ],
    );
  }
}

// ─── Day Builder Sheet ────────────────────────────────────────────────────────
class _DayBuilderSheet extends StatefulWidget {
  final int dayNumber;
  final _DayWorkout? existing;
  final WidgetRef ref;
  const _DayBuilderSheet({required this.dayNumber, this.existing, required this.ref});

  @override
  State<_DayBuilderSheet> createState() => _DayBuilderSheetState();
}

class _DayBuilderSheetState extends State<_DayBuilderSheet> {
  late TextEditingController _titleCtrl;
  late List<_ExerciseEntry> _exercises;

  @override
  void initState() {
    super.initState();
    _titleCtrl = TextEditingController(text: widget.existing?.title ?? 'Day ${widget.dayNumber} Workout');
    _exercises = widget.existing?.exercises.map((e) => _ExerciseEntry(
      id: e.id, name: e.name, gifUrl: e.gifUrl,
      sets: e.sets, reps: e.reps, restSeconds: e.restSeconds,
    )).toList() ?? [];
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    super.dispose();
  }

  void _pickExercise() async {
    final picked = await showModalBottomSheet<Map<String, dynamic>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ExercisePickerSheet(ref: widget.ref),
    );
    if (picked != null) {
      setState(() {
        _exercises.add(_ExerciseEntry(
          id: picked['id']?.toString() ?? '',
          name: picked['name'] ?? picked['exercise_name'] ?? 'Exercise',
          gifUrl: picked['gifUrl'] ?? picked['exercise_gif'] ?? '',
        ));
      });
    }
  }

  void _removeExercise(int index) => setState(() => _exercises.removeAt(index));

  void _confirm() {
    if (_exercises.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Add at least one exercise.')),
      );
      return;
    }
    Navigator.pop(context, _DayWorkout(title: _titleCtrl.text.trim(), exercises: _exercises));
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.9,
      maxChildSize: 0.95,
      minChildSize: 0.5,
      builder: (ctx, scrollCtrl) => Container(
        decoration: const BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            // Handle
            Container(margin: const EdgeInsets.symmetric(vertical: 10), width: 40, height: 4,
              decoration: BoxDecoration(color: AppColors.cardBorder, borderRadius: BorderRadius.circular(2))),
            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  Text('DAY ${widget.dayNumber}', style: const TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.w900, letterSpacing: 1.5)),
                  const Spacer(),
                  TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted))),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: _confirm,
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, minimumSize: const Size(0, 36)),
                    child: const Text('SAVE DAY', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 12),
              child: TextField(
                controller: _titleCtrl,
                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
                decoration: const InputDecoration(border: InputBorder.none, contentPadding: EdgeInsets.zero),
              ),
            ),
            const Divider(height: 1, color: AppColors.cardBorder),
            // Exercise list
            Expanded(
              child: ListView(
                controller: scrollCtrl,
                padding: const EdgeInsets.all(16),
                children: [
                  ..._exercises.asMap().entries.map((entry) {
                    final idx = entry.key;
                    final ex = entry.value;
                    return _ExerciseCard(
                      entry: ex,
                      onRemove: () => _removeExercise(idx),
                      onChanged: () => setState(() {}),
                    );
                  }),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: _pickExercise,
                    icon: const Icon(Icons.add_rounded),
                    label: const Text('ADD EXERCISE', style: TextStyle(fontWeight: FontWeight.bold)),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(double.infinity, 52),
                      side: const BorderSide(color: AppColors.primary),
                      foregroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
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
}

// ─── Exercise Card in Day Builder ─────────────────────────────────────────────
class _ExerciseCard extends StatelessWidget {
  final _ExerciseEntry entry;
  final VoidCallback onRemove;
  final VoidCallback onChanged;
  const _ExerciseCard({required this.entry, required this.onRemove, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (entry.gifUrl.isNotEmpty)
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: CachedNetworkImage(
                    imageUrl: entry.gifUrl, width: 48, height: 48, fit: BoxFit.cover,
                    errorWidget: (_, __, ___) => const Icon(Icons.fitness_center, size: 24),
                  ),
                )
              else
                Container(width: 48, height: 48, decoration: BoxDecoration(color: AppColors.surfaceVariant, borderRadius: BorderRadius.circular(8)),
                  child: const Icon(Icons.fitness_center, color: AppColors.textMuted)),
              const SizedBox(width: 12),
              Expanded(child: Text(entry.name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13))),
              IconButton(onPressed: onRemove, icon: const Icon(Icons.close_rounded, size: 18, color: AppColors.textMuted)),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _SpinnerField(label: 'Sets', value: entry.sets, onChanged: (v) { entry.sets = v; onChanged(); }),
              const SizedBox(width: 12),
              _SpinnerField(label: 'Reps', value: entry.reps, onChanged: (v) { entry.reps = v; onChanged(); }),
              const SizedBox(width: 12),
              _SpinnerField(label: 'Rest (s)', value: entry.restSeconds, step: 15, onChanged: (v) { entry.restSeconds = v; onChanged(); }),
            ],
          ),
        ],
      ),
    );
  }
}

class _SpinnerField extends StatelessWidget {
  final String label;
  final int value;
  final int step;
  final ValueChanged<int> onChanged;
  const _SpinnerField({required this.label, required this.value, required this.onChanged, this.step = 1});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.textMuted)),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              GestureDetector(
                onTap: () { if (value - step >= 1) onChanged(value - step); },
                child: Container(width: 24, height: 24, decoration: BoxDecoration(color: AppColors.surfaceVariant, borderRadius: BorderRadius.circular(6)),
                  child: const Icon(Icons.remove, size: 14)),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Text('$value', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              ),
              GestureDetector(
                onTap: () => onChanged(value + step),
                child: Container(width: 24, height: 24, decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(6)),
                  child: const Icon(Icons.add, size: 14, color: Colors.white)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Exercise Picker Sheet ────────────────────────────────────────────────────
class _ExercisePickerSheet extends StatefulWidget {
  final WidgetRef ref;
  const _ExercisePickerSheet({required this.ref});

  @override
  State<_ExercisePickerSheet> createState() => _ExercisePickerSheetState();
}

class _ExercisePickerSheetState extends State<_ExercisePickerSheet> {
  final _searchCtrl = TextEditingController();
  List<dynamic> _results = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _search('');
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _search(String query) async {
    setState(() => _loading = true);
    try {
      final repo = widget.ref.read(exerciseRepositoryProvider);
      if (query.isEmpty) {
        final res = await repo.getAll(limit: 30);
        _results = res.map((e) => {'id': e.id, 'name': e.name, 'gifUrl': e.gifUrl, 'bodyPart': e.bodyPart}).toList();
      } else {
        final res = await repo.search(query);
        _results = res.map((e) => {'id': e.id, 'name': e.name, 'gifUrl': e.gifUrl, 'bodyPart': e.bodyPart}).toList();
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      maxChildSize: 0.95,
      minChildSize: 0.4,
      builder: (ctx, scrollCtrl) => Container(
        decoration: const BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            Container(margin: const EdgeInsets.symmetric(vertical: 10), width: 40, height: 4,
              decoration: BoxDecoration(color: AppColors.cardBorder, borderRadius: BorderRadius.circular(2))),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('PICK AN EXERCISE', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 1)),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _searchCtrl,
                    onChanged: (v) => _search(v),
                    decoration: InputDecoration(
                      hintText: 'Search exercises...',
                      prefixIcon: const Icon(Icons.search_rounded),
                      fillColor: AppColors.card,
                      filled: true,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                      contentPadding: const EdgeInsets.symmetric(vertical: 0),
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: AppColors.cardBorder),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                  : ListView.builder(
                      controller: scrollCtrl,
                      itemCount: _results.length,
                      itemBuilder: (ctx, i) {
                        final ex = _results[i];
                        return ListTile(
                          leading: ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: CachedNetworkImage(
                              imageUrl: ex['gifUrl'] ?? '',
                              width: 48, height: 48, fit: BoxFit.cover,
                              errorWidget: (_, __, ___) => Container(width: 48, height: 48, color: AppColors.surfaceVariant, child: const Icon(Icons.fitness_center)),
                            ),
                          ),
                          title: Text(ex['name']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                          subtitle: Text(ex['bodyPart']?.toString() ?? '', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                          onTap: () => Navigator.pop(context, ex),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
