package com.mecanotun.mobile.utils

import android.content.Context
import android.content.SharedPreferences

class SharedPreferencesManager(context: Context) {
    private val sharedPreferences: SharedPreferences =
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    companion object {
        private const val PREFS_NAME = "MecanoTunPrefs"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_USER_NAME = "user_name"
        private const val KEY_USER_EMAIL = "user_email"
        private const val KEY_USER_PHONE = "user_phone"
        private const val KEY_USER_ADDRESS = "user_address"
        private const val KEY_IS_LOGGED_IN = "is_logged_in"
        private const val KEY_USER_ROLE = "user_role"
        private const val KEY_MECHANIC_ID = "mechanic_id"
        private const val KEY_ADMIN_ID = "admin_id"

        const val ROLE_CUSTOMER = "CUSTOMER"
        const val ROLE_MECHANIC = "MECHANIC"
        const val ROLE_ADMIN = "ADMIN"
    }

    fun saveUserSession(id: Int, name: String, email: String, phone: String, address: String) {
        sharedPreferences.edit().apply {
            putInt(KEY_USER_ID, id)
            putString(KEY_USER_NAME, name)
            putString(KEY_USER_EMAIL, email)
            putString(KEY_USER_PHONE, phone)
            putString(KEY_USER_ADDRESS, address)
            putBoolean(KEY_IS_LOGGED_IN, true)
            apply()
        }
    }

    fun isLoggedIn(): Boolean {
        return sharedPreferences.getBoolean(KEY_IS_LOGGED_IN, false)
    }

    fun getUserId(): Int {
        return sharedPreferences.getInt(KEY_USER_ID, -1)
    }

    fun getUserName(): String? {
        return sharedPreferences.getString(KEY_USER_NAME, null)
    }

    fun getUserEmail(): String? {
        return sharedPreferences.getString(KEY_USER_EMAIL, null)
    }

    fun getUserPhone(): String? {
        return sharedPreferences.getString(KEY_USER_PHONE, null)
    }

    fun getUserAddress(): String? {
        return sharedPreferences.getString(KEY_USER_ADDRESS, null)
    }

    // Role management
    fun saveUserRole(role: String) {
        sharedPreferences.edit().putString(KEY_USER_ROLE, role).apply()
    }

    fun getUserRole(): String? {
        return sharedPreferences.getString(KEY_USER_ROLE, null)
    }

    // Mechanic session
    fun saveMechanicSession(id: Int, name: String, email: String, phone: String) {
        sharedPreferences.edit().apply {
            putInt(KEY_MECHANIC_ID, id)
            putString(KEY_USER_NAME, name)
            putString(KEY_USER_EMAIL, email)
            putString(KEY_USER_PHONE, phone)
            putString(KEY_USER_ROLE, ROLE_MECHANIC)
            putBoolean(KEY_IS_LOGGED_IN, true)
            apply()
        }
    }

    fun getMechanicId(): Int {
        return sharedPreferences.getInt(KEY_MECHANIC_ID, -1)
    }

    // Admin session
    fun saveAdminSession(id: Int, name: String, email: String, phone: String) {
        sharedPreferences.edit().apply {
            putInt(KEY_ADMIN_ID, id)
            putString(KEY_USER_NAME, name)
            putString(KEY_USER_EMAIL, email)
            putString(KEY_USER_PHONE, phone)
            putString(KEY_USER_ROLE, ROLE_ADMIN)
            putBoolean(KEY_IS_LOGGED_IN, true)
            apply()
        }
    }

    fun getAdminId(): Int {
        return sharedPreferences.getInt(KEY_ADMIN_ID, -1)
    }

    fun clearSession() {
        sharedPreferences.edit().clear().apply()
    }
}
