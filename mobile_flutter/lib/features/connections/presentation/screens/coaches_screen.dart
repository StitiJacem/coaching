import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/athletes_repository.dart';

class CoachesScreen extends ConsumerStatefulWidget {
  const CoachesScreen({super.key});

  @override
  ConsumerState<CoachesScreen> createState() => _CoachesScreenState();
}

class _CoachesScreenState extends ConsumerState<CoachesScreen> {
  List<dynamic> _coaches = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      // Athletes see their connected coaches via /coaches/all filtered to connected
      final repo = ref.read(athletesRepositoryProvider);
      final all = await repo.searchCoaches();
      _coaches = all.where((c) => c['isConnected'] == true).toList();
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.primary,
          backgroundColor: AppColors.surface,
          onRefresh: _load,
          child: CustomScrollView(
            slivers: [
              SliverAppBar(
                floating: true,
                backgroundColor: AppColors.background,
                surfaceTintColor: Colors.transparent,
                titleSpacing: 16,
                title: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('MY COACHES',
                        style: TextStyle(
                            color: AppColors.textMuted,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 1.5)),
                    Text('COACHING TEAM',
                        style: TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 22,
                            fontWeight: FontWeight.w800)),
                  ],
                ),
                actions: [
                  Padding(
                    padding: const EdgeInsets.only(right: 16),
                    child: TextButton.icon(
                      onPressed: () => context.push('/discovery'),
                      icon: const Icon(Icons.search_rounded,
                          color: AppColors.primary, size: 18),
                      label: const Text('Find Coach',
                          style: TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w700,
                              fontSize: 13)),
                    ),
                  ),
                ],
              ),
              if (_loading)
                const SliverFillRemaining(
                  child: Center(
                      child:
                          CircularProgressIndicator(color: AppColors.primary)),
                )
              else if (_coaches.isEmpty)
                SliverFillRemaining(
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.all(40),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            width: 80,
                            height: 80,
                            decoration: BoxDecoration(
                              color: AppColors.surfaceVariant,
                              borderRadius: BorderRadius.circular(24),
                            ),
                            child: const Icon(Icons.sports_rounded,
                                color: AppColors.textMuted, size: 38),
                          ),
                          const SizedBox(height: 20),
                          const Text("No Coaches Yet",
                              style: TextStyle(
                                  color: AppColors.textPrimary,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700)),
                          const SizedBox(height: 8),
                          const Text(
                            "Find a coach to guide your training journey.",
                            style: TextStyle(
                                color: AppColors.textMuted, fontSize: 13),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 24),
                          ElevatedButton.icon(
                            onPressed: () => context.push('/discovery'),
                            icon: const Icon(Icons.search_rounded, size: 18),
                            label: const Text('Find a Coach'),
                          ),
                        ],
                      ),
                    ),
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.all(16),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, i) => _CoachTile(coach: _coaches[i]),
                      childCount: _coaches.length,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CoachTile extends StatelessWidget {
  final Map<String, dynamic> coach;
  const _CoachTile({required this.coach});

  @override
  Widget build(BuildContext context) {
    final firstName = coach['user']?['first_name'] ?? coach['first_name'] ?? '';
    final lastName = coach['user']?['last_name'] ?? coach['last_name'] ?? '';
    final name = '$firstName $lastName'.trim();
    final initial = name.isNotEmpty ? name[0].toUpperCase() : 'C';
    final specs = coach['specializations'] as List? ?? [];
    final specLabel = specs.isNotEmpty
        ? specs.first['specialization'] ?? 'Performance Coach'
        : 'Performance Coach';
    final email = coach['user']?['email'] ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          // Avatar
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(initial,
                  style: const TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w800,
                      fontSize: 20)),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Coach $name',
                    style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w700,
                        fontSize: 15)),
                const SizedBox(height: 2),
                Text(specLabel,
                    style: const TextStyle(
                        color: AppColors.accent,
                        fontSize: 11,
                        fontWeight: FontWeight.w700)),
                const SizedBox(height: 2),
                Text(email,
                    style: const TextStyle(
                        color: AppColors.textMuted, fontSize: 11),
                    overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
          // Message button
          IconButton(
            onPressed: () =>
                context.push('/messages?userId=${coach['user']?['id']}'),
            icon: Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.chat_bubble_outline_rounded,
                  color: AppColors.primary, size: 18),
            ),
          ),
        ],
      ),
    );
  }
}
