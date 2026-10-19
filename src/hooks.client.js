import { handleIncomingRedirect } from '@inrupt/solid-client-authn-browser'

export const init = async () => {
  let path = window.location.href
  if (!path.includes('auth/confirm')) {
    localStorage.setItem('redirectTo', path)
  }
  await handleIncomingRedirect({
    restorePreviousSession: true
  })
}
