package com.mecanotun.mobile.api

import com.google.gson.annotations.SerializedName

data class ServiceDto(
        @SerializedName("serviceType") val serviceType: String = "",
        @SerializedName("price") val price: Int = 0
) {
    val id: Int
        get() = serviceType.hashCode()

    val name: String
        get() =
                when (serviceType) {
                    "VIDANGE" -> "Vidange"
                    "FREINAGE" -> "Freinage"
                    "BATTERIE" -> "Batterie"
                    "CLIMATISATION" -> "Climatisation"
                    "DIAGNOSTIC" -> "Diagnostic"
                    "REVISION" -> "Révision"
                    "MECANIQUE" -> "Mécanique"
                    "SUSPENSION" -> "Suspension"
                    "EMBRAYAGE" -> "Embrayage"
                    "ECHAPPEMENT" -> "Échappement"
                    else -> serviceType
                }

    val description: String
        get() = "Service professionnel de $name"

    val duration: Int
        get() = 60
}
