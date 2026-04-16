class AppConstants {


  static const String baseUrl = 'http://10.0.2.2:3000/api';



  static const int connectTimeout = 15000;
  static const int receiveTimeout = 30000;


  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';


  static const String appName = 'GOSPORT';


  static const String roleAthlete = 'athlete';
  static const String roleCoach = 'coach';
  static const String roleDoctor = 'doctor';
  static const String roleNutritionist = 'nutritionist';
  static const String roleManager = 'manager';


  static const String programDraft = 'draft';
  static const String programAssigned = 'assigned';
  static const String programActive = 'active';
  static const String programQuit = 'quit';
  static const String programDeclined = 'declined';
  static const String programReplaced = 'replaced';


  static const String sessionUpcoming = 'upcoming';
  static const String sessionCompleted = 'completed';
  static const String sessionMissed = 'missed';


  static const String logScheduled = 'scheduled';
  static const String logInProgress = 'in_progress';
  static const String logCompleted = 'completed';
  static const String logMissed = 'missed';


  static const String reqPending = 'pending';
  static const String reqAccepted = 'accepted';
  static const String reqRejected = 'rejected';
}
