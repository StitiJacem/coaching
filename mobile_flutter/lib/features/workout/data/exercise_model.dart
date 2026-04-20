import 'package:equatable/equatable.dart';

class Exercise extends Equatable {
  final String id;
  final String name;
  final String bodyPart;
  final String equipment;
  final String gifUrl;
  final String target;
  final List<String> secondaryMuscles;
  final List<String> instructions;
  final String? videoId;
  final String? videoTitle;

  const Exercise({
    required this.id,
    required this.name,
    required this.bodyPart,
    required this.equipment,
    required this.gifUrl,
    required this.target,
    required this.secondaryMuscles,
    required this.instructions,
    this.videoId,
    this.videoTitle,
  });

  factory Exercise.fromJson(Map<String, dynamic> json) {
    return Exercise(
      id: (json['id'] ?? '').toString(),
      name: json['name'] ?? '',
      bodyPart: json['bodyPart'] ?? '',
      equipment: json['equipment'] ?? '',
      gifUrl: json['gifUrl'] ?? '',
      target: json['target'] ?? '',
      secondaryMuscles: List<String>.from(json['secondaryMuscles'] ?? []),
      instructions: List<String>.from(json['instructions'] ?? []),
      videoId: json['videoId'],
      videoTitle: json['videoTitle'],
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
      'videoId': videoId,
      'videoTitle': videoTitle,
    };
  }

  @override
  List<Object?> get props => [id, name, bodyPart];
}
