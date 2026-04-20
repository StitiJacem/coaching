import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/athletes_repository.dart';

class DiscoveryScreen extends ConsumerStatefulWidget {
  const DiscoveryScreen({super.key});

  @override
  ConsumerState<DiscoveryScreen> createState() => _DiscoveryScreenState();
}

class _DiscoveryScreenState extends ConsumerState<DiscoveryScreen> {
  List<dynamic> _coaches = [];
  bool _loading = true;
  final _searchCtrl = TextEditingController();
  final Set<int> _requesting = {};
  final Set<int> _requested = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _coaches = await ref
          .read(athletesRepositoryProvider)
          .searchCoaches(query: _searchCtrl.text.trim());
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
                    Text('FIND YOUR', style: TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.5)),
                    Text('SPECIALIST', style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 22,
                        fontWeight: FontWeight.w800)),
                  ],
                ),
                bottom: PreferredSize(
                  preferredSize: const Size.fromHeight(60),
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                    child: TextField(
                      controller: _searchCtrl,
                      onSubmitted: (_) => _load(),
                      style: const TextStyle(color: AppColors.textPrimary),
                      decoration: InputDecoration(
                        hintText: 'Search by name or specialization...',
                        prefixIcon: const Icon(Icons.search_rounded,
                            color: AppColors.textMuted, size: 20),
                        suffixIcon: IconButton(
                          icon: const Icon(Icons.tune_rounded,
                              color: AppColors.textMuted, size: 20),
                          onPressed: _load,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: AppColors.cardBorder),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              if (_loading)
                const SliverFillRemaining(
                  child: Center(
                      child: CircularProgressIndicator(color: AppColors.primary)),
                )
              else if (_coaches.isEmpty)
                SliverFillRemaining(
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.all(40),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.search_off_rounded,
                              color: AppColors.textMuted, size: 52),
                          const SizedBox(height: 16),
                          const Text('No coaches found',
                              style: TextStyle(
                                  color: AppColors.textPrimary,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700)),
                          const SizedBox(height: 8),
                          const Text('Try a different search term.',
                              style: TextStyle(
                                  color: AppColors.textMuted, fontSize: 13)),
                          const SizedBox(height: 20),
                          TextButton(
                            onPressed: () {
                              _searchCtrl.clear();
                              _load();
                            },
                            child: const Text('Clear search',
                                style: TextStyle(color: AppColors.primary)),
                          ),
                        ],
                      ),
                    ),
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.all(16),
                  sliver: SliverGrid(
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 0.78,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (context, i) => _CoachCard(
                        coach: _coaches[i],
                        isRequesting: _requesting.contains(_coaches[i]['id']),
                        isRequested: _requested.contains(_coaches[i]['id']),
                        onConnect: () => _connect(_coaches[i]),
                      ),
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

  Future<void> _connect(Map<String, dynamic> coach) async {
    final id = coach['id'] as int;
    if (_requested.contains(id)) return;
    setState(() => _requesting.add(id));
    try {
      await ref.read(athletesRepositoryProvider).sendConnectionRequest(id,
          message: 'I would like to connect with you to improve my performance.');
      setState(() {
        _requesting.remove(id);
        _requested.add(id);
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Connection request sent!'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _requesting.remove(id));
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Error: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }
}

class _CoachCard extends StatelessWidget {
  final Map<String, dynamic> coach;
  final bool isRequesting;
  final bool isRequested;
  final VoidCallback onConnect;

  const _CoachCard({
    required this.coach,
    required this.isRequesting,
    required this.isRequested,
    required this.onConnect,
  });

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
    final athleteCount = coach['athleteCount'] ?? 0;
    final isConnected = coach['isConnected'] == true;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isConnected
              ? AppColors.success.withValues(alpha: 0.4)
              : AppColors.cardBorder,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Avatar
          Center(
            child: Container(
              width: 54,
              height: 54,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(initial,
                    style: const TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w800,
                        fontSize: 22)),
              ),
            ),
          ),
          const SizedBox(height: 10),
          Text(name,
              style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w700,
                  fontSize: 13),
              maxLines: 1,
              overflow: TextOverflow.ellipsis),
          const SizedBox(height: 2),
          Text(specLabel,
              style: const TextStyle(
                  color: AppColors.accent,
                  fontSize: 10,
                  fontWeight: FontWeight.w700),
              maxLines: 1,
              overflow: TextOverflow.ellipsis),
          const SizedBox(height: 4),
          Text('$athleteCount athletes',
              style: const TextStyle(
                  color: AppColors.textMuted, fontSize: 11)),
          const Spacer(),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: isConnected
                ? Container(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: AppColors.success.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                          color: AppColors.success.withValues(alpha: 0.3)),
                    ),
                    child: const Center(
                      child: Text('Connected ✓',
                          style: TextStyle(
                              color: AppColors.success,
                              fontWeight: FontWeight.w700,
                              fontSize: 12)),
                    ),
                  )
                : isRequested
                    ? Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: AppColors.info.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Center(
                          child: Text('Request Sent',
                              style: TextStyle(
                                  color: AppColors.info,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 12)),
                        ),
                      )
                    : ElevatedButton(
                        onPressed: isRequesting ? null : onConnect,
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size(0, 38),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10)),
                        ),
                        child: isRequesting
                            ? const SizedBox(
                                width: 16, height: 16,
                                child: CircularProgressIndicator(
                                    color: Colors.white, strokeWidth: 2))
                            : const Text('Connect',
                                style: TextStyle(
                                    fontWeight: FontWeight.w700, fontSize: 12)),
                      ),
          ),
        ],
      ),
    );
  }
}
