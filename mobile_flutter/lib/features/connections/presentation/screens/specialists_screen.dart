import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/animate_in.dart';
import '../../data/athletes_repository.dart';

class SpecialistsScreen extends ConsumerStatefulWidget {
  const SpecialistsScreen({super.key});

  @override
  ConsumerState<SpecialistsScreen> createState() => _SpecialistsScreenState();
}

class _SpecialistsScreenState extends ConsumerState<SpecialistsScreen> {
  bool _loading = true;
  List<dynamic> _specialists = [];

  @override
  void initState() {
    super.initState();
    _loadSpecialists();
  }

  Future<void> _loadSpecialists() async {
    setState(() => _loading = true);
    try {
      final repo = ref.read(athletesRepositoryProvider);
      final data = await repo.getConnectedSpecialists();
      if (mounted) {
        setState(() {
          _specialists = data;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading specialists: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: _loadSpecialists,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // ─── App Bar ──────────────────────────────────────────────────
            SliverAppBar(
              expandedHeight: 120,
              pinned: true,
              stretch: true,
              backgroundColor: AppColors.background,
              elevation: 0,
              flexibleSpace: FlexibleSpaceBar(
                centerTitle: false,
                titlePadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                title: const Text(
                  'My Specialists',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.5,
                  ),
                ),
                background: Stack(
                  children: [
                    Positioned(
                      right: -30,
                      top: -20,
                      child: Icon(
                        Icons.verified_user_rounded,
                        size: 150,
                        color: AppColors.primary.withValues(alpha: 0.05),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ─── Content ──────────────────────────────────────────────────
            if (_loading)
              const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
              )
            else if (_specialists.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.people_outline_rounded, size: 64, color: AppColors.textMuted.withValues(alpha: 0.5)),
                      const SizedBox(height: 16),
                      const Text(
                        'No connected specialists',
                        style: TextStyle(color: AppColors.textMuted, fontSize: 16, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton.icon(
                        onPressed: () => context.push('/discovery'),
                        icon: const Icon(Icons.search_rounded),
                        label: const Text('FIND A COACH'),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          backgroundColor: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final specialist = _specialists[index];
                      return AnimateIn(
                        delay: index * 100,
                        child: _SpecialistCard(specialist: specialist),
                      );
                    },
                    childCount: _specialists.length,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _SpecialistCard extends StatelessWidget {
  final dynamic specialist;
  const _SpecialistCard({required this.specialist});

  @override
  Widget build(BuildContext context) {
    final name = specialist['name'] ?? 'Specialist';
    final type = (specialist['type'] ?? 'coach').toString().toUpperCase();
    final spec = specialist['specialization'] ?? 'Performance';
    final bio = specialist['bio'] ?? '';
    final avatar = specialist['avatar'];
    final rating = double.tryParse(specialist['rating']?.toString() ?? '4.5') ?? 4.5;
    final experience = specialist['experience'] ?? 0;
    
    final isCoach = specialist['type'] == 'coach';
    final roleColor = isCoach ? AppColors.roleCoach : AppColors.roleNutritionist;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.cardBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () {}, // Could go to profile
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      // Avatar
                      Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: roleColor.withValues(alpha: 0.3), width: 2),
                          image: avatar != null
                              ? DecorationImage(image: NetworkImage(avatar), fit: BoxFit.cover)
                              : null,
                        ),
                        child: avatar == null
                            ? Icon(Icons.person_rounded, color: roleColor, size: 30)
                            : null,
                      ),
                      const SizedBox(width: 16),
                      // Name & Role
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    name,
                                    style: const TextStyle(
                                      color: AppColors.textPrimary,
                                      fontSize: 18,
                                      fontWeight: FontWeight.w800,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: roleColor.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: roleColor.withValues(alpha: 0.2)),
                                  ),
                                  child: Text(
                                    type,
                                    style: TextStyle(
                                      color: roleColor,
                                      fontSize: 9,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              spec,
                              style: TextStyle(
                                color: roleColor.withValues(alpha: 0.8),
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Bio
                  Text(
                    bio,
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 20),
                  // Stats & Action
                  Row(
                    children: [
                      _StatItem(icon: Icons.star_rounded, label: rating.toString(), color: Colors.amber),
                      const SizedBox(width: 16),
                      _StatItem(icon: Icons.work_history_rounded, label: '$experience yrs', color: AppColors.info),
                      const Spacer(),
                      ElevatedButton(
                        onPressed: () {
                          final targetId = specialist['userId']?.toString();
                          if (targetId != null) {
                            context.push('/chat/$targetId');
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          minimumSize: const Size(100, 40),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 0,
                        ),
                        child: const Text(
                          'MESSAGE',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.5),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _StatItem({required this.icon, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(color: AppColors.textPrimary, fontSize: 12, fontWeight: FontWeight.w700),
        ),
      ],
    );
  }
}
