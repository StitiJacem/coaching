package com.mecanotun.mobile.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mecanotun.mobile.api.ServiceDto
import com.mecanotun.mobile.repository.ServiceRepository
import kotlinx.coroutines.launch

class ServicesViewModel : ViewModel() {
    private val serviceRepository = ServiceRepository()
    private val _services = MutableLiveData<List<ServiceDto>>()
    val services: LiveData<List<ServiceDto>> = _services

    private val _isLoading = MutableLiveData<Boolean>(false)
    val isLoading: LiveData<Boolean> = _isLoading

    private val _errorMessage = MutableLiveData<String?>()
    val errorMessage: LiveData<String?> = _errorMessage

    private val _isEmpty = MutableLiveData<Boolean>(false)
    val isEmpty: LiveData<Boolean> = _isEmpty

    private val _navigateToBooking = MutableLiveData<ServiceDto?>()
    val navigateToBooking: LiveData<ServiceDto?> = _navigateToBooking

    init {
        loadServices()
    }

    fun loadServices() {
        _isLoading.value = true
        _errorMessage.value = null

        viewModelScope.launch {
            try {
                val response = serviceRepository.getAllServices()

                if (response.isSuccessful && response.body() != null) {
                    val servicesList = response.body()!!
                    _services.value = servicesList
                    _isEmpty.value = servicesList.isEmpty()
                } else {
                    _errorMessage.value = "Failed to load services"
                }
            } catch (e: Exception) {
                _errorMessage.value = "Error: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun onServiceClicked(service: ServiceDto) {
        _navigateToBooking.value = service
    }

    fun onNavigatedToBooking() {
        _navigateToBooking.value = null
    }
}
