import rdfkv from 'rdf-kv.js'
import { clientSession } from "$lib/session.svelte.js"

export const update = async ({ subject, formData }) => {
  const update = rdfkv(subject, formData)
  let response = await clientSession.data.fetch(subject, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/sparql-update"
    },
    body: `
      PREFIX sid: <https://solidid.stucco.software/vocabulary#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      delete { ${update.delete} }
      insert { ${update.insert} }
      where { ?s ?p ?o}
    `
  })
  return response
}
