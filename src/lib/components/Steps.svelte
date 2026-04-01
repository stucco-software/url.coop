<script>
  import SectionLabel from './SectionLabel.svelte'

  const steps = [
    {
      title: 'Sign up',
      body: 'Create a free account with Stucco ID. It takes a minute.'
    },
    {
      title: 'Add your links',
      body: 'Your name, a short bio, and links to wherever you are online.'
    },
    {
      title: 'Share your URL',
      body: 'Get your onw page. Put it in your bio, send it in a message, print it on a card.'
    }
  ]
</script>


<div class="band">
  <div class="band-inner">
    <SectionLabel>How it works</SectionLabel>
    <div class="steps-grid">
      {#each steps as step}
        <div class="step">
          <strong>{step.title}</strong>
          <p>{step.body}</p>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .band {
    background-color: var(--white);
    padding: var(--lead-4) var(--lead-2);
  }

  .band-inner {
    max-width: var(--grid-max-width);
    margin: 0 auto;
  }

  .steps-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
    gap: var(--lead-2);
  }

  .step strong {
    display: block;
    font-family: var(--sans-stack);
    font-size: var(--txt-1);
    font-weight: 500;
    letter-spacing: -0.01em;
    margin-bottom: var(--lead-quarter);
  }

  .step p {
    font-family: var(--sans-stack);
    font-weight: 300;
    font-size: var(--txt-0);
    line-height: 1.6;
  }
</style>
