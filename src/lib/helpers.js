export const toClipboard = async (clip) => {
  try {
    await navigator.clipboard.writeText(clip)
    return true
  } catch (e) {
    return false
  }
}

export const pause = ms => new Promise((r) => setTimeout(r, ms))

export const arrayify = target => Array.isArray(target) ? target : target == null ? [] : [target]
