import { error } from '@sveltejs/kit'
import jsonld from 'jsonld'
import { Parser, Writer } from 'n3'

const STUCCO = 'https://solidid.stucco.software/vocabulary#'
const FOAF = 'http://xmlns.com/foaf/0.1/'
const VCARD = 'http://www.w3.org/2006/vcard/ns#'
const SCHEMA = 'https://schema.org/'
const RDFS = 'http://www.w3.org/2000/01/rdf-schema#'

const FETCH_TIMEOUT_MS = 8000
const CACHE_TTL_MS = 60000
const cache = new Map()

const arrayify = (value) => Array.isArray(value) ? value : value == null ? [] : [value]

const hasPredicates = (expanded) => arrayify(expanded).some(node =>
  Object.keys(node).some(key => !key.startsWith('@'))
)

const expandTurtle = async (text, baseIRI) => {
  const quads = new Parser({ baseIRI }).parse(text)
  const writer = new Writer({ format: 'application/n-quads' })
  writer.addQuads(quads)
  const nquads = await new Promise((resolve, reject) => {
    writer.end((err, out) => err ? reject(err) : resolve(out))
  })
  return jsonld.fromRDF(nquads, { format: 'application/n-quads' })
}

const expandJson = async (data) => {
  try {
    const expanded = await jsonld.expand(data)
    if (hasPredicates(expanded)) return expanded
  } catch {
    // fall through to the vocabulary fallback below
  }
  // pods that serve plain JSON with vocabulary-local keys need a @vocab to expand
  return jsonld.expand({
    '@context': { '@vocab': STUCCO },
    '@graph': data
  })
}

const valueOf = (node, predicates) => {
  for (const predicate of predicates) {
    for (const term of arrayify(node[predicate])) {
      if (term['@value'] !== undefined) return term['@value']
      if (term['@id']) return term['@id']
    }
  }
  return null
}

// a term may be an embedded node object or a reference to a node elsewhere in the document
const resolveNode = (term, nodes) => {
  if (Object.keys(term).length > 1) return term
  return nodes.get(term['@id']) ?? term
}

const hostOf = (url) => {
  try { return new URL(url).host } catch { return url }
}

const serviceTypeOf = (service) => {
  const host = hostOf(service).toLowerCase()
  if (host.includes('mastodon')) return 'Mastodon'
  if (host.includes('bsky') || host.includes('bluesky')) return 'Bluesky'
  return 'Custom'
}

const linksOf = (me, nodes) => {
  const links = []

  // structured links (stucco vocabulary)
  for (const term of arrayify(me[STUCCO + 'links'])) {
    const link = resolveNode(term, nodes)
    links.push({
      label: valueOf(link, [STUCCO + 'label', RDFS + 'label', SCHEMA + 'name']),
      href: valueOf(link, [STUCCO + 'href', SCHEMA + 'url']),
      handle: valueOf(link, [STUCCO + 'handle', FOAF + 'accountName']),
      linkType: valueOf(link, [STUCCO + 'linkType']),
      mbox: valueOf(link, [STUCCO + 'mbox'])
    })
  }

  // plain web urls
  for (const predicate of [VCARD + 'hasURL', FOAF + 'homepage', SCHEMA + 'sameAs', SCHEMA + 'url']) {
    for (const term of arrayify(me[predicate])) {
      const href = term['@id'] || term['@value']
      if (typeof href === 'string') {
        links.push({ label: hostOf(href), href, handle: null, linkType: 'Website', mbox: null })
      }
    }
  }

  // social accounts
  for (const predicate of [FOAF + 'holdsAccount', FOAF + 'account']) {
    for (const term of arrayify(me[predicate])) {
      const account = resolveNode(term, nodes)
      const handle = valueOf(account, [FOAF + 'accountName', SCHEMA + 'name'])
      if (!handle) continue
      const service = valueOf(account, [FOAF + 'accountServiceHomepage'])
      const linkType = serviceTypeOf(service)
      // for services we don't special-case, link to the profile page on the service
      const href = (service && linkType === 'Custom')
        ? service.replace(/\/+$/, '') + '/' + handle.replace(/^@/, '')
        : null
      links.push({ label: handle, href, handle, linkType, mbox: null })
    }
  }

  // email addresses
  for (const predicate of [FOAF + 'mbox', VCARD + 'hasEmail']) {
    for (const term of arrayify(me[predicate])) {
      const mbox = term['@id'] || term['@value']
      if (typeof mbox !== 'string') continue
      const address = mbox.replace(/^mailto:/, '')
      links.push({ label: address, href: null, handle: null, linkType: 'Email', mbox: address })
    }
  }

  const seen = new Set()
  return links.filter(link => {
    const key = link.href || link.handle || link.mbox
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const predicateCount = (node) =>
  Object.keys(node).filter(key => !key.startsWith('@')).length

const isPerson = (node) => {
  const types = arrayify(node['@type']).map(type => type['@id'] || type)
  return types.includes(FOAF + 'Person')
    || types.includes(SCHEMA + 'Person')
    || types.includes(VCARD + 'Individual')
}

const normalize = (expanded, webid) => {
  const nodes = new Map()
  for (const node of arrayify(expanded)) {
    if (node['@id']) nodes.set(node['@id'], node)
  }

  // WebID fragments vary across pods (#me, #i, #this...); if the exact
  // subject isn't present, fall back to the main subject of the document
  let me = nodes.get(webid)
  if (!me) {
    const document = webid.split('#')[0]
    const candidates = arrayify(expanded).filter(node =>
      typeof node['@id'] === 'string'
      && (node['@id'] === document || node['@id'].startsWith(document + '#'))
    )
    me = candidates.find(isPerson)
      ?? candidates.sort((a, b) => predicateCount(b) - predicateCount(a))[0]
  }
  if (!me) throw error(404, 'No profile data for this WebID')

  return {
    webId: me['@id'] || webid,
    displayName: valueOf(me, [FOAF + 'name', VCARD + 'fn', SCHEMA + 'name', STUCCO + 'displayName']),
    introduction: valueOf(me, [VCARD + 'note', SCHEMA + 'description', VCARD + 'title', FOAF + 'title', STUCCO + 'introduction']),
    image: valueOf(me, [FOAF + 'img', VCARD + 'hasPhoto', SCHEMA + 'image', FOAF + 'depiction', STUCCO + 'image']),
    links: linksOf(me, nodes)
  }
}

const readProfileUncached = async (webid, f) => {
  // the WebID names a subject; the document it lives in is the fragmentless IRI
  const document = webid.split('#')[0]

  let res
  try {
    res = await f(document, {
      headers: {
        accept: 'application/ld+json; q=1.0, text/turtle; q=0.9, application/n-quads; q=0.4'
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
    })
  } catch {
    throw error(502, 'Profile pod unreachable')
  }

  if (res.status === 404) throw error(404, 'Profile not found')
  if (!res.ok) throw error(502, `Profile pod returned ${res.status}`)

  try {
    const contentType = res.headers.get('content-type') || ''
    const expanded = contentType.includes('json')
      ? await expandJson(await res.json())
      : await expandTurtle(await res.text(), document)
    return normalize(expanded, webid)
  } catch (e) {
    if (e?.status) throw e
    throw error(502, 'Could not read profile document')
  }
}

export const readProfile = ({ webid, f = fetch }) => {
  const hit = cache.get(webid)
  if (hit && hit.expires > Date.now()) return hit.promise

  const promise = readProfileUncached(webid, f).catch(err => {
    cache.delete(webid)
    throw err
  })
  cache.set(webid, { promise, expires: Date.now() + CACHE_TTL_MS })
  return promise
}

// Uncached read in the public page's shape, so the editor can preview edits
// that the 60s cache would otherwise hide.
export const readProfileFresh = ({ webid, f = fetch }) => readProfileUncached(webid, f)

// Authenticated read for the editor: preserves the raw stucco-vocabulary
// shape (links as nodes with their own @ids) so existing values can be edited.
export const fetchProfileCard = async ({ webid, f }) => {
  let res = await f(webid, {
    headers: {
      accept: "application/json"
    }
  })
  let data = await res.json()
  let profile = await jsonld.frame({
    '@context': {
      "@vocab": STUCCO
    },
    '@graph': data
  }, {
    '@id': webid,
    '@embed': true,
    "@explicit": false
  })
  let compress = await jsonld.compact(profile, {
    "@vocab": STUCCO
  })
  return compress
}
