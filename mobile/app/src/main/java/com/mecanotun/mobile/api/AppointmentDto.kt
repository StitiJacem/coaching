package com.mecanotun.mobile.api

data class AppointmentDto(
        val id: Int = 0,
        val customer: CustomerDto? = null,
        val timeslot: TimeSlotDto? = null,
        val car: CarDto? = null,
        val services: List<ServiceDto>? = null,
        val note: String? = null,
        val status: String? = null
)

data class CarDto(
        val id: Int = 0,
        val brand: String = "",
        val model: String = "",
        val engine: String = "",
        val vin: String? = null,
        val year: Int? = null
)

data class TimeSlotDto(
        val id: Int = 0,
        val startTime: String = "",
        val endTime: String = ""
)
