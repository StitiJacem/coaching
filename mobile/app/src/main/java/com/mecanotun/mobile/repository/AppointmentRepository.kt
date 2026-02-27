package com.mecanotun.mobile.repository

import com.mecanotun.mobile.api.AppointmentDto
import com.mecanotun.mobile.api.MechanicDto
import com.mecanotun.mobile.api.RetrofitClient
import com.mecanotun.mobile.api.TimeSlotDto
import retrofit2.Response

class AppointmentRepository {
    private val api = RetrofitClient.instance

    suspend fun getAppointmentsByCustomer(customerId: Int): Response<List<AppointmentDto>> {
        return api.getAppointmentsByCustomer(customerId)
    }

    suspend fun getAppointmentById(id: Int): Response<AppointmentDto> {
        return api.getAppointmentById(id)
    }

    suspend fun createAppointment(
        customerId: Int,
        timeSlotId: String?,
        carId: String,
        services: Array<String>,
        note: String = ""
    ): Response<AppointmentDto> {
        return api.createAppointment(customerId, timeSlotId, carId, services, note)
    }

    suspend fun deleteAppointment(appointmentId: Int): Response<AppointmentDto> {
        return api.deleteAppointment(appointmentId)
    }

    suspend fun getAllMechanics(): Response<List<MechanicDto>> {
        return api.getAllMechanics()
    }

    suspend fun getAvailableTimeSlots(): Response<List<TimeSlotDto>> {
        return api.getAvailableTimeSlots()
    }

    suspend fun getAllTimeSlots(): Response<List<TimeSlotDto>> {
        return api.getAllTimeSlots()
    }
}

