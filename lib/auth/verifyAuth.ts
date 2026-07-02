import { NextRequest } from 'next/server';

/**
 * Verify a Firebase ID token on the server without the Admin SDK.
 *
 * The client sends `Authorization: Bearer <idToken>` (from
 * `auth.currentUser.getIdToken()`). We verify it against Firebase's
 * Identity Toolkit REST endpoint using the project's public web API key.
 * A valid, unexpired token returns the user's uid; anything else returns null.
 *
 * This is a lightweight check (no new dependency). For higher-assurance
 * verification you'd use firebase-admin, but that's out of scope here.
 */
export async function getAuthedUid(request: NextRequest): Promise<string | null> {
  const authHeader =
    request.headers.get('authorization') || request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const idToken = authHeader.slice('Bearer '.length).trim();
  if (!idToken) return null;

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    console.error('NEXT_PUBLIC_FIREBASE_API_KEY is not set — cannot verify auth');
    return null;
  }

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const uid = data?.users?.[0]?.localId;
    return typeof uid === 'string' && uid.length > 0 ? uid : null;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return null;
  }
}
