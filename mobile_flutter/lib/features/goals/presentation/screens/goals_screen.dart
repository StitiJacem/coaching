import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class GoalsScreen extends StatelessWidget {
  const GoalsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Goals'),
      ),
      body: const Center(
        child: Text('Goals Screen (To be implemented)', style: TextStyle(color: AppColors.textMuted)),
      ),
    );
  }
}
