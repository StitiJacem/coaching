package com.mecanotun.mobile.repository

import com.mecanotun.mobile.api.CustomerDto
import com.mecanotun.mobile.api.RetrofitClient
import retrofit2.Response

class CustomerRepository {
    private val api = RetrofitClient.instance

    suspend fun loginCustomer(email: String, password: String): Response<CustomerDto> {
        return api.loginCustomer(email, password)
    }

    suspend fun createCustomer(
        name: String,
        email: String,
        password: String,
        phone: String,
        address: String
    ): Response<CustomerDto> {
        return api.createCustomer(name, password, phone, email, address)
    }

    suspend fun getCustomerById(id: Int): Response<CustomerDto> {
        return api.getCustomerById(id)
    }

    suspend fun updateCustomer(
        oldEmail: String,
        newName: String,
        newPassword: String,
        newPhone: String,
        newAddress: String
    ): Response<CustomerDto> {
        return api.updateCustomer(oldEmail, newName, newPassword, newPhone, newAddress)
    }
}


