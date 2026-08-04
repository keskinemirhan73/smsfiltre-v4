package com.smsfilter.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Telephony
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar
import java.util.UUID

class SmsFilterReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
            if (messages.isEmpty()) return

                val sender = messages.first().displayOriginatingAddress ?: ""
                val body = messages.joinToString(separator = "") {
                    it.displayMessageBody ?: ""
                }
                val lowerBody = body.lowercase()
                val lowerSender = sender.lowercase()
                
                val prefs = context.getSharedPreferences("smsfilter_prefs", Context.MODE_PRIVATE)
                val jsonStr = prefs.getString("smsfilter_config_json", "{}") ?: "{}"
                
                var underAttackMode = false
                var smartFilter = true
                var filterScheduleEnabled = false
                var scheduleStart = "22:00"
                var scheduleEnd = "08:00"
                var invalidNumberFilter = false
                var blockForeignNumbers = false
                var blockArabic = false
                var databaseFilter = true
                var fraudFilter = true
                var customFraudKeywords = emptyList<String>()
                var shouldBlock = false
                var isWhitelisted = false
                var classification = "allowed"
                
                try {
                    val jsonObj = JSONObject(jsonStr)
                    
                    // Parse settings
                    if (jsonObj.has("settings")) {
                        val settings = jsonObj.getJSONObject("settings")
                        underAttackMode = settings.optBoolean("underAttackMode", false)
                        smartFilter = settings.optBoolean("smartFilter", true)
                        filterScheduleEnabled = settings.optBoolean("filterScheduleEnabled", false)
                        scheduleStart = settings.optString("scheduleStart", "22:00")
                        scheduleEnd = settings.optString("scheduleEnd", "08:00")
                        invalidNumberFilter = settings.optBoolean("invalidNumberFilter", false)
                        blockForeignNumbers = settings.optBoolean("blockForeignNumbers", false)
                        blockArabic = settings.optBoolean("blockArabic", false)
                        databaseFilter = settings.optBoolean("databaseFilter", true)
                        fraudFilter = settings.optBoolean("fraudFilter", true)

                        if (settings.has("customFraudKeywords")) {
                            val keywords = settings.getJSONArray("customFraudKeywords")
                            customFraudKeywords = (0 until keywords.length())
                                .mapNotNull { keywords.optString(it).trim().takeIf(String::isNotEmpty) }
                        }
                        
                        if (settings.has("whitelist")) {
                            val whitelist = settings.getJSONArray("whitelist")
                            for (j in 0 until whitelist.length()) {
                                val entry = whitelist.optString(j).trim()
                                if (entry.isNotEmpty() &&
                                    (sender.equals(entry, ignoreCase = true) || sender.contains(entry))) {
                                    isWhitelisted = true
                                    break
                                }
                            }
                        }
                    }
                    
                    if (isWhitelisted || !isWithinSchedule(filterScheduleEnabled, scheduleStart, scheduleEnd)) {
                        // Beyaz listedeki veya zamanlama dışındaki mesaj filtrelenmez.
                        shouldBlock = false
                    } else {
                    // 1. Under Attack Mode
                    if (underAttackMode) {
                        shouldBlock = true
                    }

                    // 2. Foreign number and alphabet rules
                    val isForeignSender = sender.startsWith("+") && !sender.startsWith("+90")
                    val hasLinkInBody = Regex("(https?://|[a-z0-9-]+\\.(gd|ly|com|cc|top|xyz|me|co|site|info|fun|icu))", RegexOption.IGNORE_CASE).containsMatchIn(body)
                    if (!shouldBlock && isForeignSender && (hasLinkInBody || (invalidNumberFilter && blockForeignNumbers))) {
                        shouldBlock = true
                    }

                    if (!shouldBlock && blockArabic &&
                        (Regex("[\\u0600-\\u06FF]").containsMatchIn(body) ||
                         Regex("[\\u0600-\\u06FF]").containsMatchIn(sender))) {
                        shouldBlock = true
                    }

                    if (!shouldBlock && fraudFilter && customFraudKeywords.any {
                        lowerBody.contains(it.lowercase())
                    }) {
                        shouldBlock = true
                    }
                    
                    // 3. Custom Rules
                    if (!shouldBlock && jsonObj.has("rules")) {
                        val rules = jsonObj.getJSONArray("rules")
                        for (i in 0 until rules.length()) {
                            val rule = rules.getJSONObject(i)
                            val keyword = rule.optString("keyword", "")
                            if (keyword.isBlank()) continue
                            val type = rule.optString("type", "word")
                            val category = rule.optString("category", "junk")
                            val matchTarget = rule.optString("matchTarget", "content")
                            
                            val textToCheck = when (matchTarget) {
                                "sender" -> sender
                                "content" -> body
                                else -> "$sender $body"
                            }
                            
                            val isMatch = if (type == "regex") {
                                try { Regex(keyword, RegexOption.IGNORE_CASE).containsMatchIn(textToCheck) } catch (e: Exception) { false }
                            } else {
                                textToCheck.lowercase().contains(keyword.lowercase().trim())
                            }
                            
                            if (isMatch) {
                                if (category == "junk") {
                                    shouldBlock = true
                                    classification = "suspicious"
                                } else if (category == "allowed") {
                                    shouldBlock = false
                                    isWhitelisted = true
                                    classification = "allowed"
                                } else if (category == "transaction") {
                                    classification = "transaction"
                                } else if (category == "promotion") {
                                    classification = "promotion"
                                }
                                break
                            }
                        }
                    }
                    
                    // 4. Threat Database
                    if (!shouldBlock && !isWhitelisted && smartFilter && (databaseFilter || fraudFilter) && jsonObj.has("threatDb")) {
                        val threatDb = jsonObj.getJSONArray("threatDb")
                        for (i in 0 until threatDb.length()) {
                            val threat = threatDb.getJSONObject(i)
                            val keyword = threat.optString("keyword", "")
                            if (keyword.isBlank()) continue
                            val type = threat.optString("type", "word")
                            
                            val isMatch = if (type == "regex") {
                                try { Regex(keyword, RegexOption.IGNORE_CASE).containsMatchIn("$sender $body") } catch (e: Exception) { false }
                            } else {
                                lowerBody.contains(keyword.lowercase()) || lowerSender.contains(keyword.lowercase())
                            }
                            
                            if (isMatch) {
                                shouldBlock = true
                                classification = "suspicious"
                                break
                            }
                        }
                    }
                    } // End of isWhitelisted else block
                } catch (e: Exception) {
                    Log.e("SmsFilter", "Error parsing rules", e)
                }

                if (shouldBlock) classification = "suspicious"
                val eventId = recordSmsEvent(context, sender, classification)
                if (shouldBlock) {
                    Log.d("SmsFilter", "Suspicious SMS detected on device")
                    showSuspiciousSmsNotification(context, eventId)
                } else {
                    Log.d("SmsFilter", "SMS analyzed on device")
                }
        }
    }

    private fun recordSmsEvent(
        context: Context,
        sender: String,
        classification: String
    ): String {
        val eventId = UUID.randomUUID().toString()
        try {
            val prefs = context.getSharedPreferences("smsfilter_prefs", Context.MODE_PRIVATE)
            val storedQueue = prefs.getString("smsfilter_event_queue_json", "[]") ?: "[]"
            val previousQueue = try { JSONArray(storedQueue) } catch (_: Exception) { JSONArray() }
            val nextQueue = JSONArray()
            val firstIndex = maxOf(0, previousQueue.length() - 49)
            for (index in firstIndex until previousQueue.length()) {
                nextQueue.put(previousQueue.get(index))
            }

            val preview = when (classification) {
                "suspicious" -> "Şüpheli SMS cihaz üzerinde tespit edildi."
                "transaction" -> "İşlem SMS'i cihaz üzerinde sınıflandırıldı."
                "promotion" -> "Tanıtım SMS'i cihaz üzerinde sınıflandırıldı."
                else -> "SMS cihaz üzerinde analiz edildi."
            }
            nextQueue.put(JSONObject()
                .put("id", eventId)
                .put("sender", maskSender(sender))
                .put("preview", preview)
                .put("status", classification)
                .put("timestamp", System.currentTimeMillis()))
            prefs.edit()
                .putString("smsfilter_event_queue_json", nextQueue.toString())
                .apply()
        } catch (error: Exception) {
            Log.e("SmsFilter", "Could not record SMS analysis event", error)
        }
        return eventId
    }

    private fun maskSender(sender: String): String {
        val suffix = sender.trim().takeLast(4)
        return if (suffix.isEmpty()) "Bilinmeyen" else "***$suffix"
    }

    private fun isWithinSchedule(enabled: Boolean, start: String, end: String): Boolean {
        if (!enabled) return true

        val startMinutes = parseTimeMinutes(start) ?: return true
        val endMinutes = parseTimeMinutes(end) ?: return true
        val calendar = Calendar.getInstance()
        val currentMinutes = calendar.get(Calendar.HOUR_OF_DAY) * 60 + calendar.get(Calendar.MINUTE)

        return if (startMinutes <= endMinutes) {
            currentMinutes in startMinutes..endMinutes
        } else {
            currentMinutes >= startMinutes || currentMinutes <= endMinutes
        }
    }

    private fun parseTimeMinutes(value: String): Int? {
        val parts = value.split(":")
        if (parts.size != 2) return null
        val hour = parts[0].toIntOrNull() ?: return null
        val minute = parts[1].toIntOrNull() ?: return null
        if (hour !in 0..23 || minute !in 0..59) return null
        return hour * 60 + minute
    }

    private fun showSuspiciousSmsNotification(
        context: Context,
        eventId: String
    ) {
        try {
            val channelId = "filtreai_sms_alerts"
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = NotificationChannel(
                    channelId,
                    "SMS Güvenlik Uyarıları",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "FiltreAI tarafından şüpheli bulunan yeni SMS uyarıları"
                }
                manager.createNotificationChannel(channel)
            }

            val launchIntent = context.packageManager
                .getLaunchIntentForPackage(context.packageName)
            val pendingIntent = launchIntent?.let {
                PendingIntent.getActivity(
                    context,
                    0,
                    it,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
            }

            val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Notification.Builder(context, channelId)
            } else {
                @Suppress("DEPRECATION")
                Notification.Builder(context)
            }

            builder
                .setSmallIcon(context.applicationInfo.icon)
                .setContentTitle("FiltreAI: Şüpheli SMS algılandı")
                .setContentText("Mesajlar uygulamasında yeni bir şüpheli SMS var.")
                .setAutoCancel(true)
                .setVisibility(Notification.VISIBILITY_PRIVATE)

            pendingIntent?.let(builder::setContentIntent)
            manager.notify(eventId.hashCode(), builder.build())
        } catch (error: Exception) {
            Log.e("SmsFilter", "Could not show suspicious SMS notification", error)
        }
    }
}
