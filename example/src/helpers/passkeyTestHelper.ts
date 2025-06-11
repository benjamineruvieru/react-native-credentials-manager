/**
 * Generates a proper base64 challenge string
 * @returns A valid base64-encoded challenge string
 */
export function generateValidChallenge(): string {
  // Generate random bytes
  const randomBytes = new Uint8Array(32);
  for (let i = 0; i < randomBytes.length; i++) {
    randomBytes[i] = Math.floor(Math.random() * 256);
  }

  // Convert to base64
  return bytesToBase64(randomBytes);
}

/**
 * Convert Uint8Array to base64 string
 */
function bytesToBase64(bytes: Uint8Array): string {
  const binString = Array.from(bytes)
    .map((byte) => String.fromCharCode(byte))
    .join('');

  return btoa(binString);
}

/**
 * Generate a valid RP ID for testing
 */
export function getTestRpId(): string {
  return 'www.benjamineruvieru.com';
}

/**
 * Generate a valid registration request for testing
 */
export function generateTestRegistrationRequest(
  username: string = 'testuser'
): any {
  const userId = bytesToBase64(
    new TextEncoder().encode(
      `user_id_${Math.random().toString(36).substring(2, 15)}`
    )
  );

  return {
    challenge: generateValidChallenge(),
    rp: {
      name: 'Test App',
      id: getTestRpId(),
    },
    user: {
      id: userId,
      name: username,
      displayName: username,
    },
    pubKeyCredParams: [
      {
        type: 'public-key',
        alg: -7, // ES256
      },
      {
        type: 'public-key',
        alg: -257, // RS256
      },
    ],
    timeout: 60000, // 1 minute is usually enough for testing
    attestation: 'none',
    excludeCredentials: [],
    authenticatorSelection: {
      residentKey: 'preferred',
      requireResidentKey: false,
      userVerification: 'preferred',
      authenticatorAttachment: 'platform',
    },
  };
}

/**
 * Generate a valid authentication request for testing
 */
export function generateTestAuthenticationRequest(): any {
  return {
    challenge: generateValidChallenge(),
    timeout: 60000,
    userVerification: 'required',
    rpId: getTestRpId(),
  };
}
