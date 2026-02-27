package com.mecanotun.mobile.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.mecanotun.mobile.api.CarDto
import com.mecanotun.mobile.api.MechanicDto
import com.mecanotun.mobile.repository.AppointmentRepository
import com.mecanotun.mobile.repository.VehicleRepository
import com.mecanotun.mobile.utils.SharedPreferencesManager
import kotlinx.coroutines.launch

class BookAppointmentViewModel(application: Application) : AndroidViewModel(application) {
    private val prefsManager = SharedPreferencesManager(application)
    private val appointmentRepository = AppointmentRepository()
    private val vehicleRepository = VehicleRepository()

    private val _mechanics = MutableLiveData<List<MechanicDto>>()
    val mechanics: LiveData<List<MechanicDto>> = _mechanics

    private val _vehicles = MutableLiveData<List<CarDto>>()
    val vehicles: LiveData<List<CarDto>> = _vehicles

    private val _selectedMechanicPosition = MutableLiveData<Int>(0)
    val selectedMechanicPosition: LiveData<Int> = _selectedMechanicPosition

    private val _selectedVehiclePosition = MutableLiveData<Int>(0)
    val selectedVehiclePosition: LiveData<Int> = _selectedVehiclePosition

    private val _timeSlots = MutableLiveData<List<com.mecanotun.mobile.api.TimeSlotDto>>()
    val timeSlots: LiveData<List<com.mecanotun.mobile.api.TimeSlotDto>> = _timeSlots

    private val _selectedTimeSlotPosition = MutableLiveData<Int>(0)
    val selectedTimeSlotPosition: LiveData<Int> = _selectedTimeSlotPosition

    val note = MutableLiveData<String>("")

    private val _isLoading = MutableLiveData<Boolean>(false)
    val isLoading: LiveData<Boolean> = _isLoading

    private val _errorMessage = MutableLiveData<String?>()
    val errorMessage: LiveData<String?> = _errorMessage

    private val _successMessage = MutableLiveData<String?>()
    val successMessage: LiveData<String?> = _successMessage

    private val _finishActivity = MutableLiveData<Boolean>(false)
    val finishActivity: LiveData<Boolean> = _finishActivity

    var serviceType: String = ""

    fun loadData() {
        _isLoading.value = true
        val customerId = prefsManager.getUserId()

        viewModelScope.launch {
            try {
                // Load mechanics
                val mechanicsResponse = appointmentRepository.getAllMechanics()
                if (mechanicsResponse.isSuccessful && mechanicsResponse.body() != null) {
                    _mechanics.value = mechanicsResponse.body()!!
                }

                // Load vehicles
                val vehiclesResponse = vehicleRepository.getCarsByCustomer(customerId)
                if (vehiclesResponse.isSuccessful && vehiclesResponse.body() != null) {
                    _vehicles.value = vehiclesResponse.body()!!
                }

                // Load available time slots
                val timeSlotsResponse = appointmentRepository.getAvailableTimeSlots()
                if (timeSlotsResponse.isSuccessful && timeSlotsResponse.body() != null) {
                    _timeSlots.value = timeSlotsResponse.body()!!
                }

                _isLoading.value = false
            } catch (e: Exception) {
                _isLoading.value = false
                _errorMessage.value = "Error loading data: ${e.message}"
            }
        }
    }

    fun bookAppointment() {
        val mechanicsList = _mechanics.value
        val vehiclesList = _vehicles.value
        val timeSlotsList = _timeSlots.value

        if (mechanicsList.isNullOrEmpty()) {
            _errorMessage.value = "No mechanics available"
            return
        }

        if (vehiclesList.isNullOrEmpty()) {
            _errorMessage.value = "Please add a vehicle first"
            return
        }
        
        if (timeSlotsList.isNullOrEmpty()) {
            _errorMessage.value = "No time slots available"
            return
        }

        val selectedMechanic = mechanicsList[_selectedMechanicPosition.value ?: 0]
        val selectedVehicle = vehiclesList[_selectedVehiclePosition.value ?: 0]
        val selectedTimeSlot = timeSlotsList[_selectedTimeSlotPosition.value ?: 0]
        val noteValue = note.value?.trim() ?: ""
        val customerId = prefsManager.getUserId()

        _isLoading.value = true
        _errorMessage.value = null

        viewModelScope.launch {
            try {
                val response = appointmentRepository.createAppointment(
                    customerId = customerId,
                    timeSlotId = selectedTimeSlot.id.toString(),
                    carId = selectedVehicle.id.toString(),
                    services = arrayOf(serviceType),
                    note = noteValue
                )

                _isLoading.value = false

                if (response.isSuccessful) {
                    _successMessage.value =
                            "Appointment booked successfully with ${selectedMechanic.name}!"
                    _finishActivity.value = true
                } else {
                    _errorMessage.value = "Booking failed: ${response.message()}"
                }
            } catch (e: Exception) {
                _isLoading.value = false
                _errorMessage.value = "Error: ${e.message}"
            }
        }
    }

    fun setSelectedMechanicPosition(position: Int) {
        _selectedMechanicPosition.value = position
    }

    fun setSelectedVehiclePosition(position: Int) {
        _selectedVehiclePosition.value = position
    }

    fun setSelectedTimeSlotPosition(position: Int) {
        _selectedTimeSlotPosition.value = position
    }
}
