import jsonld from "jsonld"
import QRCode from 'qrcode'

const arrayify = target => Array.isArray(target) ? target : [target]


const urlifyMastodon = (handle) => {
  const arr = handle.split('@')
  return `https://${arr[2]}/@${arr[1]}`
}

const urlifyBluesky = (handle) => {
  return `https://bsky.app/profile/${handle.replace('@', '')}`
}

const fetchProfileCard = async ({webid, f}) => {
  let res = await f(webid, {
    headers: {
      accept: "application/json"
    }
  })
  let data = await res.json()
  let profile = await jsonld.frame({
    '@context': {
      "@vocab": 'https://solidid.stucco.software/vocabulary#'
    },
    '@graph': data
  }, {
    '@id': webid,
    '@embed': true,
    "@explicit": false
  })
  let compress = await jsonld.compact(profile, {
      "@vocab": 'https://solidid.stucco.software/vocabulary#'
    })
  return compress
}

const qrify = async url => {
  let qr = await QRCode.toDataURL(url, {
    errorCorrectionLevel: 'L',
    margin: 1,
    color: {
      dark:"#2e2e2e",
      light:"#fbfbfb"
    }
  })
  return qr
}


export const load = async ({fetch, params}) => {
  let webid = `https://${params.subdomain}.login.stucco.software/profile/card#me`
  let here = `https://url.coop/${params.subdomain}`
  let qr = await qrify(here)

  const profile = await fetchProfileCard({
    f: fetch,
    webid
  })

  return {
    subdomain: params.subdomain,
    webId: webid,
    profile,
    here,
    qr
  }
}