package com.mecanotun.mobile.repository

import com.mecanotun.mobile.api.RetrofitClient
import com.mecanotun.mobile.api.ServiceDto
import retrofit2.Response

class ServiceRepository {
    private val api = RetrofitClient.instance

    suspend fun getAllServices(): Response<List<ServiceDto>> {
        return api.getAllServices()
    }

    suspend fun getServiceById(serviceType: String): Response<ServiceDto> {
        return api.getServiceById(serviceType)
    }
}

