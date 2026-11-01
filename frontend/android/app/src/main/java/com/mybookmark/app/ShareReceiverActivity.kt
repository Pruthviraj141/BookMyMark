package com.mybookmark.app

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID
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

    private fun extractUrl(text: String): String? {
        val urlPattern = Pattern.compile(
            "(https?://[a-zA-Z0-9+&@#/%?=~_|!:,.;]*[a-zA-Z0-9+&@#/%=~_|])",
            Pattern.CASE_INSENSITIVE
        )
        val matcher = urlPattern.matcher(text)
        if (matcher.find()) {
            var url = matcher.group(1) ?: return null
            url = url.replace(Regex("[.,!?;:)>]+$"), "")
            return url
        }
        return null
    }

    private fun detectPlatform(url: String): String {
        val l = url.lowercase()
        return when {
            l.contains("instagram.com") -> "instagram"
            l.contains("twitter.com") || l.contains("x.com") -> "x"
            l.contains("youtube.com") || l.contains("youtu.be") -> "youtube"
            l.contains("tiktok.com") -> "tiktok"
            l.contains("reddit.com") -> "reddit"
            else -> "website"
        }
    }

    private fun extractUserIdFromToken(token: String): String? {
        try {
            val parts = token.split(".")
            if (parts.size >= 2) {
                val decoded = android.util.Base64.decode(parts[1], android.util.Base64.URL_SAFE or android.util.Base64.NO_PADDING)
                val json = JSONObject(String(decoded, Charsets.UTF_8))
                val sub = json.optString("sub", "")
                if (sub.isNotBlank()) return sub
            }
        } catch (_: Exception) {}
        return null
    }

    private fun cleanReelCaption(rawText: String?): String {
        if (rawText.isNullOrBlank()) return ""
        var s = rawText.trim()

        val quoteMatch = Regex(":\\s*[\"“](.+?)[\"”]", RegexOption.DOT_MATCHES_ALL).find(s)
        if (quoteMatch != null && quoteMatch.groupValues[1].isNotBlank()) {
            s = quoteMatch.groupValues[1]
        }

        s = s.replace(Regex("https?://\\S+"), "")
        s = s.replace(Regex("\\b\\d+[\\d,.]*[kKmM]?\\s*(likes?|comments?|shares?|views?|retweets?)\\b", RegexOption.IGNORE_CASE), "")
        s = s.replace(Regex("\\b(likes?|comments?|shares?):\\s*\\d+[\\d,.]*[kKmM]?\\b", RegexOption.IGNORE_CASE), "")
        s = s.replace(Regex("^(watch\\s+this\\s+reel(\\s+by\\s+@[a-zA-Z0-9._]+)?|check\\s+out\\s+this\\s+reel|shared\\s+via\\s+instagram|a\\s+reel\\s+saying|a\\s+tweet\\s+saying|in\\s+this\\s+reel|in\\s+this\\s+video)[:\\s,-]*", RegexOption.IGNORE_CASE), "")
        s = s.replace(Regex("^that\\s+", RegexOption.IGNORE_CASE), "")
        s = s.replace(Regex("^[\"'“‘\\s,:-]+|[\"'”’\\s,:-]+$"), "").trim()
        s = s.replace(Regex("\\s{2,}"), " ")

        if (s.isNotEmpty()) {
            s = s.substring(0, 1).uppercase() + s.substring(1)
        }
        return s
    }

    private fun processBookmark(url: String, sharedText: String) {
        val prefs = NativeBridgePlugin.getPrefs(this)
        val token = prefs.getString(NativeBridgePlugin.KEY_AUTH_TOKEN, null)
        val supabaseUrl = prefs.getString(NativeBridgePlugin.KEY_SUPABASE_URL, null) ?: "https://ycaenlslaoiqnyopmytx.supabase.co"
        val supabaseKey = prefs.getString(NativeBridgePlugin.KEY_SUPABASE_ANON_KEY, null) ?: "sb_publishable_MDcmJ8a_EDsUpca-e-wcNA_sCOLllzt"
        val workerUrl = prefs.getString(NativeBridgePlugin.KEY_API_BASE_URL, null) ?: "https://savr-api.markyourday.workers.dev"

        // If not logged in, preserve share in offline queue and launch MainActivity
        if (token.isNullOrBlank()) {
            enqueuePendingShare(url, sharedText)
            val launchIntent = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtra("pending_share_url", url)
                putExtra("pending_share_text", sharedText)
            }
            startActivity(launchIntent)
            Toast.makeText(this, "Log in to save to BookMyMark", Toast.LENGTH_LONG).show()
            finish()
            return
        }

        // Authenticated user: save directly to Supabase REST and trigger Worker AI enrichment
        executor.execute {
            var success = false
            var isQueuedOffline = false
            var createdBookmarkId: String? = null

            try {
                // 1. Direct Supabase REST INSERT
                val restEndpoint = URL("$supabaseUrl/rest/v1/bookmarks")
                val conn = restEndpoint.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json")
                conn.setRequestProperty("apikey", supabaseKey)
                conn.setRequestProperty("Authorization", "Bearer $token")
                conn.setRequestProperty("Prefer", "return=representation")
                conn.connectTimeout = 6000
                conn.readTimeout = 8000
                conn.doOutput = true

                val bookmarkId = UUID.randomUUID().toString()
                val platform = detectPlatform(url)
                val userId = extractUserIdFromToken(token)

                val payload = JSONObject().apply {
                    put("id", bookmarkId)
                    if (!userId.isNullOrBlank()) {
                        put("user_id", userId)
                    }
                    put("original_url", url)
                    put("normalized_url", url)
                    val cleanedCaption = cleanReelCaption(sharedText)
                    val cleanTitle = when {
                        cleanedCaption.isNotBlank() && !cleanedCaption.startsWith("http://") && !cleanedCaption.startsWith("https://") -> cleanedCaption.take(90)
                        platform == "instagram" -> "Instagram Reel"
                        platform == "x" -> "X Post"
                        platform == "youtube" -> "YouTube Video"
                        platform == "reddit" -> "Reddit Post"
                        platform == "tiktok" -> "TikTok Video"
                        else -> {
                            try {
                                Uri.parse(url).host?.removePrefix("www.") ?: "Saved Bookmark"
                            } catch (_: Exception) {
                                "Saved Bookmark"
                            }
                        }
                    }
                    put("title", cleanTitle)
                    put("shared_text", if (cleanedCaption.isNotBlank()) cleanedCaption else JSONObject.NULL)
                    put("thumbnail_url", JSONObject.NULL) // Never store images
                    put("ai_status", "pending")
                    put("tags", JSONArray())
                }

                OutputStreamWriter(conn.outputStream).use { writer ->
                    writer.write(payload.toString())
                    writer.flush()
                }

                val responseCode = conn.responseCode
                if (responseCode in 200..299) {
                    success = true
                    createdBookmarkId = bookmarkId

                    // Read created response to get the exact ID if generated by DB
                    val responseStr = BufferedReader(InputStreamReader(conn.inputStream)).use { it.readText() }
                    try {
                        val jsonArr = JSONArray(responseStr)
                        if (jsonArr.length() > 0) {
                            createdBookmarkId = jsonArr.getJSONObject(0).optString("id", bookmarkId)
                        }
                    } catch (_: Exception) {}
                } else if (responseCode == 409) {
                    // Duplicate URL already saved
                    success = true
                } else {
                    isQueuedOffline = true
                    enqueuePendingShare(url, sharedText)
                }
            } catch (e: Exception) {
                // Network unreachable or offline
                isQueuedOffline = true
                enqueuePendingShare(url, sharedText)
            }

            // 2. Trigger Cloudflare Worker AI Enrichment if insert succeeded
            if (success && !createdBookmarkId.isNullOrBlank()) {
                try {
                    val enrichEndpoint = URL("$workerUrl/api/bookmarks/$createdBookmarkId/enrich")
                    val enrichConn = enrichEndpoint.openConnection() as HttpURLConnection
                    enrichConn.requestMethod = "POST"
                    enrichConn.setRequestProperty("Content-Type", "application/json")
                    enrichConn.setRequestProperty("Authorization", "Bearer $token")
                    enrichConn.connectTimeout = 4000
                    enrichConn.readTimeout = 4000
                    enrichConn.doOutput = true

                    val enrichPayload = JSONObject().apply {
                        put("sharedText", sharedText)
                    }
                    OutputStreamWriter(enrichConn.outputStream).use { writer ->
                        writer.write(enrichPayload.toString())
                        writer.flush()
                    }
                    enrichConn.responseCode // Trigger execution
                } catch (_: Exception) {
                    // Background AI trigger failure is non-blocking
                }
            }

            mainHandler.post {
                if (success) {
                    Toast.makeText(applicationContext, "Saved to BookMyMark ✓", Toast.LENGTH_SHORT).show()
                } else if (isQueuedOffline) {
                    Toast.makeText(applicationContext, "Saved Perfectly", Toast.LENGTH_SHORT).show()
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
        } catch (_: Exception) {}
    }
}
