package com.filtreai.app

import android.app.Activity
import android.app.role.RoleManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Telephony
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class DefaultSmsRoleModule(
    private val appContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(appContext) {
    private val activityListener: ActivityEventListener = object : BaseActivityEventListener() {
        override fun onActivityResult(
            activity: Activity?,
            requestCode: Int,
            resultCode: Int,
            data: Intent?,
        ) {
            if (requestCode != REQUEST_SMS_ROLE) return
            val promise = pendingRolePromise ?: return
            pendingRolePromise = null
            promise.resolve(resultCode == Activity.RESULT_OK && isRoleHeldInternal())
        }
    }

    private var pendingRolePromise: Promise? = null

    init {
        appContext.addActivityEventListener(activityListener)
    }

    override fun getName(): String = "DefaultSmsRole"

    @ReactMethod
    fun isRoleAvailable(promise: Promise) {
        promise.resolve(isRoleAvailableInternal())
    }

    @ReactMethod
    fun isRoleHeld(promise: Promise) {
        promise.resolve(isRoleHeldInternal())
    }

    @ReactMethod
    fun requestRole(promise: Promise) {
        if (!isRoleAvailableInternal()) {
            promise.resolve(false)
            return
        }
        if (isRoleHeldInternal()) {
            promise.resolve(true)
            return
        }
        if (pendingRolePromise != null) {
            promise.reject("ROLE_REQUEST_ACTIVE", "Varsayilan SMS rol istegi zaten acik.")
            return
        }

        val activity = currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "SMS rol penceresi icin etkin bir ekran bulunamadi.")
            return
        }

        val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roleManager = appContext.getSystemService(RoleManager::class.java)
            roleManager.createRequestRoleIntent(RoleManager.ROLE_SMS)
        } else {
            Intent(Telephony.Sms.Intents.ACTION_CHANGE_DEFAULT).apply {
                putExtra(Telephony.Sms.Intents.EXTRA_PACKAGE_NAME, appContext.packageName)
            }
        }

        pendingRolePromise = promise
        try {
            activity.startActivityForResult(intent, REQUEST_SMS_ROLE)
        } catch (error: Exception) {
            pendingRolePromise = null
            promise.reject("ROLE_REQUEST_FAILED", "SMS rol penceresi acilamadi.", error)
        }
    }

    private fun isRoleAvailableInternal(): Boolean {
        if (!appContext.packageManager.hasSystemFeature(PackageManager.FEATURE_TELEPHONY_MESSAGING)) {
            return false
        }
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return true
        val roleManager = appContext.getSystemService(RoleManager::class.java)
        return roleManager.isRoleAvailable(RoleManager.ROLE_SMS)
    }

    private fun isRoleHeldInternal(): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roleManager = appContext.getSystemService(RoleManager::class.java)
            return roleManager.isRoleHeld(RoleManager.ROLE_SMS)
        }
        return Telephony.Sms.getDefaultSmsPackage(appContext) == appContext.packageName
    }

    companion object {
        private const val REQUEST_SMS_ROLE = 7314
    }
}
