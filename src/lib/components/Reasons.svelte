<div class="band">
  <div class="band-inner">
    <SectionLabel>Why url.coop</SectionLabel>
    <div class="reasons-grid">
      {#each reasons as reason}
        <div class="reason">
          <strong>{reason.title}</strong>
          <p>{reason.body}</p>
        </div>
      {/each}
    </div>
  </div>
</div>

<script>
  import SectionLabel from './SectionLabel.svelte'

  const reasons = [
    {
      title: 'Your data, your rules',
      body: 'Your profile lives on Stucco ID, a community-run identity provider. No ads. No tracking. No platform lock-in. You can move your data whenever you want.'
    },
    {
      title: 'Built on open standards',
      body: 'url.coop uses Solid and linked data under the hood. Your identity is portable — it works across any service that speaks the same protocols.'
    },
    {
      title: 'Just your links',
      body: 'One page. No algorithmic feed, no engagement tricks, no noise. A clean page with your name and your links.'
    }
  ]
</script>

<style>
  .band {
    padding: var(--lead-4) var(--lead-2);
  }

  .band-inner {
    max-width: var(--grid-max-width);
    margin: 0 auto;
  }

  .reasons-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
    gap: var(--lead-2);
  }

  .reason strong {
    display: block;
    font-family: var(--sans-stack);
    font-size: var(--txt-1);
    font-weight: 500;
    letter-spacing: -0.01em;
    margin-bottom: var(--lead-quarter);
  }

  .reason p {
    font-family: var(--sans-stack);
    font-weight: 300;
    font-size: var(--txt-0);
    line-height: 1.6;
  }
</style>
