<script>
  import { onMount } from 'svelte'
  import { solidLogout } from '$lib/auth.js'
  import CopyToClipboard from "$lib/components/CopyToClipboard.svelte"
  import ProfileField from "$lib/components/ProfileField.svelte"
  import ProfileLinkPicker from "$lib/components/ProfileLinkPicker.svelte"
  import ProfileImage from "$lib/components/ProfileImage.svelte"
  import ProfileCard from "$lib/components/ProfileCard.svelte"
  import { clientSession, clearSession } from "$lib/session.svelte.js"
  import { arrayify } from "$lib/helpers.js"
  import { fetchProfileCard, readProfileFresh } from "$lib/profile.js"
  import { qrify } from "$lib/qr.js"

  let loading = $state(true)
  let loadError = $state(null)
  let preview = $state(null)
  let previewing = $state(false)

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

  const openPreview = async () => {
    previewing = true
    loadError = null
    try {
      let [profile, qr] = await Promise.all([
        readProfileFresh({
          webid: clientSession.data.info.webId,
          f: clientSession.data.fetch
        }),
        qrify(publicUrl)
      ])
      preview = { profile, qr }
    } catch (e) {
      loadError = e.body?.message || e.message || 'Could not load a preview'
    } finally {
      previewing = false
    }
  }

  const closePreview = () => {
    preview = null
  }

  const onKeydown = e => {
    if (preview && e.key === 'Escape') closePreview()
  }

  const signOut = async () => {
    clearSession()
    await solidLogout('/')
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="card">
  <header>
    <h1>Edit your page</h1>
    <div class="actions">
      <button onclick={openPreview} disabled={loading || previewing}>
        {previewing ? 'loading…' : 'preview'}
      </button>
      <button onclick={signOut}>sign out</button>
    </div>
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

{#if preview}
  <div class="preview" role="dialog" aria-modal="true" aria-label="Preview of your page">
    <ProfileCard profile={preview.profile} qr={preview.qr} />
    <button class="close" onclick={closePreview}>close preview</button>
  </div>
{/if}

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
  .actions {
    display: flex;
    gap: var(--lead-quarter);
  }
  .actions button, .close {
    font-size: var(--txt--1);
    font-family: var(--sans-stack);
    cursor: pointer;
    padding: var(--lead-quarter) var(--lead-half);
    background: transparent;
    border: 1px solid var(--txt-color);
  }
  .close {
    position: fixed;
    top: var(--lead-1);
    right: var(--lead-1);
    z-index: 1;
    background: var(--white);
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
