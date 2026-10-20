import { initAuth } from '$lib/auth.js'
import { setSession } from '$lib/session.svelte.js'

export const init = async () => {
  let session = await initAuth()
  if (session.info.isLoggedIn) setSession(session)
}
