export const getYouTubeId = (url) => {
  if (!url) return null

  let videoId = null

  try {
    const parsedUrl = new URL(url)

    if (parsedUrl.hostname === "youtu.be") {
      videoId = parsedUrl.pathname.slice(1)
    } else if (parsedUrl.hostname.includes("youtube.com")) {
      videoId = parsedUrl.searchParams.get("v")
    } else if (parsedUrl.pathname.includes("/embed/")) {
      videoId = parsedUrl.pathname.split("/").pop()
    }
  } catch (_error) {
  }

  if (!videoId) {
    const patterns = [
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        videoId = match[1]
        break
      }
    }
  }

  return videoId
}

export const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return "00:00:00"

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

export const normalizeUrl = (value) => {
  if (typeof value !== "string") return null

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export const findFirstAttachmentLinkUrl = (items) => {
  if (!Array.isArray(items)) return null

  for (const item of items) {
    if (!item) continue

    if (typeof item === "string") {
      const normalized = normalizeUrl(item)
      if (normalized) return normalized
      continue
    }

    if (item.fileType === "link") {
      const normalized = normalizeUrl(item.filePath || item.fileName)
      if (normalized) return normalized
      continue
    }

    const fallback = normalizeUrl(item.filePath)
    if (fallback) return fallback
  }

  return null
}

export const pickFirstUrl = (...values) => {
  for (const value of values) {
    const normalized = normalizeUrl(value)
    if (normalized) return normalized
  }

  return null
}
