package com.mecanotun.mobile.repository

import com.mecanotun.mobile.api.CarDto
import com.mecanotun.mobile.api.RetrofitClient
import retrofit2.Response

class VehicleRepository {
    private val api = RetrofitClient.instance

    suspend fun getCarsByCustomer(customerId: Int): Response<List<CarDto>> {
        return api.getCarsByCustomer(customerId)
    }

    suspend fun createCar(
        customerId: Int,
        brand: String,
        model: String,
        engine: String,
        vin: String?,
        year: Int?
    ): Response<CarDto> {
        return api.createCar(customerId, brand, model, engine, vin, year)
    }

    suspend fun updateCar(
        carId: Int,
        brand: String,
        model: String,
        engine: String,
        vin: String?,
        year: Int?
    ): Response<CarDto> {
        return api.updateCar(carId, brand, model, engine, vin, year)
    }

    suspend fun deleteCar(carId: Int): Response<CarDto> {
        return api.deleteCar(carId)
    }

    suspend fun isCarAvailable(carId: Int): Response<Boolean> {
        return api.isCarAvailable(carId)
    }
}


