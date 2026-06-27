package com.hotel.rfid.edge

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
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): TagViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_tag, parent, false)
        return TagViewHolder(view)
    }

    override fun onBindViewHolder(holder: TagViewHolder, position: Int) {
        val tag = tags[position]
        holder.tvEpc.text = tag.epc
        holder.tvRssi.text = "RSSI: ${tag.strongestRssi} (latest: ${tag.latestRssi})"
        holder.tvCount.text = "x${tag.readCount}"
    }

    override fun getItemCount() = tags.size

    fun updateData(newTags: List<TagData>) {
        this.tags = newTags
        notifyDataSetChanged()
    }
}
