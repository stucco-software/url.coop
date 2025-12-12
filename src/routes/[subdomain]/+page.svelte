<script>
  const { data } = $props()
  const prop = (key) => data.profile[`https://solidid.stucco.software/vocabulary#${key}`][0]['@value']
</script>

<div class="bg">
  <div class="card">
    <figure>
      <img src="https://stucco.software/favicon.png">
    </figure>
    <h1>{prop('displayName')}</h1>
    <p class="intro">{prop('introduction')}</p>
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
  .intro {
    font-family: var(--sans-stack);
    text-align: center;
    text-wrap: balance;
    font-size: var(--txt-0);
    line-height: 1.3;
  }
</style>