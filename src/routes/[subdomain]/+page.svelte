<script>
  const { data } = $props()
  const prop = (key) => data.profile[key] ? data.profile[key] : null
  console.log(data.profile)

  const urlifyMastodon = (handle) => {
    const arr = handle.split('@')
    return `https://${arr[2]}/@${arr[1]}`
  }

  const urlifyBluesky = (handle) => {
    return `https://bsky.app/profile/${handle.replace('@', '')}`
  }

</script>

<svelte:head>
  <title>{prop('displayName')} @ url.coop</title>
  <meta name="description" content={prop('introduction')}>
</svelte:head>

<div class="bg">
  <div class="card">
    <figure>
      <img
        alt="Profile Image for {prop('displayName')}"
        src="https://stucco.software/favicon.png">
    </figure>

    <header>
      <h1>{prop('displayName')}</h1>
      {#if prop('introduction')}
        <p class="intro">{prop('introduction')}</p>
      {/if}
    </header>

    {#each data.profile.links as link}
      <section>
        <h2>{link.label}</h2>
        {#if link.mbox}
          <a href="mailto:{link.mbox}">{link.mbox}</a>
        {/if}
        {#if link.href}
          <a href="{link.href}">{link.href}</a>
        {/if}
        {#if link.handle}
          {#if link.linkType === 'Mastodon'}
            <a href="{urlifyMastodon(link.handle)}">{link.handle}</a>
          {/if}
          {#if link.linkType === 'Bluesky'}
            <a href="{urlifyBluesky(link.handle)}">{link.handle}</a>
          {/if}
        {/if}
      </section>


    {/each}

    <section>
      <h2>User Defined Type</h2>
      <a href="#">Whatever We Want This To Be</a>
    </section>

    <footer>
      <a href="https://url.coop">url.coop</a>
    </footer>
  </div>

</div>

<style>
  .bg {
    position: fixed;
    display: grid;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: var(--dark-gray);
    padding: var(--lead-1)
  }

  .card {
    border: 1px solid var(--txt-color);
    background-color: var(--white);
    max-width: 32rem;
    margin: auto;
    padding: var(--lead-2);
    border-radius: var(--lead-quarter);
    box-shadow: rgba(0, 0, 0, 0.56) 0px 22px 70px 4px;
  }

  header {
    margin-bottom: var(--lead-2);
  }

  figure {
    max-width: 4rem;
    margin: auto;
    border: 1px solid black;
    border-radius: 100%;
    overflow: clip;
  }
  h1 {
    font-family: var(--sans-stack);
    text-align: center;
    font-size: var(--txt-1);
  }
  h2 {
    font-family: var(--sans-stack);
    font-size: var(--txt-0);
    margin: var(--lead-1) 0 0 0;

  }
  .intro {
    font-family: var(--sans-stack);
    text-align: center;
    text-wrap: balance;
    font-size: var(--txt-0);
    line-height: 1.3;
  }

  footer {
    margin-top: var(--lead-4);
    text-align: center;
    font-size: var(--txt--1);
  }
</style>