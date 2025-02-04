package com.credentialsmanager
import androidx.credentials.CredentialManager
import androidx.credentials.exceptions.CreateCredentialException
import com.credentialsmanager.handlers.CredentialHandler
import com.credentialsmanager.handlers.ErrorHandler
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class CredentialsManagerModule(
  reactContext: ReactApplicationContext,
) : NativeCredentialsManagerSpec(reactContext) {
  private val coroutineScope = CoroutineScope(Dispatchers.IO)
  val credentialManager = CredentialManager.create(getReactApplicationContext())
  private val credentialHandler = CredentialHandler(reactContext)

  private var implementation: CredentialsManagerModuleImpl = CredentialsManagerModuleImpl()

  override fun getName(): String = CredentialsManagerModuleImpl.NAME

  override fun signUpWithPasskeys(
    requestJson: ReadableMap,
    preferImmediatelyAvailableCredentials: Boolean,
    promise: Promise,
  ) {
    val jsonString = requestJson.toString()

    coroutineScope.launch {
      try {
        val response =
          credentialHandler.createPasskey(
            jsonString,
            preferImmediatelyAvailableCredentials,
          )

        response?.let {
          promise.resolve(it)
        } ?: promise.reject("ERROR", "No response received")
      } catch (e: CreateCredentialException) {
        ErrorHandler.handleCredentialError(e)
        promise.reject("ERROR", e.message.toString())
      }
    }
  }

  override fun signUpWithPassword(credObject: ReadableMap) {
    val username = credObject.getString("username") ?: ""
    val password = credObject.getString("password") ?: ""
    coroutineScope.launch {
      try {
        credentialHandler.createPassword(username, password)
      } catch (e: CreateCredentialException) {
        ErrorHandler.handleCredentialError(e)
      }
    }
  }

  override fun signInWithSavedCredentials(
    requestJson: ReadableMap,
    promise: Promise,
  ) {
    val jsonString = requestJson.toString()
    coroutineScope.launch {
      val data = credentialHandler.getSavedCredentials(jsonString)
      promise.resolve(data)
    }
  }
}
