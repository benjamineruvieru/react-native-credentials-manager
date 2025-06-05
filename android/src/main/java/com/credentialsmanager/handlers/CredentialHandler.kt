package com.credentialsmanager.handlers

import android.app.Activity
import android.content.Context
import android.util.Log
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CreatePasswordRequest
import androidx.credentials.CreatePublicKeyCredentialRequest
import androidx.credentials.CreatePublicKeyCredentialResponse
import androidx.credentials.CredentialManager
import androidx.credentials.CredentialOption
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import androidx.credentials.GetPasswordOption
import androidx.credentials.GetPublicKeyCredentialOption
import androidx.credentials.PasswordCredential
import androidx.credentials.PublicKeyCredential
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.android.libraries.identity.googleid.GoogleIdTokenParsingException
import org.json.JSONObject

class CredentialHandler(
  private val context: Context,
) {
  private val credentialManager = CredentialManager.create(context)

  // Helper function to get activity context
  private fun getActivityContext(): Context {
    if (context is ReactApplicationContext) {
      val activity = context.currentActivity
      if (activity != null) {
        return activity
      } else {
        Log.w("CredentialManager", "No current activity found. UI operations may fail - ensure you're calling from the main/UI thread.")
      }
    } else {
      Log.w("CredentialManager", "Context is not ReactApplicationContext. UI operations may fail.")
    }
    // If we can't get an activity context, use the original context
    // This might still cause issues for UI operations, but it's better than null
    return context
  }

  suspend fun signOut() {
    credentialManager.clearCredentialState(ClearCredentialStateRequest())
  }

  suspend fun createPasskey(
    jsonString: String,
    preferImmediatelyAvailableCredentials: Boolean,
  ): ReadableMap? {
    Log.d("CredentialManager", "Creating passkey with request: $jsonString")
    
    try {
      val request =
        CreatePublicKeyCredentialRequest(
          requestJson = jsonString,
          preferImmediatelyAvailableCredentials = preferImmediatelyAvailableCredentials,
        )

      val activityContext = getActivityContext()
      val response =
        credentialManager.createCredential(
          activityContext,
          request,
        ) as CreatePublicKeyCredentialResponse

      return response.data.getString("androidx.credentials.BUNDLE_KEY_REGISTRATION_RESPONSE_JSON")?.let { json ->
        val jsonObject = Arguments.createMap()
        val parsedObject = JSONObject(json)

        parsedObject.keys().forEach { key ->
          jsonObject.putString(key, parsedObject.getString(key))
        }
        jsonObject
      }
    } catch (e: Exception) {
      Log.e("CredentialManager", "Error creating passkey", e)
      throw e
    }
  }

  suspend fun createPassword(
    username: String,
    password: String,
  ) {
    Log.d("CredentialManager", "Creating password credential for username: $username")
    
    try {
      val activityContext = getActivityContext()
      val createPasswordRequest = CreatePasswordRequest(id = username, password = password)
      credentialManager.createCredential(activityContext, createPasswordRequest)
    } catch (e: Exception) {
      Log.e("CredentialManager", "Error creating password credential", e)
      throw e
    }
  }

  suspend fun signIn(
    options: ReadableArray,
    params: ReadableMap,
  ): ReadableMap? {
    val credentialOptions = mutableListOf<CredentialOption>()
    for (i in 0 until options.size()) {
      when (options.getString(i)) {
        "passkeys" -> {
          if (params.hasKey("passkeys")) {
            val jsonString = params.getMap("passkeys")?.toString()
            jsonString?.let {
              credentialOptions.add(GetPublicKeyCredentialOption(it, null))
            }
          }
        }
        "password" -> {
          credentialOptions.add(GetPasswordOption())
        }
        "google-signin" -> {
          if (params.hasKey("googleSignIn")) {
            val googleParams = params.getMap("googleSignIn")
            val nonce = googleParams?.getString("nonce") ?: ""
            val serverClientId = googleParams?.getString("serverClientId") ?: ""
            val autoSelectEnabled = googleParams?.getBoolean("autoSelectEnabled") ?: false

            credentialOptions.add(
              getGoogleId(
                true,
                nonce,
                serverClientId,
                autoSelectEnabled,
              ),
            )
          }
        }
      }
    }

    val request = GetCredentialRequest(credentialOptions)
    val activityContext = getActivityContext()
    val result = credentialManager.getCredential(activityContext, request)
    return handleSignInResult(result)
  }

  suspend fun getSavedCredentials(jsonString: String): ReadableMap? {
    val getPublicKeyCredentialOption = GetPublicKeyCredentialOption(jsonString, null)
    val getPasswordOption = GetPasswordOption()
    val activityContext = getActivityContext()

    val result =
      credentialManager.getCredential(
        activityContext,
        GetCredentialRequest(
          listOf(
            getPublicKeyCredentialOption,
            getPasswordOption,
          ),
        ),
      )

    return handleSignInResult(result)
  }

  fun handleSignInResult(result: GetCredentialResponse): ReadableMap? {
    // Handle the successfully returned credential.
    val credential = result.credential
    Log.d("CredentialManager", "Handle results called")

    return when (credential) {
      is PublicKeyCredential -> {
        val cred = result.credential as PublicKeyCredential
        Arguments.createMap().apply {
          putString("type", "passkey")
          putString("authenticationResponseJson", cred.authenticationResponseJson)
        }
      }
      is PasswordCredential -> {
        val cred = result.credential as PasswordCredential
        Arguments.createMap().apply {
          putString("type", "password")
          putString("username", cred.id)
          putString("password", cred.password)
        }
      }
      // GoogleIdToken credential
      is CustomCredential -> {
        if (credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
          try {
            val googleIdTokenCredential =
              GoogleIdTokenCredential
                .createFrom(credential.data)
            Log.d("CredentialManager", "Google ID Token Credential ID: ${googleIdTokenCredential.id}")

            return Arguments.createMap().apply {
              putString("type", "google-signin")
              putString("id", googleIdTokenCredential.id)
              putString("idToken", googleIdTokenCredential.idToken)
              googleIdTokenCredential.displayName?.let { putString("displayName", it) }
              googleIdTokenCredential.familyName?.let { putString("familyName", it) }
              googleIdTokenCredential.givenName?.let { putString("givenName", it) }
              googleIdTokenCredential.profilePictureUri?.let { putString("profilePicture", it.toString()) }
              googleIdTokenCredential.phoneNumber?.let { putString("phoneNumber", it) }
            }
          } catch (e: GoogleIdTokenParsingException) {
            Log.e("CredentialManager", "Received an invalid google id token response", e)
            return null
          }
        } else {
          Log.e("CredentialManager", "Received an unexpected credential type")
          return null
        }
      }

      else -> {
        // Catch any unrecognized credential type here.
        Log.e("CredentialManager", "Unexpected type of credential")
        return null
      }
    }
  }

  fun getGoogleId(
    setFilterByAuthorizedAccounts: Boolean,
    nonce: String,
    serverClientId: String,
    autoSelectEnabled: Boolean,
  ): GetGoogleIdOption {
    Log.d("CredentialManager", "getGoogleId - setFilterByAuthorizedAccounts: $setFilterByAuthorizedAccounts")

    return GetGoogleIdOption
      .Builder()
      .setFilterByAuthorizedAccounts(setFilterByAuthorizedAccounts)
      .setServerClientId(serverClientId)
      .setAutoSelectEnabled(autoSelectEnabled)
      .setNonce(nonce)
      .build()
  }

  suspend fun googleSignInRequest(googleIdOption: GetGoogleIdOption): GetCredentialResponse {
    val request: GetCredentialRequest =
      GetCredentialRequest
        .Builder()
        .addCredentialOption(googleIdOption)
        .build()

    val activityContext = getActivityContext()
    val result =
      credentialManager.getCredential(
        request = request,
        context = activityContext,
      )

    return result
  }
}
