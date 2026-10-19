<script>
  import { update } from "$lib/crud.js"
  import { clientSession } from "$lib/session.svelte.js"
  import { fetchProfileCard } from "$lib/profile.js"
  import { arrayify } from "$lib/helpers.js"

  let links = new Map([
    ['website', {
      label: "Website",
      icon: "🌐",
    }],
    ['email', {
      label: "E-Mail",
      icon: "📧",
    }],
    ['mastodon', {
      label: "Mastodon",
      icon: "🐘",
    }],
    ['bluesky', {
      label: "Bluesky",
      icon: "🦋",
    }],
    ['custom', {
      label: "Custom",
      icon: "🔗",
    }],
  ])

  let id = $state(`urn:uuid:${crypto.randomUUID().replaceAll('-', '')}`)
  let active = $state(null)
  let saving = $state(false)
  let saved = $state(false)
  let error = $state(null)

  let existingLinks = $derived.by(() => {
    if (!clientSession.profile || !clientSession.profile.links) return []
    return arrayify(clientSession.profile.links)
  })

  const activate = (key) => () => {
    if (active === key) {
      active = null
    } else {
      active = key
      error = null
      saved = false
    }
  }

  const close = (e) => {
    e.preventDefault()
    active = null
    error = null
  }

  const handle = async e => {
    e.preventDefault()
    saving = true
    error = null
    let formData = new FormData(e.target)
    try {
      let response = await update({subject: clientSession.data.info.webId, formData})
      if (response && response.ok === false) {
        throw new Error('Failed to save link')
      }
      let profile = await fetchProfileCard({
        webid: clientSession.data.info.webId,
        f: clientSession.data.fetch
      })
      clientSession.profile = profile
      id = `urn:uuid:${crypto.randomUUID().replaceAll('-', '')}`
      saving = false
      saved = true
      setTimeout(() => {
        saved = false
        active = null
      }, 1200)
    } catch (err) {
      saving = false
      error = err.message || 'Failed to save. Please try again.'
    }
  }
</script>

<div class="link-picker">
  <div class="type-grid">
    {#each [...links.keys()] as key}
      <button
        class="type-btn"
        class:type-btn-active={active === key}
        onclick={activate(key)}>
        <!-- <span class="type-icon">{links.get(key).icon}</span> -->
        <span class="type-label">{links.get(key).label}</span>
      </button>
      {#if active === key}
        <form class="link-form" onsubmit={handle} action="/profile">
          <input
            type="hidden"
            name="sid:links :"
            value="{id}">
          {#if active === 'custom'}
            <input type="hidden" name="{id} sid:linkType" value="Custom">
            <label>
              Label
              <input type="text" name="{id} sid:label" class="link-input" disabled={saving}>
            </label>
            <label>
              URL
              <input type="url" name="{id} sid:href" class="link-input" disabled={saving}>
            </label>
          {/if}
          {#if active === 'website'}
            <input type="hidden" name="{id} sid:linkType" value="Website">
            <label>
              Label
              <input type="text" name="{id} sid:label" class="link-input" disabled={saving}>
            </label>
            <label>
              URL
              <input type="url" name="{id} sid:href" class="link-input" disabled={saving}>
            </label>
          {/if}
          {#if active === 'email'}
            <input type="hidden" name="{id} sid:linkType" value="Email">
            <input type="hidden" name="{id} sid:label" value="E-Mail">
            <label>
              Address
              <input
                type="email"
                placeholder="username@server"
                name="{id} sid:mbox"
                class="link-input"
                disabled={saving}>
            </label>
          {/if}
          {#if active === 'mastodon'}
            <input type="hidden" name="{id} sid:linkType" value="Mastodon">
            <input type="hidden" name="{id} sid:label" value="Mastodon">
            <label>
              Handle
              <input
                type="text"
                placeholder="@username@server"
                name="{id} sid:handle"
                class="link-input"
                disabled={saving}>
            </label>
          {/if}
          {#if active === 'bluesky'}
            <input type="hidden" name="{id} sid:linkType" value="Bluesky">
            <input type="hidden" name="{id} sid:label" value="Bluesky">
            <label>
              Handle
              <input
                type="text"
                placeholder="@username.server"
                name="{id} sid:handle"
                class="link-input"
                disabled={saving}>
            </label>
          {/if}

          {#if error}
            <p class="link-error">{error}</p>
          {/if}

          <div class="link-actions">
            <button
              type="button"
              class="btn btn-secondary"
              onclick={close}
              disabled={saving}>
              cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              disabled={saving}>
              {#if saving}
                Saving...
              {:else if saved}
                Saved
              {:else}
                save
              {/if}
            </button>
          </div>
        </form>
      {/if}
    {/each}
  </div>
</div>

<style>
  .link-picker {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--lead-1);
  }

  .existing-links {
    display: flex;
    flex-direction: column;
    gap: var(--lead-quarter);
    margin-block-end: var(--lead-half);
  }

  .link-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--lead-quarter) var(--lead-half);
    border: 1px solid var(--gray);
    background: var(--white);
  }

  .link-info {
    display: flex;
    flex-direction: column;
    gap: 0;
    min-width: 0;
  }

  .link-label {
    font-weight: 500;
    font-size: var(--txt-0);
  }

  .link-value {
    font-size: var(--txt-0);
    color: var(--dark-gray);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .picker-heading {
    margin: 0;
    font-size: var(--txt-0);
    font-weight: 500;
    color: var(--dark-gray);
    margin-block-end: var(--lead-quarter);
  }

  .type-grid {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .type-btn {
    display: flex;
    align-items: center;
    gap: var(--lead-half);
    width: 100%;
    padding: var(--lead-half);
    border: 1px solid var(--gray);
    border-bottom: 0;
    background: var(--white);
    font-size: var(--txt-0);
    font-family: var(--sans-stack);
    cursor: pointer;
    transition: background-color 0.15s ease;
    text-align: left;
  }
  .type-btn:last-of-type {
    border-bottom: 1px solid var(--gray);
  }
  .type-btn:hover {
    background-color: var(--light-gray);
  }
  .type-btn-active {
    background-color: var(--light-gray);
    border-color: var(--txt-color);
    border-bottom: 1px solid var(--txt-color);
  }

  .type-icon {
    font-size: var(--txt-0);
    line-height: 1;
  }

  .type-label {
    font-weight: 500;
  }

  .link-form {
    display: flex;
    flex-direction: column;
    gap: var(--lead-quarter);
    padding: var(--lead-half);
    border: 1px solid var(--txt-color);
    border-top: 0;
    background: var(--white);
    margin-block-end: var(--lead-quarter);
  }

  .link-form label {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: var(--txt-0);
    font-weight: 500;
  }

  .link-input {
    width: 100%;
    padding: var(--lead-quarter);
    border: 1px solid var(--dark-gray);
    font-size: var(--txt-0);
    font-family: var(--sans-stack);
  }
  .link-input:focus {
    outline: 2px solid var(--txt-color);
    outline-offset: 1px;
  }
  .link-input:disabled {
    opacity: 0.6;
  }

  .link-error {
    margin: 0;
    padding: var(--lead-quarter);
    color: var(--red);
    font-size: var(--txt-0);
    background-color: color-mix(in srgb, var(--red), transparent 90%);
    border: 1px solid var(--red);
  }

  .link-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--lead-quarter);
    margin-block-start: var(--lead-quarter);
  }

  .btn {
    border: 1px solid var(--txt-color);
    padding: var(--lead-quarter) var(--lead-half);
    font-size: var(--txt-0);
    font-family: var(--sans-stack);
    cursor: pointer;
    transition: background-color 0.15s ease;
  }
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background-color: var(--txt-color);
    color: var(--white);
  }
  .btn-primary:hover:not(:disabled) {
    background-color: var(--black);
  }

  .btn-secondary {
    background-color: var(--white);
    color: var(--txt-color);
  }
  .btn-secondary:hover:not(:disabled) {
    background-color: var(--light-gray);
  }
</style>
