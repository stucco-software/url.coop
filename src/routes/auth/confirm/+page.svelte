<script>
  import { onMount } from 'svelte'
  import { goto } from "$app/navigation"
  import { clientSession } from "$lib/session.svelte.js"
  import { takeReturnTo } from "$lib/auth.js"

  // hooks.client.js has already exchanged the code by the time we mount
  onMount(() => {
    let returnTo = takeReturnTo()
    if (clientSession.data?.info?.isLoggedIn) {
      goto(returnTo || '/editor', { replaceState: true })
    } else {
      goto('/auth', { replaceState: true })
    }
  })
</script>

<h1>Logging In…</h1>
