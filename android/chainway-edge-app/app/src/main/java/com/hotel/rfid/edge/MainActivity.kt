package com.hotel.rfid.edge

import android.content.Context
import android.util.Log
import android.graphics.Color
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.inputmethod.InputMethodManager
import android.widget.AdapterView
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

enum class PowerProfile(val value: Int, val label: String) {
    NEAR(5, "Near"),
    MEDIUM(18, "Medium"),
    FAR(30, "Far")
}

data class TagData(
    val epc: String,
    val firstSeenAt: String,
    var lastSeenAt: String,
    var readCount: Int,
    var latestRssi: Int,
    var strongestRssi: Int,
    var linenCode: String? = null,
    var linenType: String? = null,
    var status: String? = null,
    var reason: String? = null
)

data class ScanSession(
    val clientSessionId: String,
    val startedAt: String,
    var stoppedAt: String?,
    var transactionType: String,
    val laundryBatchCode: String?,
    val operatorName: String,
    val checkpoint: String,
    val tagsMap: MutableMap<String, TagData>,
    val tagsList: MutableList<TagData>,
    var totalRawReads: Int
)

class MainActivity : AppCompatActivity() {

    private lateinit var etServerUrl: EditText
    private lateinit var etApiKey: EditText
    private lateinit var etReaderId: EditText
    private lateinit var btnTestApi: Button

    private lateinit var etOperatorName: EditText
    private lateinit var etCheckpoint: EditText
    private lateinit var etBatchCode: EditText
    private lateinit var layoutBatchCode: View
    private lateinit var layoutSettings: View
    private lateinit var btnToggleSettings: Button
    private lateinit var btnSaveSettings: Button
    private lateinit var spinnerTransactionType: Spinner
    private lateinit var spinnerPowerProfile: Spinner

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
        btnTestApi = findViewById(R.id.btnTestApi)

        etOperatorName = findViewById(R.id.etOperatorName)
        etCheckpoint = findViewById(R.id.etCheckpoint)
        etBatchCode = findViewById(R.id.etBatchCode)
        layoutBatchCode = findViewById(R.id.layoutBatchCode)
        layoutSettings = findViewById(R.id.layoutSettings)
        btnToggleSettings = findViewById(R.id.btnToggleSettings)
        btnSaveSettings = findViewById(R.id.btnSaveSettings)
        spinnerTransactionType = findViewById(R.id.spinnerTransactionType)
        spinnerPowerProfile = findViewById(R.id.spinnerPowerProfile)

        btnStartInventory = findViewById(R.id.btnStartInventory)
        btnStopInventory = findViewById(R.id.btnStopInventory)
        tvInitStatus = findViewById(R.id.tvInitStatus)
        tvStateStatus = findViewById(R.id.tvStateStatus)
        tvSummary = findViewById(R.id.tvSummary)
        rvTags = findViewById(R.id.rvTags)
        btnClearSession = findViewById(R.id.btnClearSession)
        btnConfirmUpload = findViewById(R.id.btnConfirmUpload)

        btnToggleSettings.setOnClickListener {
            if (layoutSettings.visibility == View.VISIBLE) {
                layoutSettings.visibility = View.GONE
            } else {
                layoutSettings.visibility = View.VISIBLE
            }
        }

        btnSaveSettings.setOnClickListener {
            savePrefs()
            layoutSettings.visibility = View.GONE
            val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
            imm.hideSoftInputFromWindow(it.windowToken, 0)
        }

        // Setup Spinner
        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, arrayOf("STOCK_COUNT", "SEND_TO_LAUNDRY", "RETURN_FROM_LAUNDRY"))
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinnerTransactionType.adapter = adapter
        
        spinnerTransactionType.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                val selected = parent?.getItemAtPosition(position).toString()
                if (selected == "STOCK_COUNT") {
                    layoutBatchCode.visibility = View.GONE
                } else {
                    layoutBatchCode.visibility = View.VISIBLE
                }
            }
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }

        val powerAdapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, PowerProfile.values().map { it.label })
        powerAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinnerPowerProfile.adapter = powerAdapter

        // Setup RecyclerView
        tagAdapter = TagAdapter(emptyList())
        rvTags.layoutManager = LinearLayoutManager(this)
        rvTags.adapter = tagAdapter

        loadPrefs()
        updateUIState(ScanState.INITIALIZING)

        btnTestApi.setOnClickListener {
            savePrefs()
            testApi()
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
            loadPrefs()
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
        etOperatorName.setText(prefs.getString("OperatorName", "Demo Operator"))
        etCheckpoint.setText(prefs.getString("Checkpoint", "LINEN_STORAGE"))
        etBatchCode.setText(prefs.getString("BatchCode", ""))
        val profileName = prefs.getString("PowerProfile", PowerProfile.MEDIUM.name) ?: PowerProfile.MEDIUM.name
        val profileIndex = PowerProfile.values().indexOfFirst { it.name == profileName }
        spinnerPowerProfile.setSelection(if (profileIndex >= 0) profileIndex else PowerProfile.MEDIUM.ordinal)
    }

    private fun savePrefs() {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        with(prefs.edit()) {
            putString("ServerUrl", etServerUrl.text.toString().trim())
            putString("ApiKey", etApiKey.text.toString().trim())
            putString("ReaderId", etReaderId.text.toString().trim())
            putString("OperatorName", etOperatorName.text.toString().trim())
            putString("Checkpoint", etCheckpoint.text.toString().trim())
            putString("BatchCode", etBatchCode.text.toString().trim())
            val selectedProfile = PowerProfile.values().getOrElse(spinnerPowerProfile.selectedItemPosition) { PowerProfile.MEDIUM }
            putString("PowerProfile", selectedProfile.name)
            apply()
        }
    }

    private fun validatePreScan(): Boolean {
        val readerId = etReaderId.text.toString().trim()
        val checkpoint = etCheckpoint.text.toString().trim()
        val operator = etOperatorName.text.toString().trim()
        val type = spinnerTransactionType.selectedItem.toString()
        val batchCode = etBatchCode.text.toString().trim()

        var isValid = true
        var firstInvalidView: EditText? = null

        if (readerId.isEmpty()) {
            etReaderId.error = "Required"
            if (firstInvalidView == null) firstInvalidView = etReaderId
            isValid = false
        }
        if (operator.isEmpty()) {
            etOperatorName.error = "Required"
            if (firstInvalidView == null) firstInvalidView = etOperatorName
            isValid = false
        }
        if (checkpoint.isEmpty()) {
            etCheckpoint.error = "Required"
            if (firstInvalidView == null) firstInvalidView = etCheckpoint
            isValid = false
        }
        if (type != "STOCK_COUNT" && batchCode.isEmpty()) {
            etBatchCode.error = "Required"
            if (firstInvalidView == null) firstInvalidView = etBatchCode
            isValid = false
        }

        if (!isValid) {
            tvStateStatus.text = "Status: Missing required fields"
            layoutSettings.visibility = View.VISIBLE
            firstInvalidView?.requestFocus()
        }
        return isValid
    }

    private fun updateUIState(state: ScanState) {
        currentState = state
        runOnUiThread {
            if (state != ScanState.ERROR && !tvStateStatus.text.startsWith("Status: API Error") && !tvStateStatus.text.startsWith("Status: SUCCESS")) {
                tvStateStatus.text = "Status: ${state.name}"
            }
            
            when (state) {
                ScanState.INITIALIZING -> {
                    btnStartInventory.isEnabled = false
                    btnStopInventory.isEnabled = false
                    btnClearSession.visibility = View.GONE
                    btnConfirmUpload.visibility = View.GONE
                    spinnerTransactionType.isEnabled = false
                    etOperatorName.isEnabled = false
                    etCheckpoint.isEnabled = false
                    etBatchCode.isEnabled = false
                }
                ScanState.READY -> {
                    btnStartInventory.isEnabled = true
                    btnStopInventory.isEnabled = false
                    btnClearSession.visibility = View.GONE
                    btnConfirmUpload.visibility = View.GONE
                    spinnerTransactionType.isEnabled = true
                    etOperatorName.isEnabled = true
                    etCheckpoint.isEnabled = true
                    etBatchCode.isEnabled = true
                }
                ScanState.SCANNING -> {
                    btnStartInventory.isEnabled = false
                    btnStopInventory.isEnabled = true
                    btnClearSession.visibility = View.GONE
                    btnConfirmUpload.visibility = View.GONE
                    spinnerTransactionType.isEnabled = false
                    etOperatorName.isEnabled = false
                    etCheckpoint.isEnabled = false
                    etBatchCode.isEnabled = false
                }
                ScanState.REVIEW -> {
                    btnStartInventory.isEnabled = true // Can resume
                    btnStopInventory.isEnabled = false
                    btnClearSession.visibility = View.VISIBLE
                    btnConfirmUpload.visibility = View.VISIBLE
                    btnConfirmUpload.isEnabled = true
                    spinnerTransactionType.isEnabled = false // Don't let them change type after scan starts
                    etOperatorName.isEnabled = true
                    etCheckpoint.isEnabled = true
                    etBatchCode.isEnabled = true
                    
                    val session = activeSession
                    if (session != null) {
                        val batchText = if (session.transactionType != "STOCK_COUNT") {
                            val currentBatch = etBatchCode.text.toString().trim()
                            if (currentBatch.isNotEmpty()) "\nBatch: $currentBatch" else ""
                        } else ""
                        tvSummary.text = "Reads: ${session.totalRawReads} | Unique: ${session.tagsList.size}$batchText"
                    }
                    tagAdapter.updateData(activeSession?.tagsList ?: emptyList())
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
                    tagAdapter.updateData(activeSession?.tagsList ?: emptyList())
                }
                ScanState.ERROR -> {
                    btnStartInventory.isEnabled = false
                    btnStopInventory.isEnabled = false
                    btnClearSession.visibility = View.VISIBLE
                    btnClearSession.isEnabled = true
                    btnConfirmUpload.visibility = View.VISIBLE
                    btnConfirmUpload.isEnabled = true
                    btnConfirmUpload.text = "RETRY UPLOAD"
                    spinnerTransactionType.isEnabled = false
                }
            }
        }
    }

    private fun testApi() {
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
                conn.setRequestProperty("X-Demo-Mode", "HARDWARE")
                conn.doOutput = true
                conn.connectTimeout = 5000
                conn.readTimeout = 5000

                val clientSessionId = "C5-TEST-" + UUID.randomUUID().toString().substring(0, 8)
                val timeNow = dateFormat.format(Date())

                val jsonPayload = JSONObject().apply {
                    put("clientSessionId", clientSessionId)
                    put("readerId", readerId)
                    put("readerType", "HANDHELD")
                    put("operationMode", "MANUAL")
                    put("dataSource", "LIVE_DEVICE")
                    put("checkpoint", "TEST_CHECKPOINT")
                    put("transactionType", "STOCK_COUNT") // Fixed non-mutating transaction
                    put("operatorName", "Test Operator")
                    put("startedAt", timeNow)
                    put("completedAt", timeNow)
                    
                    val tagsArray = JSONArray()
                    val tag1 = JSONObject().apply {
                        put("epc", "EPC_TEST_001")
                        put("rssi", -50)
                        put("readCount", 1)
                        put("firstSeenAt", timeNow)
                        put("lastSeenAt", timeNow)
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
                    tvStateStatus.text = "Test API: HTTP $responseCode $responseMessage"
                }
                conn.disconnect()
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    tvStateStatus.text = "Test API Error: ${e.message}"
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
        
        if (!validatePreScan()) {
            return
        }
        
        // If we are starting fresh (not resuming)
        if (activeSession == null || currentState == ScanState.READY || currentState == ScanState.SUCCESS) {
            val type = spinnerTransactionType.selectedItem.toString()
            val timeNow = dateFormat.format(Date())
            val batchCode = etBatchCode.text.toString().trim()
            
            activeSession = ScanSession(
                clientSessionId = "C5-HANDHELD-" + UUID.randomUUID().toString().substring(0, 8),
                startedAt = timeNow,
                stoppedAt = null,
                transactionType = type,
                laundryBatchCode = if (type == "STOCK_COUNT") null else batchCode,
                operatorName = etOperatorName.text.toString().trim(),
                checkpoint = etCheckpoint.text.toString().trim(),
                tagsMap = mutableMapOf(),
                tagsList = mutableListOf(),
                totalRawReads = 0
            )
            tvSummary.text = "Reads: 0 | Unique: 0"
            tagAdapter.updateData(activeSession!!.tagsList)
        }

        mReader!!.setInventoryCallback(object : IUHFInventoryCallback {
            override fun callback(info: UHFTAGInfo?) {
                if (info != null && info.epc != null) {
                    val rawEpc = info.epc.trim().uppercase()
                    if (rawEpc.isEmpty()) return
                    
                    val rssiStr = info.rssi ?: "0"
                    val rssi = try { rssiStr.toFloat().toInt() } catch (e: Exception) { 0 }
                    val timeNow = dateFormat.format(Date())

                    runOnUiThread {
                        val session = activeSession ?: return@runOnUiThread
                        session.totalRawReads += 1
                        
                        val existingTag = session.tagsMap[rawEpc]
                        var isNew = false
                        var index = -1
                        if (existingTag == null) {
                            val newTag = TagData(
                                epc = rawEpc,
                                firstSeenAt = timeNow,
                                lastSeenAt = timeNow,
                                readCount = 1,
                                latestRssi = rssi,
                                strongestRssi = rssi
                            )
                            session.tagsMap[rawEpc] = newTag
                            session.tagsList.add(newTag)
                            isNew = true
                            index = session.tagsList.size - 1
                        } else {
                            existingTag.lastSeenAt = timeNow
                            existingTag.readCount += 1
                            existingTag.latestRssi = rssi
                            if (rssi > existingTag.strongestRssi) {
                                existingTag.strongestRssi = rssi
                            }
                            index = session.tagsList.indexOf(existingTag)
                        }
                        
                        tvSummary.text = "Reads: ${session.totalRawReads} | Unique: ${session.tagsList.size}"
                        if (isNew) {
                            tagAdapter.notifyItemInserted(index)
                        } else if (index != -1) {
                            tagAdapter.notifyItemChanged(index)
                        }
                    }
                }
            }
        })
        
        val profileName = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getString("PowerProfile", PowerProfile.MEDIUM.name) ?: PowerProfile.MEDIUM.name
        val profile = PowerProfile.values().find { it.name == profileName } ?: PowerProfile.MEDIUM
        val powerSet = try {
            mReader!!.setPower(profile.value)
        } catch (e: Exception) {
            Log.e("MainActivity", "setPower exception: ${e.javaClass.simpleName}")
            tvStateStatus.text = "Status: FAILED TO SET POWER"
            return
        }
        if (!powerSet) {
            tvStateStatus.text = "Status: FAILED TO SET POWER"
            return
        }

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
        if (activeSession == null || activeSession!!.tagsList.isEmpty()) return
        val session = activeSession!!
        
        val actualBatchCode = etBatchCode.text.toString().trim()
        if (session.transactionType != "STOCK_COUNT" && actualBatchCode.isEmpty()) {
            tvStateStatus.text = "Status: Missing Batch Code for Upload"
            layoutSettings.visibility = View.VISIBLE
            etBatchCode.error = "Required"
            etBatchCode.requestFocus()
            return
        }
        
        val urlString = etServerUrl.text.toString().trim()
        val apiKey = etApiKey.text.toString().trim()
        val readerId = etReaderId.text.toString().trim()
        val endpoint = "$urlString/api/rfid/read-sessions"

        updateUIState(ScanState.UPLOADING)

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val url = URL(endpoint)
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json")
                conn.setRequestProperty("X-RFID-API-Key", apiKey)
                conn.setRequestProperty("X-Demo-Mode", "HARDWARE")
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
                    val actualCheckpoint = etCheckpoint.text.toString().trim()
                    put("checkpoint", if (actualCheckpoint.isNotEmpty()) actualCheckpoint else session.checkpoint)
                    put("transactionType", session.transactionType)
                    
                    if (session.transactionType != "STOCK_COUNT") {
                        put("laundryBatchCode", actualBatchCode)
                    }
                    
                    val actualOperator = etOperatorName.text.toString().trim()
                    if (actualOperator.isNotEmpty()) {
                        put("operatorName", actualOperator)
                    } else if (session.operatorName.isNotEmpty()) {
                        put("operatorName", session.operatorName)
                    }
                    
                    put("startedAt", session.startedAt)
                    put("completedAt", session.stoppedAt ?: dateFormat.format(Date()))
                    
                    val tagsArray = JSONArray()
                    session.tagsList.forEach { tag ->
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
                                
                                // Parse summary
                                val summary = responseJson.optJSONObject("summary")
                                if (summary != null) {
                                    val accepted = summary.optInt("acceptedCount", 0)
                                    val rejected = summary.optInt("rejectedCount", 0)
                                    val unknown = summary.optInt("unknownCount", 0)
                                    tvSummary.text = "Success! Accepted: $accepted | Rejected: $rejected | Unknown: $unknown"
                                }
                                
                                // Parse items
                                val itemsArray = responseJson.optJSONArray("items")
                                if (itemsArray != null) {
                                    for (i in 0 until itemsArray.length()) {
                                        val item = itemsArray.getJSONObject(i)
                                        val epc = item.optString("epc")
                                        val tagData = activeSession?.tagsMap?.get(epc)
                                        if (tagData != null) {
                                            tagData.status = item.optString("status", null)
                                            tagData.reason = item.optString("reason", null)
                                            if (tagData.reason == "null") tagData.reason = null // org.json parses null literally sometimes
                                            tagData.linenCode = item.optString("linenCode", null)
                                            if (tagData.linenCode == "null") tagData.linenCode = null
                                            tagData.linenType = item.optString("linenType", null)
                                            if (tagData.linenType == "null") tagData.linenType = null
                                        }
                                    }
                                }

                                tvStateStatus.text = if (isReplay) "Status: SUCCESS (Replay)" else "Status: SUCCESS"
                                updateUIState(ScanState.SUCCESS)
                            } else {
                                val errorMsg = responseJson.optJSONObject("error")?.optString("message", "API Error")
                                tvStateStatus.text = "Status: API Error - $errorMsg"
                                updateUIState(ScanState.ERROR)
                            }
                        } catch (e: Exception) {
                            tvStateStatus.text = "Status: API Parse Error"
                            updateUIState(ScanState.ERROR)
                        }
                    } else {
                        var errorMsg = "HTTP $responseCode"
                        try {
                            val responseJson = JSONObject(responseStr)
                            errorMsg = responseJson.optJSONObject("error")?.optString("message", errorMsg) ?: errorMsg
                        } catch (e: Exception) {}
                        
                        tvStateStatus.text = "Status: API Error - $errorMsg"
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
