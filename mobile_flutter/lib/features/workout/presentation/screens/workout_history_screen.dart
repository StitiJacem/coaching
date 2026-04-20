import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class WorkoutHistoryScreen extends StatelessWidget {
  const WorkoutHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Workout History'),
      ),
      body: const Center(
        child: Text('Workout History Screen (To be implemented)', style: TextStyle(color: AppColors.textMuted)),
      ),
    );
  }
}
