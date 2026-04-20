package com.mecanotun.mobile

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import com.mecanotun.mobile.adapters.ServicesAdapter
import com.mecanotun.mobile.databinding.ActivityServicesBinding
import com.mecanotun.mobile.utils.Constants
import com.mecanotun.mobile.viewmodel.ServicesViewModel

class ServicesActivity : AppCompatActivity() {
    private lateinit var binding: ActivityServicesBinding
    private lateinit var viewModel: ServicesViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = getString(R.string.services_title)

        // Initialize Data Binding
        binding = ActivityServicesBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Initialize ViewModel
        viewModel = ViewModelProvider(this)[ServicesViewModel::class.java]
        binding.viewModel = viewModel
        binding.lifecycleOwner = this

        // Setup RecyclerView
        binding.rvServices.layoutManager = LinearLayoutManager(this)

        // Observe services list
        viewModel.services.observe(this) { services ->
            val adapter =
                    ServicesAdapter(services) { service -> viewModel.onServiceClicked(service) }
            binding.rvServices.adapter = adapter
        }

        // Observe error messages
        viewModel.errorMessage.observe(this) { error ->
            error?.let { Toast.makeText(this, it, Toast.LENGTH_SHORT).show() }
        }

        // Observe navigation to booking
        viewModel.navigateToBooking.observe(this) { service ->
            service?.let {
                val intent = Intent(this, BookAppointmentActivity::class.java)
                intent.putExtra(Constants.EXTRA_SERVICE_ID, it.id)
                intent.putExtra(Constants.EXTRA_SERVICE_NAME, it.name)
                startActivity(intent)
                viewModel.onNavigatedToBooking()
            }
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
