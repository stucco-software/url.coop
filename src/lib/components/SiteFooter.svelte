<footer>
  <SectionLabel>url.coop</SectionLabel>
  A project by <a href="https://stucco.software">Stucco Software</a>.
</footer>

<script>
  import SectionLabel from './SectionLabel.svelte'
</script>

<style>
  footer {
    text-align: center;
    padding: var(--lead-2);
    font-family: var(--sans-stack);
    font-size: var(--txt--2);
    font-weight: 300;
    color: var(--dark-gray);
  }

  footer a {
    color: var(--dark-gray);
  }
</style>
