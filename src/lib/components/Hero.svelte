<script>
  import SectionLabel from './SectionLabel.svelte'
  import ProfilePreview from './ProfilePreview.svelte'
</script>

<div class="hero">
  <div class="hero-copy">
    <SectionLabel>url.coop</SectionLabel>
    <h1>
        Links for
        <b>everyone.</b>
    </h1>
    <p class="description">
        A personal link page you actually own. Built on open, decentralized identity.
    </p>
    <a class="cta" href="https://id.stucco.software/account/create">Claim your page</a>
  </div>
  <div class="hero-iframe">
    <ProfilePreview profile="yves" />
  </div>
</div>

<style>
  .hero {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--lead-4);
    align-items: center;
    max-width: var(--grid-max-width);
    margin: 0 auto;
    padding: var(--lead-4) var(--lead-2);
  }

  .hero-iframe {
      display: flex;
      justify-content: center;
  }

  .hero-copy h1 {
    font-family: var(--sans-stack);
    font-size: var(--txt-4);
    font-weight: 300;
    margin: 0;
    letter-spacing: -0.02em;
    line-height: 0.77;
  }

  .hero-copy .description {
    font-family: var(--sans-stack);
    font-size: var(--txt-0);
    font-weight: 300;
    max-width: 26rem;
    margin-top: var(--lead-2);
    line-height: 1.6;
  }

  .cta {
    display: inline-block;
    margin-top: var(--lead-2);
    padding: var(--lead-half) var(--lead-1-half);
    background-color: var(--black);
    color: var(--white);
    font-family: var(--sans-stack);
    font-size: var(--txt--1);
    font-weight: 500;
    text-decoration: none;
    border-radius: var(--lead-quarter);
  }
  .cta:visited { color: var(--white); }
  .cta:hover,
  .cta:focus {
    background-color: var(--blue);
    color: var(--white);
    outline: none;
  }

  @media (max-width: 48rem) {
    .hero {
      grid-template-columns: 1fr;
      min-height: auto;
      padding-top: var(--lead-4);
    }
  }
</style>
