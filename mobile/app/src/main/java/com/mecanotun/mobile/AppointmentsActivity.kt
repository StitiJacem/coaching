package com.mecanotun.mobile

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.floatingactionbutton.FloatingActionButton
import com.mecanotun.mobile.adapters.AppointmentsAdapter
import com.mecanotun.mobile.repository.AppointmentRepository
import com.mecanotun.mobile.utils.SharedPreferencesManager
import kotlinx.coroutines.launch

class AppointmentsActivity : AppCompatActivity() {
    private val appointmentRepository = AppointmentRepository()
    private lateinit var recyclerView: RecyclerView
    private lateinit var progressBar: ProgressBar
    private lateinit var tvEmpty: TextView
    private lateinit var fabAddAppointment: FloatingActionButton
    private lateinit var prefsManager: SharedPreferencesManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_appointments)

        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = getString(R.string.appointments_title)

        prefsManager = SharedPreferencesManager(this)

        recyclerView = findViewById(R.id.rv_appointments)
        progressBar = findViewById(R.id.progress_bar)
        tvEmpty = findViewById(R.id.tv_empty)
        fabAddAppointment = findViewById(R.id.fab_add_appointment)

        recyclerView.layoutManager = LinearLayoutManager(this)


        fabAddAppointment.setOnClickListener {
            startActivity(Intent(this, ServicesActivity::class.java))
        }

        loadAppointments()
    }

    private fun loadAppointments() {
        val customerId = prefsManager.getUserId()
        if (customerId == -1) {
            Toast.makeText(this, "User not logged in", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        lifecycleScope.launch {
            try {
                progressBar.visibility = View.VISIBLE
                val response = appointmentRepository.getAppointmentsByCustomer(customerId)
                progressBar.visibility = View.GONE

                if (response.isSuccessful && response.body() != null) {
                    val appointments = response.body()!!
                    if (appointments.isEmpty()) {
                        tvEmpty.visibility = View.VISIBLE
                        recyclerView.visibility = View.GONE
                    } else {
                        tvEmpty.visibility = View.GONE
                        recyclerView.visibility = View.VISIBLE

                        val adapter = AppointmentsAdapter(appointments)
                        recyclerView.adapter = adapter
                    }
                } else {
                    Toast.makeText(
                                    this@AppointmentsActivity,
                                    "Failed to load appointments",
                                    Toast.LENGTH_SHORT
                            )
                            .show()
                }
            } catch (e: Exception) {
                progressBar.visibility = View.GONE
                Toast.makeText(this@AppointmentsActivity, "Error: ${e.message}", Toast.LENGTH_SHORT)
                        .show()
            }
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
