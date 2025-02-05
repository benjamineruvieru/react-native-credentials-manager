package com.credentialsmanager
import android.util.Log
import androidx.credentials.exceptions.CreateCredentialException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import com.credentialsmanager.handlers.CredentialHandler
import com.credentialsmanager.handlers.ErrorHandler
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import androidx.credentials.exceptions.ClearCredentialException

class CredentialsManagerModule(
  reactContext: ReactApplicationContext,
) : NativeCredentialsManagerSpec(reactContext) {
  private val coroutineScope = CoroutineScope(Dispatchers.IO)
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

  override fun signOut(
    promise: Promise,
  ) {
    coroutineScope.launch {
      try {
        credentialHandler.signOut()
        promise.resolve(null)}
        catch (e: ClearCredentialException) {
          Log.e("CredentialManager", "Error during sign out", e)
          promise.reject("ERROR", e.message.toString())
        }
      }
  }

  override fun signInWithGoogle(
    requestObject: ReadableMap,
    promise: Promise,
  ) {
    val nonce = requestObject.getString("nonce") ?: ""
    val serverClientId = requestObject.getString("serverClientId") ?: ""
    val autoSelectEnabled = requestObject.getBoolean("autoSelectEnabled")

    val googleIdOption =
      credentialHandler.getGoogleId(
        setFilterByAuthorizedAccounts = true,
        nonce = nonce,
        serverClientId = serverClientId,
        autoSelectEnabled = autoSelectEnabled,
      )
    coroutineScope.launch {
      try {
        val result = credentialHandler.googleSignInRequest(googleIdOption)
        val data = credentialHandler.handleSignInResult(result)
        promise.resolve(data)
      } catch (e: GetCredentialException) {
        when (e) {
          is NoCredentialException -> {
            try {
              Log.d("CredentialManager", "NoCredentialException")
              val googleIdOption2 =
                credentialHandler.getGoogleId(
                  setFilterByAuthorizedAccounts = false,
                  nonce = nonce,
                  serverClientId = serverClientId,
                  autoSelectEnabled = autoSelectEnabled,
                )
              val result2 = credentialHandler.googleSignInRequest(googleIdOption2)
              val data2 = credentialHandler.handleSignInResult(result2)
              promise.resolve(data2)
            } catch (e2: GetCredentialException) {
              ErrorHandler.handleGetCredentialError(e2)
              Log.e("CredentialManager", "Error during sign in", e2)
              promise.reject("ERROR", e2.message.toString())
            }
          }
          else -> {
            ErrorHandler.handleGetCredentialError(e)
            Log.e("CredentialManager", "Error during sign in", e)
            promise.reject("ERROR", e.message.toString())
          }
        }
      }
    }
  }
}
