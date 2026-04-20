package com.mecanotun.mobile.utils

object Constants {
    // Note: API Base URL is configured in RetrofitClient.kt
    // For Android Emulator: http://10.0.2.2:3087/
    // For Physical Device: Use your computer's local IP address (e.g., http://192.168.1.XXX:3087/)

    // Request Codes
    const val REQUEST_CODE_LOGIN = 1001
    const val REQUEST_CODE_SIGNUP = 1002

    // Intent Keys
    const val EXTRA_SERVICE_ID = "service_id"
    const val EXTRA_SERVICE_NAME = "service_name"
    const val EXTRA_APPOINTMENT_ID = "appointment_id"

    // Appointment Status
    const val STATUS_PENDING = "PENDING"
    const val STATUS_CONFIRMED = "CONFIRMED"
    const val STATUS_COMPLETED = "COMPLETED"
    const val STATUS_CANCELLED = "CANCELLED"
}
