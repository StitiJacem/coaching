import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../shared/providers/auth_provider.dart';



class AppShell extends ConsumerWidget {
  final Widget child;
  const AppShell({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final role = ref.watch(userRoleProvider);
    final location = GoRouterState.of(context).uri.toString();

    final navItems = _navItemsFor(role);
    final currentIndex = _indexFor(location, navItems);

    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppColors.surface,
          border: Border(top: BorderSide(color: AppColors.cardBorder, width: 1)),
        ),
        child: SafeArea(
          child: SizedBox(
            height: 64,
            child: Row(
              children: List.generate(navItems.length, (i) {
                final item = navItems[i];
                final selected = i == currentIndex;
                return Expanded(
                  child: InkWell(
                    onTap: () => context.go(item.path),
                    borderRadius: BorderRadius.circular(12),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 4),
                            decoration: BoxDecoration(
                              color: selected
                                  ? AppColors.primary.withValues(alpha: 0.15)
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Icon(
                              item.icon,
                              size: 22,
                              color: selected
                                  ? AppColors.primary
                                  : AppColors.textMuted,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            item.label,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: selected
                                  ? FontWeight.w600
                                  : FontWeight.normal,
                              color: selected
                                  ? AppColors.primary
                                  : AppColors.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }

  int _indexFor(String location, List<_NavItem> items) {
    for (int i = 0; i < items.length; i++) {
      if (location.startsWith(items[i].path)) return i;
    }
    return 0;
  }

  List<_NavItem> _navItemsFor(String role) {
    switch (role) {
      case AppConstants.roleCoach:
        return [
          _NavItem(Icons.dashboard_rounded, 'Home', '/dashboard'),
          _NavItem(Icons.people_alt_rounded, 'Athletes', '/athletes'),
          _NavItem(Icons.fitness_center_rounded, 'Programs', '/programs'),
          _NavItem(Icons.calendar_month_rounded, 'Schedule', '/schedule'),
          _NavItem(Icons.bar_chart_rounded, 'Analytics', '/analytics'),
        ];
      case AppConstants.roleAthlete:
      default:
        return [
          _NavItem(Icons.dashboard_rounded, 'Home', '/dashboard'),
          _NavItem(Icons.calendar_month_rounded, 'Schedule', '/schedule'),
          _NavItem(Icons.fitness_center_rounded, 'Programs', '/programs'),
          _NavItem(Icons.flag_rounded, 'Goals', '/goals'),
          _NavItem(Icons.person_rounded, 'Profile', '/profile'),
        ];
    }
  }
}

class _NavItem {
  final IconData icon;
  final String label;
  final String path;
  _NavItem(this.icon, this.label, this.path);
}
