package com.smsfilter.app

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log

class RespondViaMessageService : Service() {
    override fun onBind(intent: Intent?): IBinder? {
        Log.d("RespondViaMessage", "RespondViaMessageService bound")
        return null
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == Intent.ACTION_RESPOND_VIA_MESSAGE) {
            Log.d("RespondViaMessage", "Received respond via message intent")
        }
        stopSelf(startId)
        return START_NOT_STICKY
    }
}
