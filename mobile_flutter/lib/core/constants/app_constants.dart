class AppConstants {
  // ── API ──────────────────────────────────────────────────────────────────
  // Android emulator → host machine localhost
  static const String baseUrl = 'http://10.0.2.2:3000/api';
  // For physical device on same WiFi, replace with your machine's local IP:
  // static const String baseUrl = 'http://192.168.x.x:3000/api';

  static const int connectTimeout = 15000; // ms
  static const int receiveTimeout = 30000; // ms

  // ── Storage Keys ──────────────────────────────────────────────────────────
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';

  // ── App Info ──────────────────────────────────────────────────────────────
  static const String appName = 'GOSPORT';

  // ── Roles ─────────────────────────────────────────────────────────────────
  static const String roleAthlete = 'athlete';
  static const String roleCoach = 'coach';
  static const String roleDoctor = 'doctor';
  static const String roleNutritionist = 'nutritionist';
  static const String roleManager = 'manager';

  // ── Program statuses ──────────────────────────────────────────────────────
  static const String programDraft = 'draft';
  static const String programAssigned = 'assigned';
  static const String programActive = 'active';
  static const String programQuit = 'quit';
  static const String programDeclined = 'declined';
  static const String programReplaced = 'replaced';

  // ── Session statuses ──────────────────────────────────────────────────────
  static const String sessionUpcoming = 'upcoming';
  static const String sessionCompleted = 'completed';
  static const String sessionMissed = 'missed';

  // ── Workout log statuses ──────────────────────────────────────────────────
  static const String logScheduled = 'scheduled';
  static const String logInProgress = 'in_progress';
  static const String logCompleted = 'completed';
  static const String logMissed = 'missed';

  // ── Connection request statuses ───────────────────────────────────────────
  static const String reqPending = 'pending';
  static const String reqAccepted = 'accepted';
  static const String reqRejected = 'rejected';
}
