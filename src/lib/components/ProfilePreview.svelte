<div class="preview">
  <iframe src="/{profile}" title="Example profile: {profile}"></iframe>
</div>

<script>
  let { profile } = $props()
</script>

<style>
  .preview {
    aspect-ratio: 2 / 4;
    max-height: 36rem;
    border-radius: var(--lead-quarter);
    overflow: hidden;
    box-shadow: rgba(0, 0, 0, 0.15) 0px 10px 40px;
    justify-self: center;
    width: 100%;
    max-width: 24rem;
  }

  .preview iframe {
    width: 100%;
    height: 100%;
    border: none;
  }

  @media (max-width: 48rem) {
    .preview {
      max-height: 28rem;
      max-width: 20rem;
    }
  }
</style>
