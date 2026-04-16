import 'package:equatable/equatable.dart';

class UserModel extends Equatable {
  final int id;
  final String email;
  final String username;
  final String firstName;
  final String lastName;
  final String role;
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
        emailVerified: json['email_verified'] as bool? ?? false,
        onboardingCompleted: json['onboarding_completed'] as bool? ?? false,
        profilePicture: json['profilePicture'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'username': username,
        'first_name': firstName,
        'last_name': lastName,
        'role': role,
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
        emailVerified: emailVerified ?? this.emailVerified,
        onboardingCompleted: onboardingCompleted ?? this.onboardingCompleted,
        profilePicture: profilePicture ?? this.profilePicture,
      );

  @override
  List<Object?> get props => [id, email, role, emailVerified, onboardingCompleted];
}
