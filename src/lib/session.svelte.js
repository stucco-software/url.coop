export let clientSession = $state({
  data: null,
  profile: null
})

export const setSession = user => {
  clientSession.data = user
  return clientSession
}

export const clearSession = () => {
  clientSession.data = null
  clientSession.profile = null
}
