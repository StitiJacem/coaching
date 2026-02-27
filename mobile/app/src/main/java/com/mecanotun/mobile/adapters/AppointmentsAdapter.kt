package com.mecanotun.mobile.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.cardview.widget.CardView
import androidx.recyclerview.widget.RecyclerView
import com.mecanotun.mobile.R
import com.mecanotun.mobile.api.AppointmentDto

class AppointmentsAdapter(private var appointments: List<AppointmentDto>) :
        RecyclerView.Adapter<AppointmentsAdapter.AppointmentViewHolder>() {

    class AppointmentViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvServiceName: TextView = view.findViewById(R.id.tv_appointment_service)
        val tvDate: TextView = view.findViewById(R.id.tv_appointment_date)
        val tvTime: TextView = view.findViewById(R.id.tv_appointment_time)
        val tvCar: TextView = view.findViewById(R.id.tv_appointment_car)
        val tvStatus: TextView = view.findViewById(R.id.tv_appointment_status)
        val cardView: CardView = view.findViewById(R.id.card_appointment)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): AppointmentViewHolder {
        val view =
                LayoutInflater.from(parent.context)
                        .inflate(R.layout.item_appointment, parent, false)
        return AppointmentViewHolder(view)
    }

    override fun onBindViewHolder(holder: AppointmentViewHolder, position: Int) {
        val appointment = appointments[position]
        val context = holder.itemView.context

        // Get service names
        val serviceNames = appointment.services?.joinToString(", ") { it.name } ?: "No Service"
        holder.tvServiceName.text = serviceNames

        // Get date and time from timeslot
        // Get date and time from timeslot
        val date = appointment.timeslot?.startTime?.substringBefore("T") ?: "N/A"
        val startTime = appointment.timeslot?.startTime?.substringAfter("T") ?: ""
        val endTime = appointment.timeslot?.endTime?.substringAfter("T") ?: ""
        val time = "$startTime-$endTime"

        holder.tvDate.text = "Date: $date"
        holder.tvTime.text = "Time: $time"

        // Get car details - FIXED: use 'brand' instead of 'make'
        val carBrand = appointment.car?.brand ?: "N/A"
        val carModel = appointment.car?.model ?: "N/A"
        val carYear = appointment.car?.year ?: "N/A"

        holder.tvCar.text = "Car: $carBrand $carModel ($carYear)"

        val status = appointment.status ?: "Unknown"
        holder.tvStatus.text = "Status: $status"

        // Set status color
        val statusColor =
                when (status.uppercase()) {
                    "APPOINTMENTBOOKED" -> context.getColor(R.color.status_pending)
                    "CONFIRMED" -> context.getColor(R.color.status_confirmed)
                    "COMPLETED" -> context.getColor(R.color.status_completed)
                    "CANCELLED" -> context.getColor(R.color.status_cancelled)
                    "INREPAIR" -> context.getColor(R.color.mecanotun_orange)
                    else -> context.getColor(R.color.text_secondary)
                }
        holder.tvStatus.setTextColor(statusColor)
    }

    override fun getItemCount() = appointments.size

    fun updateAppointments(newAppointments: List<AppointmentDto>) {
        appointments = newAppointments
        notifyDataSetChanged()
    }
}
