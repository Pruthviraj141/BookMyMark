package com.mybookmark.app

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import org.json.JSONArray
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors
import java.util.regex.Pattern

class ShareReceiverActivity : AppCompatActivity() {

    private val executor = Executors.newSingleThreadExecutor()
    private val mainHandler = Handler(Looper.getMainLooper())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handleShareIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleShareIntent(intent)
    }

    private fun handleShareIntent(intent: Intent?) {
        if (intent == null) {
            finish()
            return
        }

        val action = intent.action
        val type = intent.type

        if (Intent.ACTION_SEND == action && type != null && type.startsWith("text/")) {
            val sharedText = intent.getStringExtra(Intent.EXTRA_TEXT)
                ?: intent.getStringExtra(Intent.EXTRA_SUBJECT)
                ?: getClipDataText(intent)

            if (!sharedText.isNullOrBlank()) {
                val extractedUrl = extractUrl(sharedText)
                if (extractedUrl != null) {
                    processBookmark(extractedUrl, sharedText)
                    return
                }
            }
        }

        Toast.makeText(this, "No valid link found to save", Toast.LENGTH_SHORT).show()
        finish()
    }

    private fun getClipDataText(intent: Intent): String? {
        val clipData = intent.clipData
        if (clipData != null && clipData.itemCount > 0) {
            val item = clipData.getItemAt(0)
            return item.text?.toString() ?: item.uri?.toString()
        }
        return null
    }

    private fun extractUrl(text: stringText): String? {
        val urlPattern = Pattern.compile(
            "(https?://[a-zA-Z0-9+&@#/%?=~_|!:,.;]*[a-zA-Z0-9+&@#/%=~_|])",
            Pattern.CASE_INSENSITIVE
        )
        val matcher = urlPattern.matcher(text)
        if (matcher.find()) {
            var url = matcher.group(1) ?: return null
            // Clean trailing punctuation
            url = url.replace(Regex("[.,!?;:)>]+$"), "")
            return url
        }
        return null
    }

    private fun processBookmark(url: String, sharedText: String) {
        val prefs = NativeBridgePlugin.getPrefs(this)
        val token = prefs.getString(NativeBridgePlugin.KEY_AUTH_TOKEN, null)
        val baseUrl = prefs.getString(NativeBridgePlugin.KEY_API_BASE_URL, null) ?: "http://192.168.1.11:3000"

        // If not logged in, preserve share and open MainActivity to login screen
        if (token.isNullOrBlank()) {
            enqueuePendingShare(url, sharedText)
            val launchIntent = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtra("pending_share_url", url)
                putExtra("pending_share_text", sharedText)
            }
            startActivity(launchIntent)
            Toast.makeText(this, "Log in to save to MyBookMark", Toast.LENGTH_LONG).show()
            finish()
            return
        }

        // Authenticated user: process in background without opening MainActivity
        executor.execute {
            var success = false
            var isQueuedOffline = false

            try {
                val endpoint = URL("$baseUrl/api/bookmarks")
                val conn = endpoint.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json")
                conn.setRequestProperty("Authorization", "Bearer $token")
                conn.setRequestProperty("Accept", "application/json")
                conn.connectTimeout = 7000
                conn.readTimeout = 9000
                conn.doOutput = true

                val payload = JSONObject().apply {
                    put("url", url)
                    put("sharedText", sharedText)
                }

                OutputStreamWriter(conn.outputStream).use { writer ->
                    writer.write(payload.toString())
                    writer.flush()
                }

                val responseCode = conn.responseCode
                if (responseCode == 200 || responseCode == 201) {
                    success = true
                } else {
                    isQueuedOffline = true
                    enqueuePendingShare(url, sharedText)
                }
            } catch (e: Exception) {
                // Network unreachable or local connection error
                isQueuedOffline = true
                enqueuePendingShare(url, sharedText)
            }

            mainHandler.post {
                if (success) {
                    Toast.makeText(applicationContext, "Saved to MyBookMark ✓", Toast.LENGTH_SHORT).show()
                } else if (isQueuedOffline) {
                    Toast.makeText(applicationContext, "Saved to queue — will sync when online", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(applicationContext, "Could not save bookmark", Toast.LENGTH_SHORT).show()
                }
                finish()
            }
        }
    }

    private fun enqueuePendingShare(url: String, sharedText: String) {
        val prefs = NativeBridgePlugin.getPrefs(this)
        val raw = prefs.getString(NativeBridgePlugin.KEY_PENDING_SHARES, "[]")
        try {
            val jsonArray = JSONArray(raw)
            val newItem = JSONObject().apply {
                put("url", url)
                put("sharedText", sharedText)
                put("timestamp", System.currentTimeMillis())
            }
            jsonArray.put(newItem)
            prefs.edit().putString(NativeBridgePlugin.KEY_PENDING_SHARES, jsonArray.toString()).apply()
        } catch (e: Exception) {
            // Ignore
        }
    }
}

private typealias stringText = String
