<script>
  import Hero from '$lib/components/Hero.svelte'
  import Steps from '$lib/components/Steps.svelte'
  import Reasons from '$lib/components/Reasons.svelte'
  import Closing from '$lib/components/Closing.svelte'
  import SiteFooter from '$lib/components/SiteFooter.svelte'
</script>

<svelte:head>
  <title>url.coop — Links for everyone</title>
  <meta name="description" content="A personal link page you actually own. Built on open, decentralized identity.">
</svelte:head>

<Hero />
<Steps />
<Reasons />
<Closing />
<SiteFooter />
