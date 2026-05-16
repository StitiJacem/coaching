import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/athletes_repository.dart';
import '../../../../shared/widgets/animate_in.dart';

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
      _coaches = await ref.read(athletesRepositoryProvider).searchCoaches(query: _searchCtrl.text.trim());
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
          backgroundColor: AppColors.background,
          onRefresh: _load,
          child: CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              SliverAppBar(
                floating: true,
                backgroundColor: Colors.transparent,
                elevation: 0,
                centerTitle: false,
                title: const Text('DISCOVERY', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -1)),
                bottom: PreferredSize(
                  preferredSize: const Size.fromHeight(80),
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
                    child: AppTheme.glassCard(
                      opacity: 0.1,
                      child: TextField(
                        controller: _searchCtrl,
                        onSubmitted: (_) => _load(),
                        style: const TextStyle(color: Colors.white, fontSize: 14),
                        decoration: InputDecoration(
                          hintText: 'Search specialists...',
                          hintStyle: const TextStyle(color: Colors.white38),
                          prefixIcon: const Icon(Icons.search_rounded, color: AppColors.primary, size: 20),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              if (_loading)
                const SliverFillRemaining(child: Center(child: CircularProgressIndicator(color: AppColors.primary)))
              else if (_coaches.isEmpty)
                SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.radar_rounded, color: Colors.white10, size: 80),
                        const SizedBox(height: 24),
                        const Text('NO OPERATIVES FOUND', style: TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 2)),
                      ],
                    ),
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.all(24),
                  sliver: SliverGrid(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, mainAxisSpacing: 16, crossAxisSpacing: 16, childAspectRatio: 0.7),
                    delegate: SliverChildBuilderDelegate(
                      (context, i) => AnimateIn(
                        delay: i * 50,
                        child: _CoachCard(
                          coach: _coaches[i],
                          isRequesting: _requesting.contains(_coaches[i]['id']),
                          isRequested: _requested.contains(_coaches[i]['id']),
                          onConnect: () => _connect(_coaches[i]),
                        ),
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
      await ref.read(athletesRepositoryProvider).sendConnectionRequest(id, message: 'I am ready to elevate my training under your guidance.');
      setState(() { _requesting.remove(id); _requested.add(id); });
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('✓ REQUEST BROADCASTED'), backgroundColor: AppColors.success, behavior: SnackBarBehavior.floating));
    } catch (e) {
      if (mounted) {
        setState(() => _requesting.remove(id));
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('ERROR: $e'), backgroundColor: AppColors.error));
      }
    }
  }
}

class _CoachCard extends StatelessWidget {
  final Map<String, dynamic> coach;
  final bool isRequesting;
  final bool isRequested;
  final VoidCallback onConnect;

  const _CoachCard({required this.coach, required this.isRequesting, required this.isRequested, required this.onConnect});

  @override
  Widget build(BuildContext context) {
    final firstName = coach['user']?['first_name'] ?? coach['first_name'] ?? '';
    final lastName = coach['user']?['last_name'] ?? coach['last_name'] ?? '';
    final name = '$firstName $lastName'.trim();
    final initial = name.isNotEmpty ? name[0].toUpperCase() : 'C';
    final specs = coach['specializations'] as List? ?? [];
    final specLabel = specs.isNotEmpty ? specs.first['specialization'] ?? 'PRO COACH' : 'PRO COACH';
    final isConnected = coach['isConnected'] == true;

    return AppTheme.glassCard(
      opacity: 0.05,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Container(
              width: 64, height: 64,
              decoration: BoxDecoration(shape: BoxShape.circle, gradient: LinearGradient(colors: [AppColors.primary.withValues(alpha: 0.2), AppColors.background])),
              child: Center(child: Text(initial, style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w900, fontSize: 24))),
            ),
            const SizedBox(height: 16),
            Text(name.toUpperCase(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: -0.5), maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 4),
            Text(specLabel.toString().toUpperCase(), style: const TextStyle(color: AppColors.primary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1), maxLines: 1, overflow: TextOverflow.ellipsis),
            const Spacer(),
            if (isConnected) _StatusPill(label: 'CONNECTED', color: AppColors.success)
            else if (isRequested) _StatusPill(label: 'SENT', color: AppColors.warning)
            else ElevatedButton(
              onPressed: isRequesting ? null : onConnect,
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.black, minimumSize: const Size(double.infinity, 40), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
              child: isRequesting ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2)) : const Text('JOIN', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 1)),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  final String label;
  final Color color;
  const _StatusPill({required this.label, required this.color});
  @override
  Widget build(BuildContext context) {
    return Container(width: double.infinity, padding: const EdgeInsets.symmetric(vertical: 10), decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12), border: Border.all(color: color.withValues(alpha: 0.3))), child: Center(child: Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 1))));
  }
}

