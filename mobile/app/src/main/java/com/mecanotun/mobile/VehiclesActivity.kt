package com.mecanotun.mobile

import android.app.AlertDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.floatingactionbutton.FloatingActionButton
import com.mecanotun.mobile.adapters.VehiclesAdapter
import com.mecanotun.mobile.api.CarDto
import com.mecanotun.mobile.repository.VehicleRepository
import com.mecanotun.mobile.utils.SharedPreferencesManager
import kotlinx.coroutines.launch

class VehiclesActivity : AppCompatActivity() {
    private lateinit var recyclerView: RecyclerView
    private lateinit var fab: FloatingActionButton
    private lateinit var adapter: VehiclesAdapter
    private lateinit var prefsManager: SharedPreferencesManager
    private val vehicleRepository = VehicleRepository()
    private val vehicles = mutableListOf<CarDto>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_vehicles)

        prefsManager = SharedPreferencesManager(this)

        supportActionBar?.title = "My Vehicles"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        recyclerView = findViewById(R.id.rv_vehicles)
        fab = findViewById(R.id.fab_add_vehicle)

        adapter =
                VehiclesAdapter(
                        vehicles,
                        onEdit = { vehicle -> showEditVehicleDialog(vehicle) },
                        onDelete = { vehicle -> confirmDeleteVehicle(vehicle) }
                )

        recyclerView.layoutManager = LinearLayoutManager(this)
        recyclerView.adapter = adapter

        fab.setOnClickListener { showAddVehicleDialog() }

        loadVehicles()
    }

    private fun loadVehicles() {
        val customerId = prefsManager.getUserId()

        lifecycleScope.launch {
            try {
                val response = vehicleRepository.getCarsByCustomer(customerId)

                if (response.isSuccessful && response.body() != null) {
                    vehicles.clear()
                    vehicles.addAll(response.body()!!)
                    adapter.notifyDataSetChanged()
                } else {
                    Toast.makeText(
                                    this@VehiclesActivity,
                                    "Failed to load vehicles",
                                    Toast.LENGTH_SHORT
                            )
                            .show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@VehiclesActivity, "Error: ${e.message}", Toast.LENGTH_SHORT)
                        .show()
            }
        }
    }

    private fun showAddVehicleDialog() {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_vehicle, null)
        val etBrand = dialogView.findViewById<EditText>(R.id.et_brand)
        val etModel = dialogView.findViewById<EditText>(R.id.et_model)
        val etEngine = dialogView.findViewById<EditText>(R.id.et_engine)
        val etVin = dialogView.findViewById<EditText>(R.id.et_vin)
        val etYear = dialogView.findViewById<EditText>(R.id.et_year)

        AlertDialog.Builder(this)
                .setTitle("Add Vehicle")
                .setView(dialogView)
                .setPositiveButton("Add") { _, _ ->
                    val brand = etBrand.text.toString().trim()
                    val model = etModel.text.toString().trim()
                    val engine = etEngine.text.toString().trim()
                    val vin = etVin.text.toString().trim().takeIf { it.isNotEmpty() }
                    val year = etYear.text.toString().trim().toIntOrNull()

                    if (brand.isEmpty() || model.isEmpty() || engine.isEmpty()) {
                        Toast.makeText(this, "Please fill required fields", Toast.LENGTH_SHORT)
                                .show()
                        return@setPositiveButton
                    }

                    addVehicle(brand, model, engine, vin, year)
                }
                .setNegativeButton("Cancel", null)
                .show()
    }

    private fun showEditVehicleDialog(vehicle: CarDto) {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_vehicle, null)
        val etBrand = dialogView.findViewById<EditText>(R.id.et_brand)
        val etModel = dialogView.findViewById<EditText>(R.id.et_model)
        val etEngine = dialogView.findViewById<EditText>(R.id.et_engine)
        val etVin = dialogView.findViewById<EditText>(R.id.et_vin)
        val etYear = dialogView.findViewById<EditText>(R.id.et_year)

        // Pre-fill with existing data
        etBrand.setText(vehicle.brand)
        etModel.setText(vehicle.model)
        etEngine.setText(vehicle.engine)
        etVin.setText(vehicle.vin ?: "")
        etYear.setText(vehicle.year?.toString() ?: "")

        AlertDialog.Builder(this)
                .setTitle("Edit Vehicle")
                .setView(dialogView)
                .setPositiveButton("Update") { _, _ ->
                    val brand = etBrand.text.toString().trim()
                    val model = etModel.text.toString().trim()
                    val engine = etEngine.text.toString().trim()
                    val vin = etVin.text.toString().trim().takeIf { it.isNotEmpty() }
                    val year = etYear.text.toString().trim().toIntOrNull()

                    if (brand.isEmpty() || model.isEmpty() || engine.isEmpty()) {
                        Toast.makeText(this, "Please fill required fields", Toast.LENGTH_SHORT)
                                .show()
                        return@setPositiveButton
                    }

                    updateVehicle(vehicle.id, brand, model, engine, vin, year)
                }
                .setNegativeButton("Cancel", null)
                .show()
    }

    private fun confirmDeleteVehicle(vehicle: CarDto) {
        AlertDialog.Builder(this)
                .setTitle("Delete Vehicle")
                .setMessage("Are you sure you want to delete ${vehicle.brand} ${vehicle.model}?")
                .setPositiveButton("Delete") { _, _ -> deleteVehicle(vehicle.id) }
                .setNegativeButton("Cancel", null)
                .show()
    }

    private fun addVehicle(brand: String, model: String, engine: String, vin: String?, year: Int?) {
        val customerId = prefsManager.getUserId()

        lifecycleScope.launch {
            try {
                val response = vehicleRepository.createCar(
                    customerId,
                    brand,
                    model,
                    engine,
                    vin,
                    year
                )

                if (response.isSuccessful && response.body() != null) {
                    Toast.makeText(this@VehiclesActivity, "Vehicle added", Toast.LENGTH_SHORT)
                            .show()
                    loadVehicles()
                } else {
                    Toast.makeText(
                                    this@VehiclesActivity,
                                    "Failed to add vehicle",
                                    Toast.LENGTH_SHORT
                            )
                            .show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@VehiclesActivity, "Error: ${e.message}", Toast.LENGTH_SHORT)
                        .show()
            }
        }
    }

    private fun updateVehicle(
            carId: Int,
            brand: String,
            model: String,
            engine: String,
            vin: String?,
            year: Int?
    ) {
        lifecycleScope.launch {
            try {
                val response = vehicleRepository.updateCar(carId, brand, model, engine, vin, year)

                if (response.isSuccessful) {
                    Toast.makeText(this@VehiclesActivity, "Vehicle updated", Toast.LENGTH_SHORT)
                            .show()
                    loadVehicles()
                } else {
                    Toast.makeText(
                                    this@VehiclesActivity,
                                    "Failed to update vehicle",
                                    Toast.LENGTH_SHORT
                            )
                            .show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@VehiclesActivity, "Error: ${e.message}", Toast.LENGTH_SHORT)
                        .show()
            }
        }
    }

    private fun deleteVehicle(carId: Int) {
        lifecycleScope.launch {
            try {
                val response = vehicleRepository.deleteCar(carId)

                if (response.isSuccessful) {
                    Toast.makeText(this@VehiclesActivity, "Vehicle deleted", Toast.LENGTH_SHORT)
                            .show()
                    loadVehicles()
                } else {
                    Toast.makeText(
                                    this@VehiclesActivity,
                                    "Failed to delete vehicle",
                                    Toast.LENGTH_SHORT
                            )
                            .show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@VehiclesActivity, "Error: ${e.message}", Toast.LENGTH_SHORT)
                        .show()
            }
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
