package com.mybookmark.app

import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.net.Uri
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import org.json.JSONArray
import org.json.JSONObject

@CapacitorPlugin(name = "NativeBridge")
class NativeBridgePlugin : Plugin() {

    companion object {
        const val PREFS_NAME = "MyBookMarkPrefs"
        const val KEY_AUTH_TOKEN = "auth_token"
        const val KEY_API_BASE_URL = "api_base_url"
        const val KEY_SUPABASE_URL = "supabase_url"
        const val KEY_SUPABASE_ANON_KEY = "supabase_anon_key"
        const val KEY_PENDING_SHARES = "pending_shares"

        fun getPrefs(context: Context): SharedPreferences {
            return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        }
    }

    @PluginMethod
    fun setSessionToken(call: PluginCall) {
        val token = call.getString("token")
        if (token != null) {
            getPrefs(context).edit().putString(KEY_AUTH_TOKEN, token).apply()
            call.resolve()
        } else {
            call.reject("Must provide token")
        }
    }

    @PluginMethod
    fun clearSessionToken(call: PluginCall) {
        getPrefs(context).edit().remove(KEY_AUTH_TOKEN).apply()
        call.resolve()
    }

    @PluginMethod
    fun setApiBaseUrl(call: PluginCall) {
        val url = call.getString("url")
        if (url != null) {
            val clean = url.trim().removeSuffix("/")
            getPrefs(context).edit().putString(KEY_API_BASE_URL, clean).apply()
            call.resolve()
        } else {
            call.reject("Must provide url")
        }
    }

    @PluginMethod
    fun setSupabaseConfig(call: PluginCall) {
        val url = call.getString("url")
        val anonKey = call.getString("anonKey")
        if (url != null && anonKey != null) {
            getPrefs(context).edit()
                .putString(KEY_SUPABASE_URL, url.trim().removeSuffix("/"))
                .putString(KEY_SUPABASE_ANON_KEY, anonKey.trim())
                .apply()
            call.resolve()
        } else {
            call.reject("Must provide url and anonKey")
        }
    }

    @PluginMethod
    fun getConnectionConfiguration(call: PluginCall) {
        val prefs = getPrefs(context)
        val token = prefs.getString(KEY_AUTH_TOKEN, null)
        val baseUrl = prefs.getString(KEY_API_BASE_URL, null)
        val supabaseUrl = prefs.getString(KEY_SUPABASE_URL, null)

        val ret = JSObject()
        ret.put("token", token)
        ret.put("baseUrl", baseUrl)
        ret.put("supabaseUrl", supabaseUrl)
        call.resolve(ret)
    }

    @PluginMethod
    fun getPendingShares(call: PluginCall) {
        val prefs = getPrefs(context)
        val raw = prefs.getString(KEY_PENDING_SHARES, "[]")
        val jsonArray = try {
            JSONArray(raw)
        } catch (e: Exception) {
            JSONArray()
        }

        val jsArray = JSArray()
        for (i in 0 until jsonArray.length()) {
            val item = jsonArray.getJSONObject(i)
            val obj = JSObject()
            obj.put("url", item.optString("url"))
            val shared = if (item.has("sharedText") && !item.isNull("sharedText")) item.getString("sharedText") else null
            obj.put("sharedText", shared)
            obj.put("timestamp", item.optLong("timestamp", System.currentTimeMillis()))
            jsArray.put(obj)
        }

        val ret = JSObject()
        ret.put("items", jsArray)
        call.resolve(ret)
    }

    @PluginMethod
    fun clearPendingShares(call: PluginCall) {
        getPrefs(context).edit().remove(KEY_PENDING_SHARES).apply()
        call.resolve()
    }

    @PluginMethod
    fun openAppUrl(call: PluginCall) {
        val rawUrl = call.getString("url")
        if (rawUrl.isNullOrBlank()) {
            call.reject("Must provide url")
            return
        }

        val uri = Uri.parse(rawUrl.trim())
        val host = uri.host?.lowercase() ?: ""
        val context = this.context

        // Determine target application package based on detected platform
        val targetPackage = when {
            host.contains("instagram.com") || host.contains("instagr.am") -> "com.instagram.android"
            host.contains("twitter.com") || host.contains("x.com") || host.contains("t.co") -> "com.twitter.android"
            host.contains("youtube.com") || host.contains("youtu.be") -> "com.google.android.youtube"
            host.contains("reddit.com") || host.contains("redd.it") -> "com.reddit.frontpage"
            host.contains("tiktok.com") -> "com.zhiliaoapp.musically"
            else -> null
        }

        var openedInTargetApp = false

        if (targetPackage != null) {
            try {
                val pm = context.packageManager
                val isInstalled = try {
                    pm.getPackageInfo(targetPackage, 0)
                    true
                } catch (_: Exception) {
                    false
                }

                if (isInstalled) {
                    val appIntent = Intent(Intent.ACTION_VIEW, uri).apply {
                        setPackage(targetPackage)
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(appIntent)
                    openedInTargetApp = true
                }
            } catch (_: Exception) {
                openedInTargetApp = false
            }
        }

        // Fallback: Default system browser (no embedded webview)
        if (!openedInTargetApp) {
            try {
                val browserIntent = Intent(Intent.ACTION_VIEW, uri).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(browserIntent)
            } catch (e: Exception) {
                call.reject("Could not open URL: ${e.message}")
                return
            }
        }

        val ret = JSObject()
        ret.put("success", true)
        ret.put("openedInTargetApp", openedInTargetApp)
        call.resolve(ret)
    }
}
