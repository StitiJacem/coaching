import 'package:flutter/material.dart';

class AuthHeader extends StatelessWidget {
  final String title;
  final String subtitle;
  const AuthHeader({super.key, required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: theme.textTheme.headlineMedium),
        if (subtitle.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(subtitle, style: theme.textTheme.bodyMedium?.copyWith(
            color: const Color(0xFF9CA3AF),
          )),
        ],
      ],
    );
  }
}
