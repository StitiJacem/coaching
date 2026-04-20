package com.mecanotun.mobile.api

import retrofit2.Response
import retrofit2.http.*

interface RepairSystemApi {
        @GET("customer/login/{email}")
        suspend fun loginCustomer(
                @Path("email") email: String,
                @Query("password") password: String
        ): Response<CustomerDto>

        @POST("customer/{name}")
        @FormUrlEncoded
        suspend fun createCustomer(
                @Path("name") name: String,
                @Field("password") password: String,
                @Field("phone") phone: String,
                @Field("email") email: String,
                @Field("address") address: String
        ): Response<CustomerDto>


        @GET("customer/{id}")
        suspend fun getCustomerById(@Path("id") id: Int): Response<CustomerDto>

        @PUT("customer/{oldEmail}")
        @FormUrlEncoded
        suspend fun updateCustomer(
                @Path("oldEmail") oldEmail: String,
                @Field("newName") newName: String,
                @Field("newPassword") newPassword: String,
                @Field("newPhone") newPhone: String,
                @Field("newAddress") newAddress: String
        ): Response<CustomerDto>

        // ============ Vehicle/Car Management ============

        @GET("cars/{customerId}")
        suspend fun getCarsByCustomer(@Path("customerId") customerId: Int): Response<List<CarDto>>

        @POST("car/{customerId}")
        @FormUrlEncoded
        suspend fun createCar(
                @Path("customerId") customerId: Int,
                @Field("brand") brand: String,
                @Field("model") model: String,
                @Field("engine") engine: String,
                @Field("vin") vin: String?,
                @Field("year") year: Int?
        ): Response<CarDto>

        @PUT("car/{id}")
        @FormUrlEncoded
        suspend fun updateCar(
                @Path("id") carId: Int,
                @Field("brand") brand: String,
                @Field("model") model: String,
                @Field("engine") engine: String,
                @Field("vin") vin: String?,
                @Field("year") year: Int?
        ): Response<CarDto>

        @DELETE("car/{id}") suspend fun deleteCar(@Path("id") carId: Int): Response<CarDto>

        @GET("appointment/car-available/{carId}")
        suspend fun isCarAvailable(@Path("carId") carId: Int): Response<Boolean>

        // ============ Services ============

        @GET("services") suspend fun getAllServices(): Response<List<ServiceDto>>

        @GET("services/{serviceType}")
        suspend fun getServiceById(@Path("serviceType") serviceType: String): Response<ServiceDto>

        // ============ Mechanics ============

        @GET("mechanics") suspend fun getAllMechanics(): Response<List<MechanicDto>>

        // ============ Appointments ============

        @GET("appointments/{customerId}")
        suspend fun getAppointmentsByCustomer(
                @Path("customerId") customerId: Int
        ): Response<List<AppointmentDto>>

        @GET("appointment/{id}")
        suspend fun getAppointmentById(@Path("id") id: Int): Response<AppointmentDto>

        @POST("appointment/{customerId}")
        @FormUrlEncoded
        suspend fun createAppointment(
                @Path("customerId") customerId: Int,
                @Field("timeSlotId") timeSlotId: String?,
                @Field("carId") carId: String,
                @Field("services") services: Array<String>,
                @Field("note") note: String = ""
        ): Response<AppointmentDto>

        @DELETE("appointment/{appointmentId}")
        suspend fun deleteAppointment(
                @Path("appointmentId") appointmentId: Int
        ): Response<AppointmentDto>

        // ============ Time Slots ============

        @GET("timeslots") suspend fun getAllTimeSlots(): Response<List<TimeSlotDto>>

        @GET("timeslots") suspend fun getAvailableTimeSlots(): Response<List<TimeSlotDto>>
}
