package com.mecanotun.mobile.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.mecanotun.mobile.api.CustomerDto
import com.mecanotun.mobile.repository.CustomerRepository
import com.mecanotun.mobile.utils.SharedPreferencesManager
import kotlinx.coroutines.launch

class LoginViewModel(application: Application) : AndroidViewModel(application) {
    private val prefsManager = SharedPreferencesManager(application)
    private val customerRepository = CustomerRepository()

    // Two-way binding for input fields
    val email = MutableLiveData<String>("")
    val password = MutableLiveData<String>("")

    // UI state
    private val _isLoading = MutableLiveData<Boolean>(false)
    val isLoading: LiveData<Boolean> = _isLoading

    private val _errorMessage = MutableLiveData<String?>()
    val errorMessage: LiveData<String?> = _errorMessage

    private val _loginSuccess = MutableLiveData<CustomerDto?>()
    val loginSuccess: LiveData<CustomerDto?> = _loginSuccess

    private val _navigateToHome = MutableLiveData<Boolean>(false)
    val navigateToHome: LiveData<Boolean> = _navigateToHome

    init {
        // Check if already logged in
        if (prefsManager.isLoggedIn()) {
            _navigateToHome.value = true
        }
    }

    fun login() {
        val emailValue = email.value?.trim() ?: ""
        val passwordValue = password.value?.trim() ?: ""

        if (emailValue.isEmpty() || passwordValue.isEmpty()) {
            _errorMessage.value = "Please fill all fields"
            return
        }

        _isLoading.value = true
        _errorMessage.value = null

        viewModelScope.launch {
            try {
                val response = customerRepository.loginCustomer(emailValue, passwordValue)

                if (response.isSuccessful) {
                    val customer = response.body()
                    if (customer != null) {
                        // Save user session
                        prefsManager.saveUserSession(
                                customer.id.toInt(),
                                customer.name,
                                customer.email,
                                customer.phone,
                                customer.address
                        )
                        prefsManager.saveUserRole(SharedPreferencesManager.ROLE_CUSTOMER)

                        _loginSuccess.value = customer
                        _navigateToHome.value = true
                    } else {
                        _errorMessage.value = "Login failed: Empty response from server"
                    }
                } else {
                    // Try to read error body for more details
                    val errorBody = response.errorBody()?.string()
                    val errorMsg = when (response.code()) {
                        404 -> "Login endpoint not found. Please check backend is running."
                        500 -> "Server error. Please try again later."
                        401, 403 -> "Invalid email or password"
                        else -> errorBody ?: "Login failed (Code: ${response.code()})"
                    }
                    _errorMessage.value = errorMsg
                }
            } catch (e: java.net.UnknownHostException) {
                _errorMessage.value = "Cannot connect to server. Is backend running on port 3087?"
            } catch (e: java.net.ConnectException) {
                _errorMessage.value = "Connection refused. Please check backend is running."
            } catch (e: com.google.gson.JsonSyntaxException) {
                _errorMessage.value = "Server returned invalid data. Check backend login endpoint."
            } catch (e: java.io.EOFException) {
                _errorMessage.value = "Empty response from server. Check backend login endpoint exists."
            } catch (e: java.io.IOException) {
                if (e.message?.contains("End of input") == true || e.message?.contains("column 1") == true) {
                    _errorMessage.value = "Empty response from server. Login endpoint may not exist or return empty response."
                } else {
                    _errorMessage.value = "Network error: ${e.message}"
                }
            } catch (e: Exception) {
                _errorMessage.value = "Login failed: ${e.javaClass.simpleName} - ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun onNavigatedToHome() {
        _navigateToHome.value = false
    }
}
