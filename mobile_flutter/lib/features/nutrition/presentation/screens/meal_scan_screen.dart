import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../../../core/theme/app_theme.dart';
import '../../data/nutrition_repository.dart';

class MealScanScreen extends ConsumerStatefulWidget {
  const MealScanScreen({super.key});

  @override
  ConsumerState<MealScanScreen> createState() => _MealScanScreenState();
}

class _MealScanScreenState extends ConsumerState<MealScanScreen> {
  final ImagePicker _picker = ImagePicker();
  File? _image;
  bool _analyzing = false;
  Map<String, dynamic>? _result;

  Future<void> _pickImage(ImageSource source) async {
    final pickedFile = await _picker.pickImage(
      source: source,
      maxWidth: 1000,
      maxHeight: 1000,
      imageQuality: 85,
    );

    if (pickedFile != null) {
      setState(() {
        _image = File(pickedFile.path);
        _result = null;
      });
      _analyzeImage();
    }
  }

  Future<void> _analyzeImage() async {
    if (_image == null) return;

    setState(() => _analyzing = true);
    try {
      final result = await ref.read(nutritionRepositoryProvider).analyzeMeal(_image!);
      setState(() => _result = result);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error analyzing image: $e')),
      );
    } finally {
      setState(() => _analyzing = false);
    }
  }

  Future<void> _saveMeal() async {
    if (_result == null) return;

    setState(() => _analyzing = true);
    try {
      await ref.read(nutritionRepositoryProvider).logMeal({
        'foodName': (_result!['detectedFoods'] as List).join(', '),
        'calories': _result!['nutrition']['calories'],
        'protein': _result!['nutrition']['protein'],
        'carbs': _result!['nutrition']['carbs'],
        'fat': _result!['nutrition']['fat'],
        'date': DateTime.now().toIso8601String(),
        'imagePath': _result!['imagePath'],
      });
      if (!mounted) return;
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error saving meal: $e')),
      );
    } finally {
      setState(() => _analyzing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('AI Meal Scanner',
            style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800)),
      ),
      body: Column(
        children: [
          Expanded(
            child: _image == null
                ? _buildPickerSelection()
                : _buildAnalysisView(),
          ),
          if (_result != null && !_analyzing)
            Padding(
              padding: const EdgeInsets.all(20),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _saveMeal,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: const Text('Save to Log',
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildPickerSelection() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(40),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.camera_alt_rounded, size: 80, color: AppColors.primary),
          ),
          const SizedBox(height: 32),
          const Text('Scan Your Meal',
              style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 24,
                  fontWeight: FontWeight.w900)),
          const SizedBox(height: 12),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 40),
            child: Text(
              'Our AI will analyze your photo to track calories and macronutrients automatically.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textMuted, fontSize: 16),
            ),
          ),
          const SizedBox(height: 48),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _PickerButton(
                icon: Icons.photo_library_rounded,
                label: 'Gallery',
                onTap: () => _pickImage(ImageSource.gallery),
              ),
              const SizedBox(width: 24),
              _PickerButton(
                icon: Icons.camera_rounded,
                label: 'Camera',
                onTap: () => _pickImage(ImageSource.camera),
                primary: true,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAnalysisView() {
    return SingleChildScrollView(
      child: Column(
        children: [
          // Image Preview
          Container(
            height: 300,
            width: double.infinity,
            margin: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              image: DecorationImage(image: FileImage(_image!), fit: BoxFit.cover),
            ),
            child: Stack(
              children: [
                if (_analyzing)
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.black45,
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: const Center(
                      child: CircularProgressIndicator(color: AppColors.primary),
                    ),
                  ),
              ],
            ),
          ),

          if (_result != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    (_result!['detectedFoods'] as List).join(', ').toUpperCase(),
                    style: const TextStyle(
                        color: AppColors.primary,
                        fontSize: 20,
                        fontWeight: FontWeight.w900),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Portion: ${_result!['portion']['estimate']}',
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 16),
                  ),
                  const SizedBox(height: 24),
                  
                  // Macros Grid
                  Row(
                    children: [
                      _MacroCard(
                        label: 'CALORIES',
                        value: '${_result!['nutrition']['calories']}',
                        unit: 'kcal',
                        color: AppColors.primary,
                      ),
                      const SizedBox(width: 12),
                      _MacroCard(
                        label: 'PROTEIN',
                        value: '${_result!['nutrition']['protein']}',
                        unit: 'g',
                        color: AppColors.success,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _MacroCard(
                        label: 'CARBS',
                        value: '${_result!['nutrition']['carbs']}',
                        unit: 'g',
                        color: AppColors.accent,
                      ),
                      const SizedBox(width: 12),
                      _MacroCard(
                        label: 'FAT',
                        value: '${_result!['nutrition']['fat']}',
                        unit: 'g',
                        color: AppColors.warning,
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  TextButton.icon(
                    onPressed: () => setState(() {
                      _image = null;
                      _result = null;
                    }),
                    icon: const Icon(Icons.refresh_rounded, color: AppColors.primary),
                    label: const Text('Scan Another', style: TextStyle(color: AppColors.primary)),
                  ),
                ],
              ),
            )
          else if (_analyzing)
            const Padding(
              padding: EdgeInsets.all(20),
              child: Text('Analyzing your meal...',
                  style: TextStyle(color: AppColors.textMuted, fontSize: 16)),
            ),
        ],
      ),
    );
  }
}

class _PickerButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool primary;

  const _PickerButton({
    required this.icon,
    required this.label,
    required this.onTap,
    this.primary = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: primary ? AppColors.primary : AppColors.surfaceVariant,
              borderRadius: BorderRadius.circular(24),
              boxShadow: primary
                  ? [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.3),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      )
                    ]
                  : null,
            ),
            child: Icon(icon, color: primary ? Colors.white : AppColors.textPrimary, size: 28),
          ),
          const SizedBox(height: 8),
          Text(label,
              style: TextStyle(
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w600,
                  fontSize: 14)),
        ],
      ),
    );
  }
}

class _MacroCard extends StatelessWidget {
  final String label;
  final String value;
  final String unit;
  final Color color;

  const _MacroCard({
    required this.label,
    required this.value,
    required this.unit,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label,
                style: TextStyle(
                    color: color,
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.5)),
            const SizedBox(height: 4),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(value,
                    style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 24,
                        fontWeight: FontWeight.w900)),
                const SizedBox(width: 2),
                Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Text(unit,
                      style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
