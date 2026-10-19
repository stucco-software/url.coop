<script>
  import ProfileCard from '$lib/components/ProfileCard.svelte'
  const { data } = $props()
</script>

<ProfileCard profile={data.profile} qr={data.qr} />
