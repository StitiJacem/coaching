package com.mecanotun.mobile

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import com.mecanotun.mobile.databinding.ActivityHomeBinding
import com.mecanotun.mobile.viewmodel.HomeViewModel

class HomeActivity : AppCompatActivity() {
    private lateinit var binding: ActivityHomeBinding
    private lateinit var viewModel: HomeViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialize Data Binding
        binding = ActivityHomeBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Initialize ViewModel
        viewModel = ViewModelProvider(this)[HomeViewModel::class.java]
        binding.viewModel = viewModel
        binding.lifecycleOwner = this

        // Observe navigation events
        viewModel.navigateToServices.observe(this) { shouldNavigate ->
            if (shouldNavigate) {
                startActivity(Intent(this, ServicesActivity::class.java))
                viewModel.onNavigated()
            }
        }

        viewModel.navigateToVehicles.observe(this) { shouldNavigate ->
            if (shouldNavigate) {
                startActivity(Intent(this, VehiclesActivity::class.java))
                viewModel.onNavigated()
            }
        }

        viewModel.navigateToAppointments.observe(this) { shouldNavigate ->
            if (shouldNavigate) {
                startActivity(Intent(this, AppointmentsActivity::class.java))
                viewModel.onNavigated()
            }
        }

        viewModel.navigateToProfile.observe(this) { shouldNavigate ->
            if (shouldNavigate) {
                startActivity(Intent(this, ProfileActivity::class.java))
                viewModel.onNavigated()
            }
        }

        viewModel.navigateToLogin.observe(this) { shouldNavigate ->
            if (shouldNavigate) {
                startActivity(Intent(this, LoginActivity::class.java))
                finish()
                viewModel.onNavigated()
            }
        }

        // Logout button click listener
        binding.btnLogout.setOnClickListener { showLogoutDialog() }
    }

    private fun showLogoutDialog() {
        AlertDialog.Builder(this)
                .setTitle(getString(R.string.logout))
                .setMessage(getString(R.string.logout_confirmation))
                .setPositiveButton("Yes") { _, _ -> viewModel.logout() }
                .setNegativeButton("No", null)
                .show()
    }
}
