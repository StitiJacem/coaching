package com.mecanotun.mobile

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.appcompat.app.AppCompatActivity
import com.mecanotun.mobile.utils.SharedPreferencesManager

class MainActivity : AppCompatActivity() {
    private lateinit var prefsManager: SharedPreferencesManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        supportActionBar?.hide()

        prefsManager = SharedPreferencesManager(this)

        Handler(Looper.getMainLooper())
                .postDelayed(
                        {
                            if (prefsManager.isLoggedIn()) {
                                startActivity(Intent(this, HomeActivity::class.java))
                            } else {
                                startActivity(Intent(this, LoginActivity::class.java))
                            }
                            finish()
                        },
                        2000
                )
    }
}
