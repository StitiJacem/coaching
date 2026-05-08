import 'package:equatable/equatable.dart';
import 'package:coaching_mobile/core/constants/app_constants.dart';

class Exercise extends Equatable {
  final String id;
  final String name;
  final String bodyPart;
  final String equipment;
  final String gifUrl;
  final String target;
  final List<String> secondaryMuscles;
  final List<String> instructions;
  final String category;
  final String difficulty;
  final String mechanic;
  final String force;
  final double met;
  final double caloriesPerMinute;
  final String description;

  const Exercise({
    required this.id,
    required this.name,
    required this.bodyPart,
    required this.equipment,
    required this.gifUrl,
    required this.target,
    required this.secondaryMuscles,
    required this.instructions,
    required this.category,
    required this.difficulty,
    required this.mechanic,
    required this.force,
    required this.met,
    required this.caloriesPerMinute,
    required this.description,
  });

  factory Exercise.fromJson(Map<String, dynamic> json) {
    return Exercise(
      id: (json['id'] ?? '').toString(),
      name: json['name'] ?? '',
      bodyPart: json['bodyPart'] ?? '',
      equipment: json['equipment'] ?? '',
      gifUrl: _resolveGifUrl(json['gifUrl'] ?? ''),
      target: json['target'] ?? '',
      secondaryMuscles: List<String>.from(json['secondaryMuscles'] ?? []),
      instructions: List<String>.from(json['instructions'] ?? []),
      category: json['category'] ?? '',
      difficulty: json['difficulty'] ?? '',
      mechanic: json['mechanic'] ?? '',
      force: json['force'] ?? '',
      met: (json['met'] ?? 0.0).toDouble(),
      caloriesPerMinute: (json['caloriesPerMinute'] ?? 0.0).toDouble(),
      description: json['description'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'bodyPart': bodyPart,
      'equipment': equipment,
      'gifUrl': gifUrl,
      'target': target,
      'secondaryMuscles': secondaryMuscles,
      'instructions': instructions,
      'category': category,
      'difficulty': difficulty,
      'mechanic': mechanic,
      'force': force,
      'met': met,
      'caloriesPerMinute': caloriesPerMinute,
      'description': description,
    };
  }

  @override
  List<Object?> get props => [id, name, bodyPart];

  static String _resolveGifUrl(String url) {
    if (url.startsWith('/api')) {
      final host = AppConstants.baseUrl.replaceAll('/api', '');
      return '$host$url';
    }
    return url;
  }
}
