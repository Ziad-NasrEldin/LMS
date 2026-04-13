const pendingRequests = new Map()

export function deduplicateRequest(key, fetcher) {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)
  }

  const promise = fetcher().finally(() => {
    pendingRequests.delete(key)
  })

  pendingRequests.set(key, promise)
  return promise
}

export function requestCacheKey(...args) {
  return args.map(arg => JSON.stringify(arg)).join('::')
}