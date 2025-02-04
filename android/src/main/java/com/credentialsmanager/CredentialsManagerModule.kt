package com.credentialsmanager

import android.util.Log
import androidx.credentials.CreatePasswordRequest
import androidx.credentials.CreatePublicKeyCredentialRequest
import androidx.credentials.CreatePublicKeyCredentialResponse
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetPasswordOption
import androidx.credentials.GetPublicKeyCredentialOption
import androidx.credentials.PasswordCredential
import androidx.credentials.PublicKeyCredential
import androidx.credentials.exceptions.CreateCredentialCancellationException
import androidx.credentials.exceptions.CreateCredentialCustomException
import androidx.credentials.exceptions.CreateCredentialException
import androidx.credentials.exceptions.CreateCredentialInterruptedException
import androidx.credentials.exceptions.CreateCredentialProviderConfigurationException
import androidx.credentials.exceptions.CreateCredentialUnknownException
import androidx.credentials.exceptions.publickeycredential.CreatePublicKeyCredentialDomException
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject

@ReactModule(name = CredentialsManagerModule.NAME)
class CredentialsManagerModule(
  reactContext: ReactApplicationContext,
) : NativeCredentialsManagerSpec(reactContext) {
  private val coroutineScope = CoroutineScope(Dispatchers.IO)
  val credentialManager = CredentialManager.create(getReactApplicationContext())

  override fun getName(): String = NAME

  override fun signUpWithPasskeys(
    requestJson: ReadableMap,
    preferImmediatelyAvailableCredentials: Boolean,
    promise: Promise,
  ) {
    val jsonString = requestJson.toString()

    val request =
      CreatePublicKeyCredentialRequest(
        requestJson = jsonString,
        preferImmediatelyAvailableCredentials = preferImmediatelyAvailableCredentials,
      )

    coroutineScope.launch {
      try {
        val response =
          credentialManager.createCredential(
            getReactApplicationContext(),
            request,
          ) as CreatePublicKeyCredentialResponse

        response?.let {
          val dataBundle = it.data
          val responseJson = dataBundle.getString("androidx.credentials.BUNDLE_KEY_REGISTRATION_RESPONSE_JSON")
          responseJson?.let { json ->

            val jsonObject = Arguments.createMap()
            val parsedObject = JSONObject(json)

            parsedObject.keys().forEach { key ->
              jsonObject.putString(key, parsedObject.getString(key))
            }

            Log.d("CredentialManager", "Passkey creation result: $jsonObject")
            promise.resolve(jsonObject)
          } ?: run {
            promise.reject("ERROR", "Response JSON is null")
          }
        } ?: run {
          promise.reject("ERROR", "No response received")
        }
      } catch (e: CreateCredentialException) {
        handleFailure(e)
        promise.reject("ERROR", e.message.toString())
      }
    }
  }

  override fun signUpWithPassword(credObject: ReadableMap) {
    val username = credObject.getString("username") ?: ""
    val password = credObject.getString("password") ?: ""
    coroutineScope.launch {
      createPassword(username, password)
    }
  }

  override fun signInWithSavedCredentials(
    requestJson: ReadableMap,
    promise: Promise,
  ) {
    val jsonString = requestJson.toString()
    coroutineScope.launch {
      val data = getSavedCredentials(jsonString)
      promise.resolve(data)
    }
  }

  private suspend fun getSavedCredentials(jsonString: String): ReadableMap? {
    val getPublicKeyCredentialOption =
      GetPublicKeyCredentialOption(jsonString, null)

    val getPasswordOption = GetPasswordOption()

    val result =
      try {
        credentialManager.getCredential(
          getReactApplicationContext(),
          GetCredentialRequest(
            listOf(
              getPublicKeyCredentialOption,
              getPasswordOption,
            ),
          ),
        )
      } catch (e: Exception) {
        Log.e("CredentialManager", "getCredential failed with exception: " + e.message.toString())

        return null
      }

    val resultMap = Arguments.createMap()
    when (result.credential) {
      is PublicKeyCredential -> {
        val cred = result.credential as PublicKeyCredential
        resultMap.putString("type", "passkey")
        resultMap.putString("authenticationResponseJson", cred.authenticationResponseJson)
        Log.d("CredentialManager", "Passkey: ${cred.authenticationResponseJson}")
      }
      is PasswordCredential -> {
        val cred = result.credential as PasswordCredential
        resultMap.putString("type", "password")
        resultMap.putString("username", cred.id)
        resultMap.putString("password", cred.password)
        Log.d("CredentialManager", "Got Password - User:${cred.id} Password: ${cred.password}")
      }
      is CustomCredential -> {
        return null
      }
      else -> return null
    }

    return resultMap
  }

  private suspend fun createPassword(
    username: String,
    password: String,
  ) {
    val createPasswordRequest =
      CreatePasswordRequest(id = username, password = password)

    try {
      val result =
        credentialManager.createCredential(
          getReactApplicationContext(),
          createPasswordRequest,
        )
    } catch (e: CreateCredentialException) {
      handleFailure(e)
    }
  }

  private fun handleFailure(e: CreateCredentialException) {
    when (e) {
      is CreatePublicKeyCredentialDomException -> {
        // Handle the passkey DOM errors thrown according to the
        // WebAuthn spec.
        Log.d("CredentialManager", "passkey DOM errors")
        // handlePasskeyError(e.domError)
      }
      is CreateCredentialCancellationException -> {
        // The user intentionally canceled the operation and chose not
        // to register the credential.
        Log.d("CredentialManager", "User cancelled")
      }
      is CreateCredentialInterruptedException -> {
        // Retry-able error. Consider retrying the call.
        Log.d("CredentialManager", "Retry process")
      }
      is CreateCredentialProviderConfigurationException -> {
        // Your app is missing the provider configuration dependency.
        // Most likely, you're missing the
        // "credentials-play-services-auth" module.
      }
      is CreateCredentialUnknownException -> {
        Log.d("CredentialManager", "Unknown error")
      }
      is CreateCredentialCustomException -> {
        // You have encountered an error from a 3rd-party SDK. If you
        // make the API call with a request object that's a subclass of
        // CreateCustomCredentialRequest using a 3rd-party SDK, then you
        // should check for any custom exception type constants within
        // that SDK to match with e.type. Otherwise, drop or log the
        // exception.
      }
      else -> Log.w("CredentialManager", "Unexpected exception type ${e::class.java.name}")
    }
  }

  companion object {
    const val NAME = "CredentialsManager"
  }
}
