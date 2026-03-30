<p class="label">{@render children()}</p>

<script>
  let { children } = $props()
</script>

<style>
  .label {
    font-family: var(--mono-stack);
    font-size: var(--txt--1);
    letter-spacing: 0.12em;
    color: var(--txt-color);
    margin-bottom: var(--lead-1);
  }
</style>
