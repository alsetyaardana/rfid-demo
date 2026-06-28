package com.hotel.rfid.edge

import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView

class TagAdapter(private var tags: List<TagData>) : RecyclerView.Adapter<TagAdapter.TagViewHolder>() {

    class TagViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvEpc: TextView = view.findViewById(R.id.tvEpc)
        val tvRssi: TextView = view.findViewById(R.id.tvRssi)
        val tvCount: TextView = view.findViewById(R.id.tvCount)
        val tvStatus: TextView = view.findViewById(R.id.tvStatus)
        val tvReason: TextView = view.findViewById(R.id.tvReason)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): TagViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_tag, parent, false)
        return TagViewHolder(view)
    }

    override fun onBindViewHolder(holder: TagViewHolder, position: Int) {
        val tag = tags[position]
        
        // Show EPC or Linen Code
        if (!tag.linenCode.isNullOrEmpty()) {
            holder.tvEpc.text = "${tag.linenCode} (${tag.epc})"
        } else {
            holder.tvEpc.text = tag.epc
        }

        holder.tvRssi.text = "RSSI: ${tag.strongestRssi} (latest: ${tag.latestRssi})"
        holder.tvCount.text = "x${tag.readCount}"

        // Handle Status Coloring
        if (!tag.status.isNullOrEmpty()) {
            holder.tvStatus.visibility = View.VISIBLE
            holder.tvStatus.text = tag.status
            
            when (tag.status) {
                "ACCEPTED" -> holder.tvStatus.setTextColor(Color.parseColor("#4CAF50"))
                "UNKNOWN_EPC" -> holder.tvStatus.setTextColor(Color.parseColor("#9E9E9E"))
                else -> holder.tvStatus.setTextColor(Color.parseColor("#F44336")) // REJECTED, WRONG_BATCH, ALREADY_RETURNED
            }
        } else {
            holder.tvStatus.visibility = View.GONE
        }

        // Handle Reason visibility
        if (!tag.reason.isNullOrEmpty()) {
            holder.tvReason.visibility = View.VISIBLE
            holder.tvReason.text = tag.reason
        } else {
            holder.tvReason.visibility = View.GONE
        }
    }

    override fun getItemCount() = tags.size

    fun updateData(newTags: List<TagData>) {
        this.tags = newTags
        notifyDataSetChanged()
    }
}
