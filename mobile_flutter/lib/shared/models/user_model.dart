import 'package:equatable/equatable.dart';

class UserModel extends Equatable {
  final int id;
  final String email;
  final String username;
  final String firstName;
  final String lastName;
  final String role;
  final String gender;
  final int age;
  final bool emailVerified;
  final bool onboardingCompleted;
  final String? profilePicture;

  const UserModel({
    required this.id,
    required this.email,
    required this.username,
    required this.firstName,
    required this.lastName,
    required this.role,
    this.gender = 'male',
    this.age = 20,
    required this.emailVerified,
    required this.onboardingCompleted,
    this.profilePicture,
  });

  String get fullName {
    final n = '$firstName $lastName'.trim();
    return n.isNotEmpty ? n : username;
  }

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: json['id'] as int,
        email: json['email'] as String? ?? '',
        username: json['username'] as String? ?? '',
        firstName: json['first_name'] as String? ?? '',
        lastName: json['last_name'] as String? ?? '',
        role: json['role'] as String? ?? 'athlete',
        gender: json['gender'] as String? ?? 'male',
        age: json['age'] as int? ?? 20,
        // Backend returns `is_verified` for registration and `profile_completed` for onboarding
        emailVerified: (json['is_verified'] as bool?) ??
            (json['email_verified'] as bool?) ??
            false,
        onboardingCompleted: (json['profile_completed'] as bool?) ??
            (json['onboarding_completed'] as bool?) ??
            false,
        profilePicture: json['photo_url'] as String? ?? json['profilePicture'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'username': username,
        'first_name': firstName,
        'last_name': lastName,
        'role': role,
        'gender': gender,
        'age': age,
        'email_verified': emailVerified,
        'onboarding_completed': onboardingCompleted,
        'profilePicture': profilePicture,
      };

  UserModel copyWith({
    int? id,
    String? email,
    String? username,
    String? firstName,
    String? lastName,
    String? role,
    String? gender,
    int? age,
    bool? emailVerified,
    bool? onboardingCompleted,
    String? profilePicture,
  }) =>
      UserModel(
        id: id ?? this.id,
        email: email ?? this.email,
        username: username ?? this.username,
        firstName: firstName ?? this.firstName,
        lastName: lastName ?? this.lastName,
        role: role ?? this.role,
        gender: gender ?? this.gender,
        age: age ?? this.age,
        emailVerified: emailVerified ?? this.emailVerified,
        onboardingCompleted: onboardingCompleted ?? this.onboardingCompleted,
        profilePicture: profilePicture ?? this.profilePicture,
      );

  @override
  List<Object?> get props => [id, email, role, emailVerified, onboardingCompleted, gender, age];
}
