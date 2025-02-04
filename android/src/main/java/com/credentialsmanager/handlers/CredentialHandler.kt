package com.credentialsmanager.handlers

import android.content.Context
import androidx.credentials.CreatePasswordRequest
import androidx.credentials.CreatePublicKeyCredentialRequest
import androidx.credentials.CreatePublicKeyCredentialResponse
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetPasswordOption
import androidx.credentials.GetPublicKeyCredentialOption
import androidx.credentials.PasswordCredential
import androidx.credentials.PublicKeyCredential
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import org.json.JSONObject

class CredentialHandler(
  private val context: Context,
) {
  private val credentialManager = CredentialManager.create(context)

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

    return when (result.credential) {
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
      else -> null
    }
  }
}
