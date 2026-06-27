package com.hotel.rfid.edge

import android.content.Context
import android.graphics.Color
import android.os.Bundle
import android.util.Log
import android.view.KeyEvent
import android.view.View
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.EditText
import android.widget.Spinner
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.rscja.deviceapi.RFIDWithUHFUART
import com.rscja.deviceapi.entity.UHFTAGInfo
import com.rscja.deviceapi.interfaces.IUHFInventoryCallback
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

enum class ScanState { INITIALIZING, READY, SCANNING, REVIEW, UPLOADING, SUCCESS, ERROR }

data class TagData(
    val epc: String,
    val firstSeenAt: String,
    var lastSeenAt: String,
    var readCount: Int,
    var latestRssi: Int,
    var strongestRssi: Int
)

data class ScanSession(
    val clientSessionId: String,
    val startedAt: String,
    var stoppedAt: String?,
    var transactionType: String,
    val tags: MutableMap<String, TagData>,
    var totalRawReads: Int
)

class MainActivity : AppCompatActivity() {

    private lateinit var etServerUrl: EditText
    private lateinit var etApiKey: EditText
    private lateinit var etReaderId: EditText
    private lateinit var btnTestConnection: Button
    private lateinit var btnSendDummy: Button

    private lateinit var spinnerTransactionType: Spinner
    private lateinit var btnStartInventory: Button
    private lateinit var btnStopInventory: Button
    private lateinit var tvInitStatus: TextView
    private lateinit var tvStateStatus: TextView
    private lateinit var tvSummary: TextView
    private lateinit var rvTags: RecyclerView
    private lateinit var btnClearSession: Button
    private lateinit var btnConfirmUpload: Button

    private lateinit var tagAdapter: TagAdapter

    private var mReader: RFIDWithUHFUART? = null
    private var currentState = ScanState.INITIALIZING
    private var activeSession: ScanSession? = null

    private val PREFS_NAME = "ChainwayPrefs"
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX", Locale.US)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        etServerUrl = findViewById(R.id.etServerUrl)
        etApiKey = findViewById(R.id.etApiKey)
        etReaderId = findViewById(R.id.etReaderId)
        btnTestConnection = findViewById(R.id.btnTestConnection)
        btnSendDummy = findViewById(R.id.btnSendDummy)

        spinnerTransactionType = findViewById(R.id.spinnerTransactionType)
        btnStartInventory = findViewById(R.id.btnStartInventory)
        btnStopInventory = findViewById(R.id.btnStopInventory)
        tvInitStatus = findViewById(R.id.tvInitStatus)
        tvStateStatus = findViewById(R.id.tvStateStatus)
        tvSummary = findViewById(R.id.tvSummary)
        rvTags = findViewById(R.id.rvTags)
        btnClearSession = findViewById(R.id.btnClearSession)
        btnConfirmUpload = findViewById(R.id.btnConfirmUpload)

        // Setup Spinner
        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, arrayOf("STOCK_COUNT", "LAUNDRY_SEND", "LAUNDRY_RETURN"))
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinnerTransactionType.adapter = adapter

        // Setup RecyclerView
        tagAdapter = TagAdapter(emptyList())
        rvTags.layoutManager = LinearLayoutManager(this)
        rvTags.adapter = tagAdapter

        loadPrefs()
        updateUIState(ScanState.INITIALIZING)

        btnTestConnection.setOnClickListener {
            savePrefs()
            testConnection()
        }
        btnSendDummy.setOnClickListener {
            savePrefs()
            sendDummySession()
        }
        btnStartInventory.setOnClickListener {
            if (currentState != ScanState.UPLOADING) {
                startInventory()
            }
        }
        btnStopInventory.setOnClickListener { stopInventory() }
        
        btnClearSession.setOnClickListener {
            activeSession = null
            tagAdapter.updateData(emptyList())
            tvSummary.text = "Reads: 0 | Unique: 0"
            updateUIState(ScanState.READY)
        }
        
        btnConfirmUpload.setOnClickListener {
            savePrefs()
            uploadSession()
        }

        initRfidAsync()
    }

    private fun loadPrefs() {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        etServerUrl.setText(prefs.getString("ServerUrl", "http://10.10.101.45:3000"))
        etApiKey.setText(prefs.getString("ApiKey", "local-demo-rfid-key"))
        etReaderId.setText(prefs.getString("ReaderId", "C5-DEMO-01"))
    }

    private fun savePrefs() {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        with(prefs.edit()) {
            putString("ServerUrl", etServerUrl.text.toString().trim())
            putString("ApiKey", etApiKey.text.toString().trim())
            putString("ReaderId", etReaderId.text.toString().trim())
            apply()
        }
    }

    private fun updateUIState(state: ScanState) {
        currentState = state
        runOnUiThread {
            tvStateStatus.text = "Status: ${state.name}"
            when (state) {
                ScanState.INITIALIZING -> {
                    btnStartInventory.isEnabled = false
                    btnStopInventory.isEnabled = false
                    btnClearSession.visibility = View.GONE
                    btnConfirmUpload.visibility = View.GONE
                    spinnerTransactionType.isEnabled = false
                }
                ScanState.READY -> {
                    btnStartInventory.isEnabled = true
                    btnStopInventory.isEnabled = false
                    btnClearSession.visibility = View.GONE
                    btnConfirmUpload.visibility = View.GONE
                    spinnerTransactionType.isEnabled = true
                }
                ScanState.SCANNING -> {
                    btnStartInventory.isEnabled = false
                    btnStopInventory.isEnabled = true
                    btnClearSession.visibility = View.GONE
                    btnConfirmUpload.visibility = View.GONE
                    spinnerTransactionType.isEnabled = false
                }
                ScanState.REVIEW -> {
                    btnStartInventory.isEnabled = true // Can resume
                    btnStopInventory.isEnabled = false
                    btnClearSession.visibility = View.VISIBLE
                    btnConfirmUpload.visibility = View.VISIBLE
                    btnConfirmUpload.isEnabled = true
                    spinnerTransactionType.isEnabled = true // Can change type before upload
                    tagAdapter.updateData(activeSession?.tags?.values?.toList() ?: emptyList())
                }
                ScanState.UPLOADING -> {
                    btnStartInventory.isEnabled = false
                    btnStopInventory.isEnabled = false
                    btnClearSession.visibility = View.VISIBLE
                    btnClearSession.isEnabled = false
                    btnConfirmUpload.visibility = View.VISIBLE
                    btnConfirmUpload.isEnabled = false
                    spinnerTransactionType.isEnabled = false
                }
                ScanState.SUCCESS -> {
                    btnStartInventory.isEnabled = false
                    btnStopInventory.isEnabled = false
                    btnClearSession.visibility = View.VISIBLE
                    btnClearSession.isEnabled = true
                    btnClearSession.text = "START NEW SESSION"
                    btnConfirmUpload.visibility = View.GONE
                    spinnerTransactionType.isEnabled = false
                }
                ScanState.ERROR -> {
                    btnStartInventory.isEnabled = false
                    btnStopInventory.isEnabled = false
                    btnClearSession.visibility = View.VISIBLE
                    btnClearSession.isEnabled = true
                    btnConfirmUpload.visibility = View.VISIBLE
                    btnConfirmUpload.isEnabled = true
                    btnConfirmUpload.text = "RETRY UPLOAD"
                    spinnerTransactionType.isEnabled = true
                }
            }
        }
    }

    private fun testConnection() {
        val urlString = etServerUrl.text.toString().trim()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val url = URL(urlString)
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "GET"
                conn.connectTimeout = 5000
                conn.readTimeout = 5000
                val responseCode = conn.responseCode
                withContext(Dispatchers.Main) {
                    tvStateStatus.text = "Test: HTTP $responseCode"
                }
                conn.disconnect()
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    tvStateStatus.text = "Test Error: ${e.message}"
                }
            }
        }
    }

    private fun sendDummySession() {
        val urlString = etServerUrl.text.toString().trim()
        val apiKey = etApiKey.text.toString().trim()
        val readerId = etReaderId.text.toString().trim()
        val endpoint = "$urlString/api/rfid/read-sessions"

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val url = URL(endpoint)
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json")
                conn.setRequestProperty("X-RFID-API-Key", apiKey)
                conn.doOutput = true
                conn.connectTimeout = 5000
                conn.readTimeout = 5000

                val clientSessionId = "C5-DUMMY-" + UUID.randomUUID().toString().substring(0, 8)
                val timeNow = dateFormat.format(Date())

                val jsonPayload = JSONObject().apply {
                    put("clientSessionId", clientSessionId)
                    put("readerId", readerId)
                    put("readerType", "HANDHELD")
                    put("operationMode", "MANUAL")
                    put("dataSource", "LIVE_DEVICE")
                    put("checkpoint", "LINEN_STORAGE")
                    put("transactionType", "STOCK_COUNT")
                    put("operatorName", "Demo Operator")
                    put("startedAt", timeNow)
                    put("completedAt", timeNow)
                    
                    val tagsArray = JSONArray()
                    val tag1 = JSONObject().apply {
                        put("epc", "EPC30080001")
                        put("rssi", -48)
                        put("readCount", 1)
                    }
                    tagsArray.put(tag1)
                    put("tags", tagsArray)
                }

                val outputStream = OutputStreamWriter(conn.outputStream)
                outputStream.write(jsonPayload.toString())
                outputStream.flush()
                outputStream.close()

                val responseCode = conn.responseCode
                val responseMessage = conn.responseMessage
                withContext(Dispatchers.Main) {
                    tvStateStatus.text = "Dummy: HTTP $responseCode $responseMessage"
                }
                conn.disconnect()
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    tvStateStatus.text = "Dummy Error: ${e.message}"
                }
            }
        }
    }

    private fun initRfidAsync() {
        updateUIState(ScanState.INITIALIZING)
        tvInitStatus.text = "RFID Init: In Progress..."
        tvInitStatus.setTextColor(Color.parseColor("#FFA500"))
        
        CoroutineScope(Dispatchers.IO).launch {
            try {
                mReader = RFIDWithUHFUART.getInstance()
                if (mReader != null) {
                    val initResult = mReader!!.init(this@MainActivity)
                    withContext(Dispatchers.Main) {
                        if (initResult) {
                            tvInitStatus.text = "RFID Init: SUCCESS (${mReader!!.version})"
                            tvInitStatus.setTextColor(Color.parseColor("#008000"))
                            updateUIState(ScanState.READY)
                        } else {
                            tvInitStatus.text = "RFID Init: FAILED"
                            tvInitStatus.setTextColor(Color.RED)
                        }
                    }
                } else {
                    withContext(Dispatchers.Main) {
                        tvInitStatus.text = "RFID Init: FAILED (Instance null)"
                        tvInitStatus.setTextColor(Color.RED)
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    tvInitStatus.text = "RFID Init: ERROR"
                    tvInitStatus.setTextColor(Color.RED)
                }
            }
        }
    }

    private fun startInventory() {
        if (mReader == null || currentState == ScanState.SCANNING) return
        
        // If we are starting fresh (not resuming)
        if (activeSession == null || currentState == ScanState.READY || currentState == ScanState.SUCCESS) {
            val type = spinnerTransactionType.selectedItem.toString()
            val timeNow = dateFormat.format(Date())
            activeSession = ScanSession(
                clientSessionId = "C5-HANDHELD-" + UUID.randomUUID().toString().substring(0, 8),
                startedAt = timeNow,
                stoppedAt = null,
                transactionType = type,
                tags = mutableMapOf(),
                totalRawReads = 0
            )
            tvSummary.text = "Reads: 0 | Unique: 0"
            tagAdapter.updateData(emptyList())
        }

        mReader!!.setInventoryCallback(object : IUHFInventoryCallback {
            override fun callback(info: UHFTAGInfo?) {
                if (info != null && info.epc != null) {
                    val rawEpc = info.epc.trim().uppercase()
                    if (rawEpc.isEmpty()) return
                    
                    val rssiStr = info.rssi ?: "0"
                    // Parse RSSI, handle formats like "-48.20" by picking integer part or parsing float
                    val rssi = try { rssiStr.toFloat().toInt() } catch (e: Exception) { 0 }
                    val timeNow = dateFormat.format(Date())

                    activeSession?.let { session ->
                        session.totalRawReads += 1
                        val existingTag = session.tags[rawEpc]
                        if (existingTag == null) {
                            session.tags[rawEpc] = TagData(rawEpc, timeNow, timeNow, 1, rssi, rssi)
                        } else {
                            existingTag.lastSeenAt = timeNow
                            existingTag.readCount += 1
                            existingTag.latestRssi = rssi
                            if (rssi > existingTag.strongestRssi) {
                                existingTag.strongestRssi = rssi
                            }
                        }
                    }
                    
                    // Throttle UI updates to just summary text
                    runOnUiThread {
                        val session = activeSession
                        if (session != null) {
                            tvSummary.text = "Reads: ${session.totalRawReads} | Unique: ${session.tags.size}"
                        }
                    }
                }
            }
        })
        
        if (mReader!!.startInventoryTag()) {
            updateUIState(ScanState.SCANNING)
        } else {
            tvStateStatus.text = "Status: FAILED TO START SCAN"
        }
    }

    private fun stopInventory() {
        if (mReader == null || currentState != ScanState.SCANNING) return
        if (mReader!!.stopInventory()) {
            activeSession?.stoppedAt = dateFormat.format(Date())
            updateUIState(ScanState.REVIEW)
        }
    }

    private fun uploadSession() {
        if (activeSession == null || activeSession!!.tags.isEmpty()) return
        
        val urlString = etServerUrl.text.toString().trim()
        val apiKey = etApiKey.text.toString().trim()
        val readerId = etReaderId.text.toString().trim()
        val endpoint = "$urlString/api/rfid/read-sessions"

        // Update transaction type to match spinner in case it was changed during review
        activeSession!!.transactionType = spinnerTransactionType.selectedItem.toString()

        updateUIState(ScanState.UPLOADING)

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val url = URL(endpoint)
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json")
                conn.setRequestProperty("X-RFID-API-Key", apiKey)
                conn.doOutput = true
                conn.connectTimeout = 8000
                conn.readTimeout = 8000

                val session = activeSession!!
                val jsonPayload = JSONObject().apply {
                    put("clientSessionId", session.clientSessionId)
                    put("readerId", readerId)
                    put("readerType", "HANDHELD")
                    put("operationMode", "MANUAL")
                    put("dataSource", "LIVE_DEVICE")
                    put("checkpoint", "LINEN_STORAGE")
                    put("transactionType", session.transactionType)
                    put("operatorName", "Demo Operator")
                    put("startedAt", session.startedAt)
                    put("completedAt", session.stoppedAt ?: dateFormat.format(Date()))
                    
                    val tagsArray = JSONArray()
                    session.tags.values.forEach { tag ->
                        val tagObj = JSONObject().apply {
                            put("epc", tag.epc)
                            put("rssi", tag.strongestRssi)
                            put("readCount", tag.readCount)
                            put("firstSeenAt", tag.firstSeenAt)
                            put("lastSeenAt", tag.lastSeenAt)
                        }
                        tagsArray.put(tagObj)
                    }
                    put("tags", tagsArray)
                }

                val outputStream = OutputStreamWriter(conn.outputStream)
                outputStream.write(jsonPayload.toString())
                outputStream.flush()
                outputStream.close()

                val responseCode = conn.responseCode
                val inputStream = if (responseCode in 200..299) conn.inputStream else conn.errorStream
                val reader = BufferedReader(InputStreamReader(inputStream))
                val responseStr = reader.use { it.readText() }

                withContext(Dispatchers.Main) {
                    if (responseCode in 200..299) {
                        try {
                            val responseJson = JSONObject(responseStr)
                            if (responseJson.optBoolean("success")) {
                                val isReplay = responseJson.optBoolean("idempotentReplay", false)
                                tvStateStatus.text = if (isReplay) "Status: SUCCESS (Replay)" else "Status: SUCCESS"
                                updateUIState(ScanState.SUCCESS)
                            } else {
                                tvStateStatus.text = "Status: API Error"
                                updateUIState(ScanState.ERROR)
                            }
                        } catch (e: Exception) {
                            updateUIState(ScanState.SUCCESS) // Assuming HTTP 200 means success even if JSON parsing fails
                        }
                    } else {
                        tvStateStatus.text = "Status: HTTP $responseCode"
                        updateUIState(ScanState.ERROR)
                    }
                }
                conn.disconnect()
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    tvStateStatus.text = "Status: Network Error"
                    updateUIState(ScanState.ERROR)
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        if (mReader != null) {
            if (currentState == ScanState.SCANNING) {
                mReader!!.stopInventory()
            }
            mReader!!.free()
            mReader = null
        }
    }

    override fun onPause() {
        super.onPause()
        if (currentState == ScanState.SCANNING) {
            stopInventory()
        }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == 139 || keyCode == 280 || keyCode == 293 || keyCode == 140) {
            if (event?.repeatCount == 0 && currentState != ScanState.SCANNING && currentState != ScanState.UPLOADING) {
                startInventory()
            }
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onKeyUp(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == 139 || keyCode == 280 || keyCode == 293 || keyCode == 140) {
            if (currentState == ScanState.SCANNING) {
                stopInventory()
            }
            return true
        }
        return super.onKeyUp(keyCode, event)
    }
}
