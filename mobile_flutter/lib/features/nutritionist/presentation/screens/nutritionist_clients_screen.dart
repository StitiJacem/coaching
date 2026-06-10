import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../shared/providers/auth_provider.dart';
import '../../../../shared/widgets/animate_in.dart';
import '../../data/nutritionist_repository.dart';
import '../widgets/client_card.dart';

class NutritionistClientsScreen extends ConsumerStatefulWidget {
  const NutritionistClientsScreen({super.key});

  @override
  ConsumerState<NutritionistClientsScreen> createState() =>
      _NutritionistClientsScreenState();
}

class _NutritionistClientsScreenState
    extends ConsumerState<NutritionistClientsScreen> {
  bool _loading = true;
  List<dynamic> _clients = [];
  List<dynamic> _filtered = [];
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
    _searchController.addListener(_onSearch);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final user = ref.read(currentUserProvider);
      if (user == null) return;
      final repo = ref.read(nutritionistRepositoryProvider);

      final profile = await repo.getMyProfile();
      final nutritionistId = profile['id']?.toString() ?? user.id.toString();
      final clients = await repo.getClients(nutritionistId);

      if (mounted) {
        setState(() {
          _clients = clients;
          _filtered = clients;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Error loading clients: $e'),
              backgroundColor: AppColors.error),
        );
      }
    }
  }

  void _onSearch() {
    final q = _searchController.text.toLowerCase();
    setState(() {
      if (q.isEmpty) {
        _filtered = _clients;
      } else {
        _filtered = _clients.where((c) {
          final athlete = c['athlete'] as Map<String, dynamic>?;
          final user = athlete?['user'] as Map<String, dynamic>? ??
              c['user'] as Map<String, dynamic>? ??
              c;
          final firstName = user['first_name'] ?? user['firstName'] ?? '';
          final lastName = user['last_name'] ?? user['lastName'] ?? '';
          final name = '$firstName $lastName'.toLowerCase();
          final email = (user['email'] ?? '').toString().toLowerCase();
          return name.contains(q) || email.contains(q);
        }).toList();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        color: AppColors.roleNutritionist,
        onRefresh: _load,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // ── App Bar ─────────────────────────────────────────────────────
            SliverAppBar(
              pinned: true,
              expandedHeight: 130,
              backgroundColor: AppColors.background,
              surfaceTintColor: Colors.transparent,
              elevation: 0,
              flexibleSpace: FlexibleSpaceBar(
                titlePadding:
                    const EdgeInsets.fromLTRB(20, 0, 20, 12),
                centerTitle: false,
                title: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'NUTRITIONNISTE',
                      style: TextStyle(
                          color: AppColors.roleNutritionist,
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.5),
                    ),
                    Text(
                      'MES CLIENTS',
                      style: GoogleFonts.bebasNeue(
                        color: AppColors.textPrimary,
                        fontSize: 28,
                        letterSpacing: 2,
                        height: 1.0,
                      ),
                    ),
                  ],
                ),
                background: Positioned(
                  right: -30,
                  top: -20,
                  child: Icon(
                    Icons.people_alt_rounded,
                    size: 180,
                    color: AppColors.roleNutritionist.withValues(alpha: 0.04),
                  ),
                ),
              ),
              actions: [
                Padding(
                  padding: const EdgeInsets.only(right: 16),
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.roleNutritionist.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                          color:
                              AppColors.roleNutritionist.withValues(alpha: 0.2)),
                    ),
                    child: Text(
                      '${_clients.length} clients',
                      style: const TextStyle(
                        color: AppColors.roleNutritionist,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ],
            ),

            // ── Search Bar ───────────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: TextField(
                  controller: _searchController,
                  style: const TextStyle(color: AppColors.textPrimary),
                  decoration: InputDecoration(
                    hintText: 'Rechercher un client...',
                    hintStyle: const TextStyle(color: AppColors.textMuted),
                    prefixIcon: const Icon(Icons.search_rounded,
                        color: AppColors.textMuted, size: 20),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.close_rounded,
                                color: AppColors.textMuted, size: 18),
                            onPressed: () => _searchController.clear(),
                          )
                        : null,
                    filled: true,
                    fillColor: AppColors.card,
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 12),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide:
                          const BorderSide(color: AppColors.cardBorder),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide:
                          const BorderSide(color: AppColors.cardBorder),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(
                          color: AppColors.roleNutritionist, width: 1.5),
                    ),
                  ),
                ),
              ),
            ),

            // ── Content ──────────────────────────────────────────────────────
            if (_loading)
              const SliverFillRemaining(
                child: Center(
                    child: CircularProgressIndicator(
                        color: AppColors.roleNutritionist)),
              )
            else if (_filtered.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.person_off_outlined,
                          size: 64,
                          color:
                              AppColors.textMuted.withValues(alpha: 0.4)),
                      const SizedBox(height: 16),
                      Text(
                        _clients.isEmpty
                            ? 'Aucun client connecté'
                            : 'Aucun résultat',
                        style: const TextStyle(
                            color: AppColors.textMuted,
                            fontSize: 16,
                            fontWeight: FontWeight.w600),
                      ),
                      if (_clients.isEmpty) ...[
                        const SizedBox(height: 8),
                        const Text(
                          'Les athlètes peuvent vous envoyer\nune demande de connexion',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                              color: AppColors.textMuted, fontSize: 13),
                        ),
                      ],
                    ],
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 40),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final client = _filtered[index];
                      return AnimateIn(
                        delay: index * 60,
                        child: ClientCard(
                          client: client as Map<String, dynamic>,
                          onTap: () {
                            final athlete = client['athlete'] as Map<String, dynamic>?;
                            final athleteId = athlete?['id']?.toString();
                            if (athleteId != null) {
                              context.push(
                                  '/nutritionist/clients/$athleteId');
                            }
                          },
                        ),
                      );
                    },
                    childCount: _filtered.length,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
