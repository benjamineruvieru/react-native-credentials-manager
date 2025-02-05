package com.credentialsmanager.handlers

import android.content.Context
import android.util.Log
import androidx.credentials.CreatePasswordRequest
import androidx.credentials.CreatePublicKeyCredentialRequest
import androidx.credentials.CreatePublicKeyCredentialResponse
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import androidx.credentials.GetPasswordOption
import androidx.credentials.GetPublicKeyCredentialOption
import androidx.credentials.PasswordCredential
import androidx.credentials.PublicKeyCredential
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.android.libraries.identity.googleid.GoogleIdTokenParsingException
import org.json.JSONObject
import androidx.credentials.ClearCredentialStateRequest

class CredentialHandler(
  private val context: Context,
) {
  private val credentialManager = CredentialManager.create(context)

  suspend fun signOut(){

    credentialManager.clearCredentialState(ClearCredentialStateRequest())

  }
  suspend fun createPasskey(
    jsonString: String,
    preferImmediatelyAvailableCredentials: Boolean,
  ): ReadableMap? {
    val request =
      CreatePublicKeyCredentialRequest(
        requestJson = jsonString,
        preferImmediatelyAvailableCredentials = preferImmediatelyAvailableCredentials,
      )

    val response =
      credentialManager.createCredential(
        context,
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
  }

  suspend fun createPassword(
    username: String,
    password: String,
  ) {
    val createPasswordRequest = CreatePasswordRequest(id = username, password = password)
    credentialManager.createCredential(context, createPasswordRequest)
  }

  suspend fun getSavedCredentials(jsonString: String): ReadableMap? {
    val getPublicKeyCredentialOption = GetPublicKeyCredentialOption(jsonString, null)
    val getPasswordOption = GetPasswordOption()

    val result =
      credentialManager.getCredential(
        context,
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

    val result =
      credentialManager.getCredential(
        request = request,
        context = context,
      )

    return result
  }
}
