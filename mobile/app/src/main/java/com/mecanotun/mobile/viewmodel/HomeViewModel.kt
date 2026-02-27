package com.mecanotun.mobile.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import com.mecanotun.mobile.utils.SharedPreferencesManager

class HomeViewModel(application: Application) : AndroidViewModel(application) {
    private val prefsManager = SharedPreferencesManager(application)

    private val _userName = MutableLiveData<String>()
    val userName: LiveData<String> = _userName

    private val _navigateToServices = MutableLiveData<Boolean>(false)
    val navigateToServices: LiveData<Boolean> = _navigateToServices

    private val _navigateToVehicles = MutableLiveData<Boolean>(false)
    val navigateToVehicles: LiveData<Boolean> = _navigateToVehicles

    private val _navigateToAppointments = MutableLiveData<Boolean>(false)
    val navigateToAppointments: LiveData<Boolean> = _navigateToAppointments

    private val _navigateToProfile = MutableLiveData<Boolean>(false)
    val navigateToProfile: LiveData<Boolean> = _navigateToProfile

    private val _navigateToLogin = MutableLiveData<Boolean>(false)
    val navigateToLogin: LiveData<Boolean> = _navigateToLogin

    init {
        _userName.value = prefsManager.getUserName() ?: "User"
    }

    fun onServicesClicked() {
        _navigateToServices.value = true
    }

    fun onVehiclesClicked() {
        _navigateToVehicles.value = true
    }

    fun onAppointmentsClicked() {
        _navigateToAppointments.value = true
    }

    fun onProfileClicked() {
        _navigateToProfile.value = true
    }

    fun logout() {
        prefsManager.clearSession()
        _navigateToLogin.value = true
    }

    fun onNavigated() {
        _navigateToServices.value = false
        _navigateToVehicles.value = false
        _navigateToAppointments.value = false
        _navigateToProfile.value = false
        _navigateToLogin.value = false
    }
}
