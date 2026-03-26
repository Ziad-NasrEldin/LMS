const net = require("net")

const PRIVATE_IPV4_RANGES = [
  { start: [10, 0, 0, 0], end: [10, 255, 255, 255] },
  { start: [127, 0, 0, 0], end: [127, 255, 255, 255] },
  { start: [169, 254, 0, 0], end: [169, 254, 255, 255] },
  { start: [172, 16, 0, 0], end: [172, 31, 255, 255] },
  { start: [192, 168, 0, 0], end: [192, 168, 255, 255] },
]

const ipv4ToTuple = (ip) => ip.split(".").map((part) => Number(part))

const ipv4ToNumber = (ipTuple) =>
  ipTuple.reduce((result, value) => (result * 256) + value, 0)

const isIpv4InRange = (ipTuple, rangeStart, rangeEnd) => {
  const ipValue = ipv4ToNumber(ipTuple)
  const startValue = ipv4ToNumber(rangeStart)
  const endValue = ipv4ToNumber(rangeEnd)
  return ipValue >= startValue && ipValue <= endValue
}

const isPrivateHost = (hostname) => {
  if (!hostname) return true

  const normalizedHost = hostname.toLowerCase()

  if (normalizedHost === "localhost" || normalizedHost.endsWith(".local")) {
    return true
  }

  const ipKind = net.isIP(normalizedHost)

  if (ipKind === 4) {
    const tuple = ipv4ToTuple(normalizedHost)
    return PRIVATE_IPV4_RANGES.some((range) =>
      isIpv4InRange(tuple, range.start, range.end),
    )
  }

  if (ipKind === 6) {
    // Block loopback/link-local/unique-local IPv6 addresses
    return normalizedHost === "::1" || normalizedHost.startsWith("fc") || normalizedHost.startsWith("fd") || normalizedHost.startsWith("fe80")
  }

  return false
}

const normalizeExternalUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== "string") {
    return null
  }

  try {
    const url = new URL(rawUrl.trim())

    if (!["http:", "https:"].includes(url.protocol)) {
      return null
    }

    if (isPrivateHost(url.hostname)) {
      return null
    }

    return url.toString()
  } catch (_error) {
    return null
  }
}

module.exports = {
  normalizeExternalUrl,
}
