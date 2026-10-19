import { error } from '@sveltejs/kit'
import { readProfile } from '$lib/profile'
import { qrify } from '$lib/qr'

const MAX_ENCODED_LENGTH = 512

// block obvious private/loopback/link-local targets; this is a guard, not a hard boundary
const PRIVATE_HOST = /^(localhost$|.*\.local$|.*\.internal$|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2[0-9]|3[01])\.|\[?::1\]?$)/

const decodeWebid = (encoded) => {
  if (encoded.length > MAX_ENCODED_LENGTH) throw error(400, 'WebID too long')

  let webid
  try {
    webid = Buffer.from(encoded, 'base64url').toString('utf8')
  } catch {
    throw error(400, 'Malformed WebID encoding')
  }

  let url
  try {
    url = new URL(webid)
  } catch {
    throw error(400, 'WebID is not a valid URL')
  }

  if (url.protocol !== 'https:') throw error(400, 'WebID must use https')
  if (PRIVATE_HOST.test(url.hostname.toLowerCase())) throw error(400, 'WebID host not allowed')

  return webid
}

export const load = async ({ fetch, params }) => {
  const webid = decodeWebid(params.webid)
  const here = `https://url.coop/p/${params.webid}`
  const qr = await qrify(here)

  const profile = await readProfile({ webid, f: fetch })

  return {
    webId: webid,
    profile,
    here,
    qr
  }
}
