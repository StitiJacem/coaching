package com.mecanotun.mobile.api

import com.google.gson.annotations.SerializedName

data class MechanicDto(
        @SerializedName("id") val id: Int = 0,
        @SerializedName("name") val name: String = "",
        @SerializedName("email") val email: String = "",
        @SerializedName("phone") val phone: Long = 0
)
