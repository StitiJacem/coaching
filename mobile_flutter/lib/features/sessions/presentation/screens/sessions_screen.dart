import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class SessionsScreen extends StatelessWidget {
  const SessionsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Sessions'),
      ),
      body: const Center(
        child: Text('Sessions Screen (To be implemented)', style: TextStyle(color: AppColors.textMuted)),
      ),
    );
  }
}
