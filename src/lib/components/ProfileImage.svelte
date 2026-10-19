<script>
  import { clientSession } from "$lib/session.svelte.js"
  import { validateImage, resizeImage, blobToDataUri, uploadProfileImage } from "$lib/image.js"

  let uploading = $state(false)
  let error = $state('')


  const imageUrl = $derived(
    clientSession.profile?.['https://solidid.stucco.software/vocabulary#image']?.[0]?.['@value']
    || clientSession.profile?.['https://solidid.stucco.software/vocabulary#image']?.[0]?.['@id']
    || clientSession.profile?.image
    || 'https://stucco.software/favicon.png'
  )

  let fileInput

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateImage(file)
    if (validation.error) {
      error = validation.error
      return
    }

    uploading = true
    error = ''

    try {
      const blob = await resizeImage(file)
      const dataUri = await blobToDataUri(blob)
      await uploadProfileImage({
        dataUri,
        webId: clientSession.data.info.webId,
        authenticatedFetch: clientSession.data.fetch
      })

      clientSession.profile['https://solidid.stucco.software/vocabulary#image'] = [{ '@value': dataUri }]
    } catch (e) {
      error = e.message
    } finally {
      uploading = false
    }
  }
</script>

<button class="image-upload" onclick={() => fileInput.click()} disabled={uploading}>
  {#if uploading}
    <img src={imageUrl} alt="Uploading..." style="opacity: 0.5" />
  {:else}
    <img src={imageUrl} alt="Profile" />
  {/if}
</button>
<input
  bind:this={fileInput}
  type="file"
  accept="image/jpeg,image/png,image/webp,image/gif"
  onchange={handleUpload}
  hidden
/>
{#if error}
  <p class="error">{error}</p>
{/if}

<style>
  .image-upload {
    border: 0;
    background-color: transparent;
    cursor: pointer;
  }
  .image-upload:hover {
    opacity: 0.8;
  }
  .image-upload:disabled {
    cursor: wait;
  }
  img {
    max-width: var(--lead-4);
    border: 1px solid var(--txt-color);
  }
  .error {
    color: #c00;
    font-size: var(--txt--1);
    margin: 0;
  }
</style>
