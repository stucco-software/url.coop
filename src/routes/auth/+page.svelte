<script>
  import {
    PUBLIC_CLIENT_ID,
    PUBLIC_HOST,
    PUBLIC_PROVIDER
  } from "$env/static/public"

  import { solidLogin } from '$lib/auth.js'

  let customIssuer = $state('')
  let error = $state(null)

  const login = async issuer => {
    error = null
    try {
      await solidLogin(issuer, {
        clientId: PUBLIC_CLIENT_ID,
        clientName: "url.coop",
        redirectUri: `${PUBLIC_HOST}auth/confirm`,
        returnTo: '/editor'
      })
    } catch (e) {
      error = e.message || 'Could not start sign in'
    }
  }

  const startLogin = async (e) => {
    e.preventDefault()
    await login(PUBLIC_PROVIDER)
  }

  const startCustomLogin = async (e) => {
    e.preventDefault()
    let issuer = customIssuer.trim()
    if (!issuer) return
    if (!issuer.startsWith('http')) issuer = `https://${issuer}`
    await login(issuer)
  }
</script>

<div class="auth-container">
  <h1>Sign in to edit your page</h1>
  {#if error}
    <p class="error">{error}</p>
  {/if}
  <button onclick={startLogin}>Sign In With Stucco ID</button>
  <form class="custom" onsubmit={startCustomLogin}>
    <label for="issuer">Or use another Solid identity provider</label>
    <input
      id="issuer"
      type="text"
      placeholder="https://your-pod.example"
      bind:value={customIssuer}>
    <button type="submit" class="secondary">Sign in</button>
  </form>
  <p><a href="/">Back to url.coop</a></p>
</div>

<style>
  .auth-container {
    max-width: 24rem;
    margin: var(--lead-3) auto;
    text-align: center;
    padding: 0 var(--lead-1);
  }
  h1 {
    font-family: var(--sans-stack);
    font-size: var(--txt-1);
  }
  button {
    width: 100%;
    padding: var(--lead-half) var(--lead-1);
    font-size: var(--txt-0);
    font-family: var(--sans-stack);
    cursor: pointer;
  }
  .custom {
    margin-top: var(--lead-2);
    display: flex;
    flex-direction: column;
    gap: var(--lead-half);
    text-align: left;
  }
  .custom label {
    font-size: var(--txt--1);
    text-align: center;
  }
  .custom input {
    padding: var(--lead-half);
    font-size: var(--txt-0);
    font-family: var(--sans-stack);
  }
  .error {
    color: var(--red, #c00);
    font-size: var(--txt--1);
  }
  .secondary {
    background: transparent;
    border: 1px solid var(--txt-color);
  }
</style>
