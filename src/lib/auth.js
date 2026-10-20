// Solid-OIDC login for the browser, no dependencies.
//
// The DPoP CryptoKeyPair lives in IndexedDB (CryptoKeys are structured-
// cloneable but not JSON-serializable), so a hard reload restores the
// session by refreshing against the token endpoint — never by redirecting.

const DB_NAME = 'solid-auth'
const STORE = 'session'
const PENDING = 'solid_auth_pending'
const RETURN_TO = 'solid_return_to'
const SCOPE = 'openid offline_access webid'
const EXPIRY_MARGIN = 60 * 1000

let current = null // { keyPair, jwk, session }
let refreshing = null
let nonces = new Map() // origin -> latest DPoP-Nonce

// --- IndexedDB -------------------------------------------------------------

const openDb = () => new Promise((resolve, reject) => {
  let req = indexedDB.open(DB_NAME, 1)
  req.onupgradeneeded = () => req.result.createObjectStore(STORE)
  req.onsuccess = () => resolve(req.result)
  req.onerror = () => reject(req.error)
})

const idb = async (mode, fn) => {
  let db = await openDb()
  try {
    return await new Promise((resolve, reject) => {
      let tx = db.transaction(STORE, mode)
      let req = fn(tx.objectStore(STORE))
      tx.oncomplete = () => resolve(req?.result)
      tx.onerror = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

const dbGet = key => idb('readonly', s => s.get(key))
const dbPut = (key, value) => idb('readwrite', s => s.put(value, key))
const dbDelete = key => idb('readwrite', s => s.delete(key))

// --- encoding --------------------------------------------------------------

const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const b64urlJson = obj => b64url(new TextEncoder().encode(JSON.stringify(obj)))

const randomString = (n = 32) => b64url(crypto.getRandomValues(new Uint8Array(n)))

const sha256 = async str => b64url(
  await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
)

const decodeJwt = token => {
  let part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  let bytes = Uint8Array.from(atob(part), c => c.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes))
}

// --- DPoP ------------------------------------------------------------------

const generateKeys = async () => {
  let keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign', 'verify']
  )
  // public keys stay exportable even when the pair is non-extractable
  let { kty, crv, x, y } = await crypto.subtle.exportKey('jwk', keyPair.publicKey)
  return { keyPair, jwk: { kty, crv, x, y } }
}

// htu is the request URI without query or fragment (RFC 9449 §4.2)
const htuOf = url => {
  let u = new URL(url)
  return `${u.origin}${u.pathname}`
}

const dpopProof = async ({ keyPair, jwk }, method, url, accessToken) => {
  let header = { alg: 'ES256', typ: 'dpop+jwt', jwk }
  let payload = {
    htm: method.toUpperCase(),
    htu: htuOf(url),
    jti: crypto.randomUUID(),
    iat: Math.floor(Date.now() / 1000)
  }
  let nonce = nonces.get(new URL(url).origin)
  if (nonce) payload.nonce = nonce
  if (accessToken) payload.ath = await sha256(accessToken)
  let input = `${b64urlJson(header)}.${b64urlJson(payload)}`
  // WebCrypto emits IEEE P1363 (r || s), which is what JWS wants
  let sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    keyPair.privateKey,
    new TextEncoder().encode(input)
  )
  return `${input}.${b64url(sig)}`
}

const rememberNonce = (url, res) => {
  let nonce = res.headers.get('DPoP-Nonce')
  if (nonce) nonces.set(new URL(url).origin, nonce)
  return nonce
}

// fetch with a DPoP proof, retrying once if the server demands a fresh nonce
const dpopFetch = async (keys, url, init = {}, accessToken) => {
  let method = init.method || 'GET'
  let send = async () => {
    let headers = new Headers(init.headers)
    headers.set('DPoP', await dpopProof(keys, method, url, accessToken))
    if (accessToken) headers.set('Authorization', `DPoP ${accessToken}`)
    return fetch(url, { ...init, headers })
  }
  let sentNonce = nonces.get(new URL(url).origin)
  let res = await send()
  let newNonce = rememberNonce(url, res)
  if (newNonce && newNonce !== sentNonce && (res.status === 400 || res.status === 401)) {
    res = await send()
    rememberNonce(url, res)
  }
  return res
}

// --- OIDC ------------------------------------------------------------------

const discover = async issuer => {
  let base = issuer.replace(/\/+$/, '')
  let res = await fetch(`${base}/.well-known/openid-configuration`)
  if (!res.ok) throw new Error(`Could not reach identity provider at ${issuer}`)
  return res.json()
}

// Prefer a Solid-OIDC Client ID Document; fall back to dynamic registration
// for issuers that don't support one.
const resolveClientId = async (config, { clientId, clientName, redirectUri }) => {
  let solid = config.scopes_supported?.includes('webid')
  if (clientId && solid) return clientId
  if (!config.registration_endpoint) {
    throw new Error('Identity provider does not support client registration')
  }
  let res = await fetch(config.registration_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_name: clientName,
      application_type: 'web',
      redirect_uris: [redirectUri],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      scope: SCOPE,
      token_endpoint_auth_method: 'none'
    })
  })
  if (!res.ok) throw new Error('Client registration failed')
  let { client_id } = await res.json()
  return client_id
}

const requestTokens = async (keys, tokenEndpoint, params) => {
  let res = await dpopFetch(keys, tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params)
  })
  let body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.error_description || body.error || `Token request failed (${res.status})`)
  }
  return body
}

const expiryOf = tokens => {
  if (tokens.expires_in) return Date.now() + tokens.expires_in * 1000
  try {
    return decodeJwt(tokens.access_token).exp * 1000
  } catch {
    return Date.now() + 5 * 60 * 1000
  }
}

const persist = async () => {
  await dbPut('current', current)
}

const clearLocal = async () => {
  current = null
  nonces.clear()
  await dbDelete('current').catch(() => {})
  await dbDelete('pending_keys').catch(() => {})
}

const refresh = () => {
  // refresh tokens rotate, so concurrent refreshes would revoke each other
  refreshing ??= (async () => {
    let { session } = current
    if (!session.refreshToken) throw new Error('No refresh token')
    let tokens = await requestTokens(current, session.tokenEndpoint, {
      grant_type: 'refresh_token',
      refresh_token: session.refreshToken,
      client_id: session.clientId
    })
    current.session = {
      ...session,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || session.refreshToken,
      expiresAt: expiryOf(tokens)
    }
    await persist()
  })().finally(() => { refreshing = null })
  return refreshing
}

const ensureFresh = async () => {
  if (!current) throw new Error('Not logged in')
  if (current.session.expiresAt - Date.now() < EXPIRY_MARGIN) {
    try {
      await refresh()
    } catch (e) {
      await clearLocal()
      throw e
    }
  }
}

const handleCallback = async params => {
  let pending = JSON.parse(sessionStorage.getItem(PENDING) || 'null')
  sessionStorage.removeItem(PENDING)
  let keys = await dbGet('pending_keys')
  if (!pending || !keys) throw new Error('No login in progress')
  if (params.get('state') !== pending.state) throw new Error('Login state mismatch')
  let iss = params.get('iss')
  if (iss && iss !== pending.issuer) throw new Error('Login issuer mismatch')

  let tokens = await requestTokens(keys, pending.tokenEndpoint, {
    grant_type: 'authorization_code',
    code: params.get('code'),
    redirect_uri: pending.redirectUri,
    code_verifier: pending.codeVerifier,
    client_id: pending.clientId
  })
  let claims = decodeJwt(tokens.id_token)
  if (claims.iss !== pending.issuer) throw new Error('ID token issuer mismatch')

  current = {
    ...keys,
    session: {
      webId: claims.webid || claims.sub,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      issuer: pending.issuer,
      tokenEndpoint: pending.tokenEndpoint,
      clientId: pending.clientId,
      expiresAt: expiryOf(tokens)
    }
  }
  await persist()
  await dbDelete('pending_keys')
}

// --- public API ------------------------------------------------------------

export const authFetch = async (url, init = {}) => {
  await ensureFresh()
  return dpopFetch(current, String(url), init, current.session.accessToken)
}

export const getSession = () => ({
  info: {
    isLoggedIn: !!current,
    webId: current?.session.webId ?? null
  },
  fetch: authFetch
})

// Call once on startup. Completes a pending login if the URL carries an
// authorization code, otherwise restores the stored session.
export const initAuth = async () => {
  let params = new URLSearchParams(window.location.search)
  if (params.has('code') && sessionStorage.getItem(PENDING)) {
    try {
      await handleCallback(params)
    } catch (e) {
      console.error('Solid login failed:', e)
      await clearLocal()
    }
    return getSession()
  }
  if (params.has('error') && sessionStorage.getItem(PENDING)) {
    console.error('Solid login failed:', params.get('error_description') || params.get('error'))
    sessionStorage.removeItem(PENDING)
    await dbDelete('pending_keys').catch(() => {})
    return getSession()
  }

  current = (await dbGet('current').catch(() => null)) || null
  if (current) {
    try {
      await ensureFresh()
    } catch (e) {
      console.warn('Could not restore Solid session:', e)
    }
  }
  return getSession()
}

export const solidLogin = async (issuer, {
  clientId,
  clientName = 'url.coop',
  redirectUri = `${window.location.origin}/auth/confirm`,
  returnTo = '/'
} = {}) => {
  let keys = await generateKeys()
  await dbPut('pending_keys', keys)

  let config = await discover(issuer)
  let client_id = await resolveClientId(config, { clientId, clientName, redirectUri })
  let codeVerifier = randomString()
  let state = randomString(16)

  sessionStorage.setItem(PENDING, JSON.stringify({
    issuer: config.issuer,
    tokenEndpoint: config.token_endpoint,
    clientId: client_id,
    codeVerifier,
    redirectUri,
    state
  }))
  localStorage.setItem(RETURN_TO, returnTo)

  let url = new URL(config.authorization_endpoint)
  url.search = new URLSearchParams({
    response_type: 'code',
    client_id,
    redirect_uri: redirectUri,
    scope: SCOPE,
    code_challenge: await sha256(codeVerifier),
    code_challenge_method: 'S256',
    state,
    prompt: 'consent'
  })
  window.location.assign(url)
}

export const takeReturnTo = () => {
  let path = localStorage.getItem(RETURN_TO)
  localStorage.removeItem(RETURN_TO)
  return path
}

export const solidLogout = async (returnTo = '/') => {
  await clearLocal()
  window.location.assign(returnTo)
}
