const fetchProfileCard = async ({webid, f}) => {
  let res = await f(webid, {
    headers: {
      accept: "application/json"
    }
  })
  let data = await res.json()
  return data.find(node => node['@id'] == webid)
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