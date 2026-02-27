package com.mecanotun.mobile

import android.os.Bundle
import android.view.View
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import com.mecanotun.mobile.databinding.ActivityBookAppointmentBinding
import com.mecanotun.mobile.utils.Constants
import com.mecanotun.mobile.viewmodel.BookAppointmentViewModel

class BookAppointmentActivity : AppCompatActivity() {
    private lateinit var binding: ActivityBookAppointmentBinding
    private lateinit var viewModel: BookAppointmentViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = "Book Appointment"

        // Initialize Data Binding
        binding = ActivityBookAppointmentBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Initialize ViewModel
        viewModel = ViewModelProvider(this)[BookAppointmentViewModel::class.java]
        binding.viewModel = viewModel
        binding.lifecycleOwner = this

        // Get service type from intent
        viewModel.serviceType = intent.getStringExtra(Constants.EXTRA_SERVICE_NAME) ?: "OIL_CHANGE"

        // Load data
        viewModel.loadData()

        // Observe mechanics list
        viewModel.mechanics.observe(this) { mechanics ->
            val mechanicNames = mechanics.map { it.name }
            binding.spinnerMechanic.adapter =
                    ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, mechanicNames)
        }

        // Observe vehicles list
        viewModel.vehicles.observe(this) { vehicles ->
            val vehicleNames = vehicles.map { "${it.brand} ${it.model} (${it.year ?: "N/A"})" }
            binding.spinnerVehicle.adapter =
                    ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, vehicleNames)
        }

        // Spinner selection listeners
        binding.spinnerMechanic.onItemSelectedListener =
                object : AdapterView.OnItemSelectedListener {
                    override fun onItemSelected(
                            parent: AdapterView<*>?,
                            view: View?,
                            position: Int,
                            id: Long
                    ) {
                        viewModel.setSelectedMechanicPosition(position)
                    }
                    override fun onNothingSelected(parent: AdapterView<*>?) {}
                }

        binding.spinnerVehicle.onItemSelectedListener =
                object : AdapterView.OnItemSelectedListener {
                    override fun onItemSelected(
                            parent: AdapterView<*>?,
                            view: View?,
                            position: Int,
                            id: Long
                    ) {
                        viewModel.setSelectedVehiclePosition(position)
                    }
                    override fun onNothingSelected(parent: AdapterView<*>?) {}
                }

        // Observe time slots list
        viewModel.timeSlots.observe(this) { timeSlots ->
            val timeSlotLabels =
                    timeSlots.map {
                        "${it.startTime.replace("T", " ")} - ${it.endTime.substringAfter("T")}"
                    }
            binding.spinnerTimeSlot.adapter =
                    ArrayAdapter(
                            this,
                            android.R.layout.simple_spinner_dropdown_item,
                            timeSlotLabels
                    )
        }

        binding.spinnerTimeSlot.onItemSelectedListener =
                object : AdapterView.OnItemSelectedListener {
                    override fun onItemSelected(
                            parent: AdapterView<*>?,
                            view: View?,
                            position: Int,
                            id: Long
                    ) {
                        viewModel.setSelectedTimeSlotPosition(position)
                    }
                    override fun onNothingSelected(parent: AdapterView<*>?) {}
                }

        // Observe error messages
        viewModel.errorMessage.observe(this) { error ->
            error?.let { Toast.makeText(this, it, Toast.LENGTH_SHORT).show() }
        }

        // Observe success messages
        viewModel.successMessage.observe(this) { success ->
            success?.let { Toast.makeText(this, it, Toast.LENGTH_SHORT).show() }
        }

        // Observe finish activity
        viewModel.finishActivity.observe(this) { shouldFinish ->
            if (shouldFinish) {
                finish()
            }
        }

        // Submit button click listener
        binding.btnSubmitBooking.setOnClickListener { viewModel.bookAppointment() }
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
