package com.mecanotun.mobile.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.mecanotun.mobile.R
import com.mecanotun.mobile.api.CarDto

class VehiclesAdapter(
        private val vehicles: List<CarDto>,
        private val onEdit: (CarDto) -> Unit,
        private val onDelete: (CarDto) -> Unit
) : RecyclerView.Adapter<VehiclesAdapter.VehicleViewHolder>() {

    class VehicleViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvBrand: TextView = view.findViewById(R.id.tv_brand)
        val tvModel: TextView = view.findViewById(R.id.tv_model)
        val tvYear: TextView = view.findViewById(R.id.tv_year)
        val tvVin: TextView = view.findViewById(R.id.tv_vin)
        val btnEdit: ImageButton = view.findViewById(R.id.btn_edit)
        val btnDelete: ImageButton = view.findViewById(R.id.btn_delete)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VehicleViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_vehicle, parent, false)
        return VehicleViewHolder(view)
    }

    override fun onBindViewHolder(holder: VehicleViewHolder, position: Int) {
        val vehicle = vehicles[position]

        holder.tvBrand.text = vehicle.brand
        holder.tvModel.text = vehicle.model
        holder.tvYear.text = if (vehicle.year != null) "${vehicle.year}" else "N/A"
        holder.tvVin.text = "VIN: ${vehicle.vin ?: "Not specified"}"

        holder.btnEdit.setOnClickListener { onEdit(vehicle) }
        holder.btnDelete.setOnClickListener { onDelete(vehicle) }
    }

    override fun getItemCount() = vehicles.size
}
