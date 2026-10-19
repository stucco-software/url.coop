<script>
  import { onMount } from 'svelte'
  import { logout } from '@inrupt/solid-client-authn-browser'
  import { PUBLIC_HOST } from "$env/static/public"
  import CopyToClipboard from "$lib/components/CopyToClipboard.svelte"
  import ProfileField from "$lib/components/ProfileField.svelte"
  import ProfileLinkPicker from "$lib/components/ProfileLinkPicker.svelte"
  import ProfileImage from "$lib/components/ProfileImage.svelte"
  import { clientSession, clearSession } from "$lib/session.svelte.js"
  import { arrayify } from "$lib/helpers.js"
  import { fetchProfileCard } from "$lib/profile.js"

  let loading = $state(true)
  let loadError = $state(null)

  let existingLinks = $derived.by(() => {
    if (!clientSession.profile || !clientSession.profile.links) return []
    return arrayify(clientSession.profile.links)
  })

  // stucco pods get the pretty url.coop/name path; every other pod
  // gets the stateless /p/<base64url webid> path
  let publicUrl = $derived.by(() => {
    let webid = clientSession.data?.info?.webId
    if (!webid) return null
    let match = webid.match(/^https?:\/\/([^.]+)\.login\.stucco\.software\//)
    if (match) return `https://url.coop/${match[1]}`
    let encoded = btoa(webid).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    return `https://url.coop/p/${encoded}`
  })

  onMount(async () => {
    if (clientSession.data) {
      try {
        let profile = await fetchProfileCard({
          webid: clientSession.data.info.webId,
          f: clientSession.data.fetch
        })
        clientSession.profile = profile
      } catch (e) {
        loadError = e.message || 'Could not load your profile card'
      } finally {
        loading = false
      }
    }
  })

  const signOut = async () => {
    clearSession()
    await logout({ returnToUrl: PUBLIC_HOST })
  }
</script>

<div class="card">
  <header>
    <h1>Edit your page</h1>
    <button class="logout" onclick={signOut}>sign out</button>
  </header>

  {#if loadError}
    <p class="error">{loadError}</p>
  {/if}

  <section>
    {#if loading}
      <p class="loading">Loading your profile…</p>
    {:else}
      <dl>
        <div class="two-up">
          <ProfileImage />

          <div>
            <dt>Display Name:</dt>
            <dd>
              <ProfileField term="displayName" profile={clientSession.profile} />
            </dd>
          </div>
        </div>

        <dt>Introduction:</dt>
        <dd>
          <ProfileField term="introduction" profile={clientSession.profile} />
        </dd>

        {#each existingLinks as link}
          <dl>
            <dt>
              {link.label}
            </dt>
            <dd>
              {#if link.mbox}{link.mbox}{/if}
              {#if link.href}{link.href}{/if}
              {#if link.handle}{link.handle}{/if}
            </dd>
          </dl>
        {/each}

        <dt>WebID:</dt>
        <dd>
          {clientSession.data.info.webId}
          <CopyToClipboard
            label="copy"
            value={clientSession.data.info.webId}
          />
        </dd>

        {#if publicUrl}
          <dt>Your url.coop page:</dt>
          <dd>
            {publicUrl}
            <CopyToClipboard
              label="copy"
              value={publicUrl}
            />
          </dd>
        {/if}
      </dl>
    {/if}
  </section>

  <footer>
    <dl>
      <dt>
        {#if existingLinks.length === 0}
          Add your first link
        {:else}
          Add another link
        {/if}
      </dt>
      <dd>
        <ProfileLinkPicker />
      </dd>
    </dl>
  </footer>
</div>

<style>
  .card {
    border: 2px solid var(--txt-color);
    margin-inline: auto;
    max-width: 36rem;
  }
  .card header {
    padding: var(--lead-half);
    border-bottom: 2px solid var(--txt-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  h1 {
    font-size: var(--txt-0);
    padding: 0;
    margin: 0;
    font-family: var(--sans-stack);
  }
  .logout {
    font-size: var(--txt--1);
    font-family: var(--sans-stack);
    cursor: pointer;
    padding: var(--lead-quarter) var(--lead-half);
    background: transparent;
    border: 1px solid var(--txt-color);
  }
  .loading, .error {
    padding: var(--lead-1);
    margin: 0;
    font-family: var(--sans-stack);
  }
  .error {
    color: var(--red, #c00);
  }
  .card section {
    padding: 0
  }
  .card footer {
    padding: 0;
  }
  dl {
    margin: 0;
  }
  dt {
    font-weight: 500;
    padding: var(--lead-half);
    padding-block-end: 0;
    font-family: var(--sans-stack);
  }
  dd {
    margin: 0;
    padding: var(--lead-half);
    padding-block-start: 0;
    border-bottom: 2px solid var(--txt-color);
    display: flex;
    justify-content: space-between;
    font-family: var(--sans-stack);
  }
  .two-up {
    display: flex;
    align-items: center;
    border-bottom: 2px solid var(--txt-color);
  }
  .two-up div {
    flex: 1;
  }
  .two-up dd {
    border-bottom: 0;
  }
  dd {
    overflow-wrap: anywhere;
    word-break: break-word;
  }
  @media (max-width: 600px) {
    .two-up {
      flex-direction: column;
      align-items: flex-start;
    }
    .two-up div {
      width: 100%;
    }
    dd {
      flex-direction: column;
      gap: var(--lead-quarter);
    }
  }
</style>
