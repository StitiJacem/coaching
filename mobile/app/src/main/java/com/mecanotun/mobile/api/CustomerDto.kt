package com.mecanotun.mobile.api

data class CustomerDto(
    val id: Long,
    val name: String,
    val email: String,
    val phone: String,
    val address: String
)
