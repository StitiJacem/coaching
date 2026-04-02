package com.mecanotun.mobile.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.mecanotun.mobile.R
import com.mecanotun.mobile.api.ServiceDto

class ServicesAdapter(
        private val services: List<ServiceDto>,
        private val onBookClick: (ServiceDto) -> Unit
) : RecyclerView.Adapter<ServicesAdapter.ServiceViewHolder>() {

    class ServiceViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvName: TextView = view.findViewById(R.id.tv_service_name)
        val tvDescription: TextView = view.findViewById(R.id.tv_service_description)
        val tvPrice: TextView = view.findViewById(R.id.tv_service_price)
        val tvDuration: TextView = view.findViewById(R.id.tv_service_duration)
        val btnBook: Button = view.findViewById(R.id.btn_book_service)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ServiceViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_service, parent, false)
        return ServiceViewHolder(view)
    }

    override fun onBindViewHolder(holder: ServiceViewHolder, position: Int) {
        val service = services[position]
        holder.tvName.text = service.name
        holder.tvDescription.text = service.description
        holder.tvPrice.text =
                holder.itemView.context.getString(R.string.service_price, service.price.toDouble())
        holder.tvDuration.text =
                holder.itemView.context.getString(R.string.service_duration, service.duration)
        holder.btnBook.setOnClickListener { onBookClick(service) }
    }

    override fun getItemCount() = services.size
}
