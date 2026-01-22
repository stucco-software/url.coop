import jsonld from "jsonld"

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
  console.log(compress)
  console.log(`----------------`)
  return compress

}

export const load = async ({fetch, params}) => {
  let webid = `https://${params.subdomain}.login.stucco.software/profile/card#me`

  const profile = await fetchProfileCard({
    f: fetch,
    webid
  })

  return {
    subdomain: params.subdomain,
    webId: webid,
    profile
  }
}