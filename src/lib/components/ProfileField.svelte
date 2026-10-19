<script>
  import { update } from "$lib/crud.js"
  import { clientSession } from "$lib/session.svelte.js"

  const {
    term,
    profile
  } = $props()

  const sid = 'https://solidid.stucco.software/vocabulary#'

  let editing = $state(false)
  let saving = $state(false)
  let saved = $state(false)
  let error = $state(null)
  let value = $state(profile[term]
      ? profile[term]
      : null)

  const updateHandler = async (e) => {
    e.preventDefault()
    saving = true
    error = null
    let formData = new FormData(e.target)
    try {
      let response = await update({
        subject: clientSession.data.info.webId,
        formData
      })
      if (response && response.ok === false) {
        throw new Error('Save failed')
      }
      saving = false
      saved = true
      setTimeout(() => {
        saved = false
        editing = false
      }, 1200)
    } catch (err) {
      saving = false
      error = err.message || 'Failed to save. Please try again.'
    }
  }

  const cancel = () => {
    value = profile[term] ? profile[term] : null
    error = null
    editing = false
  }
</script>

{#if profile[term] && !editing}
  <span class="field-value">{value}</span>
  <button onclick={() => {editing = true}}>
    edit
  </button>
{:else}
  <form class="field-form" onsubmit={updateHandler}>
    <input
      bind:value={value}
      type="text"
      name="= sid:{term}"
      class="field-input"
      disabled={saving}>
    {#if error}
      <p class="field-error">{error}</p>
    {/if}
    <div class="field-actions">
      <button
        type="button"
        class="btn btn-secondary btn-sm"
        onclick={cancel}
        disabled={saving}>
        cancel
      </button>
      <button
        type="submit"
        class="btn btn-primary btn-sm"
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

<style>
  .field-value {
    flex: 1;
  }

  .field-form {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--lead-quarter);
  }

  .field-input {
    width: 100%;
    padding: var(--lead-quarter);
    border: 1px solid var(--dark-gray);
    font-size: var(--txt--1);
    font-family: var(--sans-stack);
  }
  .field-input:focus {
    outline: 2px solid var(--txt-color);
    outline-offset: 1px;
  }
  .field-input:disabled {
    opacity: 0.6;
  }

  .field-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--lead-quarter);
  }

  .field-error {
    margin: 0;
    padding: var(--lead-quarter);
    color: var(--red);
    font-size: var(--txt--1);
    background-color: color-mix(in srgb, var(--red), transparent 90%);
    border: 1px solid var(--red);
  }

  .btn {
    border: 1px solid var(--txt-color);
    padding: var(--lead-quarter) var(--lead-half);
    font-size: var(--txt--1);
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

  .btn-sm {
    padding: var(--lead-quarter) var(--lead-half);
    font-size: var(--txt--2);
  }
</style>
