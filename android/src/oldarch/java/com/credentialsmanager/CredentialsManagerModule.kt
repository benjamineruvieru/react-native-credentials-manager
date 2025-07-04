package com.credentialsmanager
import android.util.Log
import androidx.credentials.exceptions.ClearCredentialException
import androidx.credentials.exceptions.CreateCredentialException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import com.credentialsmanager.handlers.CredentialHandler
import com.credentialsmanager.handlers.ErrorHandler
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@ReactModule(name = CredentialsManagerModuleImpl.NAME)
class CredentialsManagerModule(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  private val coroutineScope = CoroutineScope(Dispatchers.IO)
  private val credentialHandler = CredentialHandler(reactContext)

  private var implementation: CredentialsManagerModuleImpl = CredentialsManagerModuleImpl()

  override fun getName(): String = CredentialsManagerModuleImpl.NAME

  @ReactMethod
  fun signUpWithPasskeys(
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

  @ReactMethod
  fun signUpWithPassword(credObject: ReadableMap, promise: Promise) {
    val username = credObject.getString("username") ?: ""
    val password = credObject.getString("password") ?: ""
    
    if (username.isEmpty()) {
      promise.reject("INVALID_USERNAME", "Username cannot be empty")
      return
    }
    
    if (password.isEmpty()) {
      promise.reject("INVALID_PASSWORD", "Password cannot be empty")
      return
    }
    
    coroutineScope.launch {
      try {
        credentialHandler.createPassword(username, password)
        
        // Create success response
        val result = mapOf(
          "type" to "password",
          "username" to username,
          "success" to true
        )
        promise.resolve(result)
      } catch (e: CreateCredentialException) {
        ErrorHandler.handleCredentialError(e)
        promise.reject("CREDENTIAL_ERROR", e.message.toString())
      }
    }
  }

  @ReactMethod
   fun signIn(
    options: ReadableArray,
    params: ReadableMap,
    promise: Promise,
  ) {
    coroutineScope.launch {
      try {
        val data = credentialHandler.signIn(options = options, params = params)
        promise.resolve(data)
      } catch (e: GetCredentialException) {
        Log.e("CredentialManager", "Error during sign out", e)
        promise.reject("ERROR", e.message.toString())
      }
    }
  }


  // @ReactMethod
  // fun signInWithSavedCredentials(
  //   requestJson: ReadableMap,
  //   promise: Promise,
  // ) {
  //   val jsonString = requestJson.toString()
  //   coroutineScope.launch {
  //     val data = credentialHandler.getSavedCredentials(jsonString)
  //     promise.resolve(data)
  //   }
  // }

  @ReactMethod
  fun signOut(promise: Promise) {
    coroutineScope.launch {
      try {
        credentialHandler.signOut()
        promise.resolve(null)
      } catch (e: ClearCredentialException) {
        Log.e("CredentialManager", "Error during sign out", e)
        promise.reject("ERROR", e.message.toString())
      }
    }
  }

  @ReactMethod
  fun signUpWithGoogle(
    requestObject: ReadableMap,
    promise: Promise,
  ) {
    val nonce = requestObject.getString("nonce") ?: ""
    val serverClientId = requestObject.getString("serverClientId") ?: ""
    val autoSelectEnabled = requestObject.getBoolean("autoSelectEnabled")

    val googleIdOption =
      credentialHandler.getGoogleId(
        setFilterByAuthorizedAccounts = false,
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
              val googleIdOption =
                credentialHandler.getGoogleId(
                  setFilterByAuthorizedAccounts = false,
                  nonce = nonce,
                  serverClientId = serverClientId,
                  autoSelectEnabled = autoSelectEnabled,
                )
              val result = credentialHandler.googleSignInRequest(googleIdOption)
              val data = credentialHandler.handleSignInResult(result)
              promise.resolve(data)
            } catch (e: GetCredentialException) {
              ErrorHandler.handleGetCredentialError(e)
              Log.e("CredentialManager", "Error during sign in", e)
              promise.reject("ERROR", e.message.toString())
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

  @ReactMethod
  fun signUpWithApple(params: ReadableMap, promise: Promise) {
    // Since this is an iOS-specific function, we just reject with an appropriate message on Android
    promise.reject(
      "PLATFORM_NOT_SUPPORTED",
      "Sign up with Apple is only supported on iOS devices"
    )
  }
}
