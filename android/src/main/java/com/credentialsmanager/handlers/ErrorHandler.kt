package com.credentialsmanager.handlers

import android.util.Log
import androidx.credentials.exceptions.CreateCredentialCancellationException
import androidx.credentials.exceptions.CreateCredentialCustomException
import androidx.credentials.exceptions.CreateCredentialException
import androidx.credentials.exceptions.CreateCredentialInterruptedException
import androidx.credentials.exceptions.CreateCredentialProviderConfigurationException
import androidx.credentials.exceptions.CreateCredentialUnknownException
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.GetCredentialInterruptedException
import androidx.credentials.exceptions.GetCredentialUnknownException
import androidx.credentials.exceptions.publickeycredential.CreatePublicKeyCredentialDomException

object ErrorHandler {
  fun handleCredentialError(e: CreateCredentialException) {
    when (e) {
      is CreatePublicKeyCredentialDomException -> {
        Log.d("CredentialManager", "passkey DOM errors")
      }
      is CreateCredentialCancellationException -> {
        Log.d("CredentialManager", "User cancelled")
      }
      is CreateCredentialInterruptedException -> {
        Log.d("CredentialManager", "Retry process")
      }
      is CreateCredentialProviderConfigurationException -> {
        Log.d("CredentialManager", "Missing provider configuration")
      }
      is CreateCredentialUnknownException -> {
        Log.d("CredentialManager", "Unknown error")
      }
      is CreateCredentialCustomException -> {
        Log.d("CredentialManager", "Custom credential error")
      }
      else -> Log.w("CredentialManager", "Unexpected exception type ${e::class.java.name}")
    }
  }

  fun handleGetCredentialError(e: GetCredentialException) {
    when (e) {
      is GetCredentialCancellationException -> {
        Log.d("CredentialManager", "GetCredentialCancellationException")
      }
      is GetCredentialInterruptedException -> {
        Log.d("CredentialManager", "User interputted")
      }
      is GetCredentialUnknownException -> {
        Log.d("CredentialManager", "Unknown error")
      }

      else -> Log.w("CredentialManager", "Unexpected exception type ${e::class.java.name}")
    }
  }
}
