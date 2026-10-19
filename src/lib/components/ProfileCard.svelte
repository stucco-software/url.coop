<script>
  let { profile, qr } = $props()
  const prop = (key) => profile[key] ? profile[key] : null

  const imageUrl = $derived(
    profile?.image
    || 'https://stucco.software/favicon.png'
  )

  const urlifyMastodon = (handle) => {
    const arr = handle.split('@')
    return `https://${arr[2]}/@${arr[1]}`
  }

  const urlifyBluesky = (handle) => {
    return `https://bsky.app/profile/${handle.replace('@', '')}`
  }

  const webidHost = $derived.by(() => {
    try { return new URL(profile.webId).host } catch { return profile.webId }
  })
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
        src={imageUrl}>
    </figure>

    <header>
      <h1>{#if prop('introduction')}{prop('introduction')} {/if} {prop('displayName')}</h1>
    </header>

    {#each profile.links as link}
      <section>
        <h2>
          {#if link.mbox}
            <a href="mailto:{link.mbox}">{link.label}</a>
          {/if}
          {#if link.href}
            <a href={link.href}>{link.label}</a>
          {/if}
          {#if link.handle}
            {#if link.linkType === 'Mastodon'}
              <a href={urlifyMastodon(link.handle)}>{link.handle}</a>
            {/if}
            {#if link.linkType === 'Bluesky'}
              <a href={urlifyBluesky(link.handle)}>{link.handle}</a>
            {/if}
          {/if}
        </h2>
      </section>
    {/each}

    <footer>
      <img src={qr} alt="QR code linking to this page">
      <br>
      <a href="https://url.coop">url.coop</a>
    </footer>
  </div>

  <a class="webid" href={profile.webId}>{webidHost}</a>

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
    max-width: 22rem;
    margin: auto;
    padding: var(--lead-2);
    border-radius: var(--lead-quarter);
    box-shadow: rgba(0, 0, 0, 0.56) 0px 22px 70px 4px;
  }

  header {
    margin-bottom: var(--lead-2);
  }

  figure {
    width: 7rem;
    aspect-ratio: 1;
    margin: auto;
    border: 1px solid black;
    border-radius: 100%;
    overflow: clip;
  }

  figure img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
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

  h1 {
    font-family: var(--sans-stack);
    text-align: center;
    font-size: var(--txt-1);
  }

  .webid {
    position: absolute;
    bottom: var(--lead-1);
    left: 0;
    right: 0;
    text-align: center;
    font-family: var(--mono-stack, monospace);
    font-size: var(--txt--1);
    color: var(--white);
    opacity: 0.7;
  }
  .webid:hover {
      background: none;
      border: none;
      outline: none;
  }

  a {
    word-break: break-all;
  }

  footer {
    margin-top: var(--lead-4);
    text-align: center;
    font-size: var(--txt--1);
  }

  footer img {
    margin: auto;
    width: 5rem;
  }
</style>
