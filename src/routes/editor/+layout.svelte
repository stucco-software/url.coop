<script>
  import { clientSession } from "$lib/session.svelte.js"
  let { children } = $props();
</script>

{#if clientSession.data?.info?.isLoggedIn}
  <div class="wrap">
    <main>
      {@render children()}
    </main>
  </div>
{:else}
  <div class="wrap">
    <h1>Not signed in — <a href="/auth">sign in</a> to edit your page</h1>
  </div>
{/if}

<style>
  .wrap {
    max-width: var(--grid-max-width);
    margin: 0 auto;
    padding: var(--lead-2) var(--lead-1);
  }
</style>
