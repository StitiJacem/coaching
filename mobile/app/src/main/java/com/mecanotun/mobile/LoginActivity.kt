package com.mecanotun.mobile

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import com.mecanotun.mobile.databinding.ActivityLoginBinding
import com.mecanotun.mobile.viewmodel.LoginViewModel

class LoginActivity : AppCompatActivity() {
    private lateinit var binding: ActivityLoginBinding
    private lateinit var viewModel: LoginViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialize Data Binding
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Initialize ViewModel
        viewModel = ViewModelProvider(this)[LoginViewModel::class.java]
        binding.viewModel = viewModel
        binding.lifecycleOwner = this

        // Observe navigation events
        viewModel.navigateToHome.observe(this) { shouldNavigate ->
            if (shouldNavigate) {
                startActivity(Intent(this, HomeActivity::class.java))
                finish()
                viewModel.onNavigatedToHome()
            }
        }

        // Observe error messages
        viewModel.errorMessage.observe(this) { error ->
            error?.let { Toast.makeText(this, it, Toast.LENGTH_SHORT).show() }
        }

        // Observe login success
        viewModel.loginSuccess.observe(this) { customer ->
            customer?.let { Toast.makeText(this, "Welcome ${it.name}!", Toast.LENGTH_SHORT).show() }
        }

        // Sign up link click listener
        binding.tvSignUp.setOnClickListener {
            startActivity(Intent(this, SignUpActivity::class.java))
        }
    }
}
