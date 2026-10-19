<script>
  import { onMount } from 'svelte'
  import { goto } from "$app/navigation"
  import { setSession } from "$lib/session.svelte.js"
  import {
    getDefaultSession
  } from '@inrupt/solid-client-authn-browser'

  onMount(async () => {
    let session = getDefaultSession()
    if (session.info.isLoggedIn) {
      setSession(session)
      let redirect = localStorage.getItem('redirectTo')
      if (redirect && !redirect.includes('auth/confirm')) {
        goto(redirect)
      } else {
        goto('/editor')
      }
    } else {
      goto('/auth')
    }
  })
</script>

<h1>Logging In…</h1>
