import { readProfile } from '$lib/profile'
import { qrify } from '$lib/qr'

export const load = async ({ fetch, params }) => {
  let webid = `https://${params.subdomain}.login.stucco.software/profile/card#me`
  let here = `https://url.coop/${params.subdomain}`
  let qr = await qrify(here)

  const profile = await readProfile({ webid, f: fetch })

  return {
    subdomain: params.subdomain,
    webId: webid,
    profile,
    here,
    qr
  }
}
