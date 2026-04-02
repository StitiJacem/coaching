package com.mecanotun.mobile.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.mecanotun.mobile.repository.CustomerRepository
import kotlinx.coroutines.launch

class SignUpViewModel(application: Application) : AndroidViewModel(application) {
    private val customerRepository = CustomerRepository()
    // Two-way binding for input fields
    val name = MutableLiveData<String>("")
    val email = MutableLiveData<String>("")
    val password = MutableLiveData<String>("")
    val phone = MutableLiveData<String>("")
    val address = MutableLiveData<String>("")

    // UI state
    private val _isLoading = MutableLiveData<Boolean>(false)
    val isLoading: LiveData<Boolean> = _isLoading

    private val _errorMessage = MutableLiveData<String?>()
    val errorMessage: LiveData<String?> = _errorMessage

    private val _successMessage = MutableLiveData<String?>()
    val successMessage: LiveData<String?> = _successMessage

    private val _navigateToLogin = MutableLiveData<Boolean>(false)
    val navigateToLogin: LiveData<Boolean> = _navigateToLogin

    fun signUp() {
        val nameValue = name.value?.trim() ?: ""
        val emailValue = email.value?.trim() ?: ""
        val passwordValue = password.value?.trim() ?: ""
        val phoneValue = phone.value?.trim() ?: ""
        val addressValue = address.value?.trim() ?: ""

        // Validation
        if (nameValue.isEmpty() ||
                        emailValue.isEmpty() ||
                        passwordValue.isEmpty() ||
                        phoneValue.isEmpty() ||
                        addressValue.isEmpty()
        ) {
            _errorMessage.value = "Please fill all fields"
            return
        }

        if (passwordValue.length < 6) {
            _errorMessage.value = "Password must be at least 6 characters"
            return
        }

        _isLoading.value = true
        _errorMessage.value = null

        viewModelScope.launch {
            try {
                val response = customerRepository.createCustomer(
                    nameValue,
                    emailValue,
                    passwordValue,
                    phoneValue,
                    addressValue
                )

                if (response.isSuccessful) {
                    _successMessage.value = "Account created successfully!"
                    _navigateToLogin.value = true
                } else {
                    _errorMessage.value = "Sign up failed: ${response.message()}"
                }
            } catch (e: Exception) {
                _errorMessage.value = "Sign up failed: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun onNavigatedToLogin() {
        _navigateToLogin.value = false
    }
}
