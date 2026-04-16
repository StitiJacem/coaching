import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class WorkoutPlayerScreen extends StatelessWidget {
  final int workoutLogId;
  const WorkoutPlayerScreen({super.key, required this.workoutLogId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Workout Player'),
      ),
      body: Center(
        child: Text('Workout Player Screen: Log ID $workoutLogId\n(To be implemented)', 
          style: const TextStyle(color: AppColors.textMuted),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}
