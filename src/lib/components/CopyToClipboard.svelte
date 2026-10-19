<script>
  import { toClipboard, pause } from "$lib/helpers.js"

  let success = $state()

  const {
    value,
    label
  } = $props()

  const copy = async (e) => {
    e.preventDefault()
    await toClipboard(value)
    success = await toClipboard(value)
    await pause(2000)
    success = null
  }

</script>

<button
  onclick={copy}>
  {#if success === true}
    ✅
  {:else if success === false}
    ❌
  {:else}
    {label}
  {/if}
</button>

