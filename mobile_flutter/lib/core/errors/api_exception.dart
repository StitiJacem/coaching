class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException({required this.message, this.statusCode});

  factory ApiException.fromDioError(dynamic error) {
    if (error.response != null) {
      final data = error.response?.data;
      String msg = 'An error occurred';
      if (data is Map && data['message'] != null) {
        msg = data['message'].toString();
      } else if (data is String) {
        msg = data;
      }
      return ApiException(
          message: msg, statusCode: error.response?.statusCode);
    }
    if (error.type.toString().contains('connectTimeout') ||
        error.type.toString().contains('receiveTimeout')) {
      return ApiException(message: 'Connection timed out. Check your network.');
    }
    return ApiException(message: 'Network error. Check your connection.');
  }

  @override
  String toString() => message;
}
