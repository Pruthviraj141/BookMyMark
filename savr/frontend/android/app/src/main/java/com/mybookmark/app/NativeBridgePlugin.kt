package com.mybookmark.app

import android.content.Context
import android.content.SharedPreferences
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
    fun getConnectionConfiguration(call: PluginCall) {
        val prefs = getPrefs(context)
        val token = prefs.getString(KEY_AUTH_TOKEN, null)
        val baseUrl = prefs.getString(KEY_API_BASE_URL, null)

        val ret = JSObject()
        ret.put("token", token)
        ret.put("baseUrl", baseUrl)
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
            obj.put("sharedText", item.optString("sharedText", null))
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
}
