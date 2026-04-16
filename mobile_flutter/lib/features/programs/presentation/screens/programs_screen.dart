import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class ProgramsScreen extends StatelessWidget {
  const ProgramsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Programs'),
      ),
      body: const Center(
        child: Text('Programs Screen (To be implemented)', style: TextStyle(color: AppColors.textMuted)),
      ),
    );
  }
}
