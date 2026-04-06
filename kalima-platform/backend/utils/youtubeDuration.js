/**
 * YouTube Duration Utility
 * Fetches video duration from YouTube API
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Helper to extract YouTube video ID
const extractYouTubeId = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// Parse ISO 8601 duration to minutes
const parseDuration = (duration) => {
  if (!duration) return 0;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  return hours * 60 + minutes + (seconds > 30 ? 1 : 0);
};

/**
 * Fetch duration for a single YouTube video
 * @param {string} videoUrl - YouTube video URL
 * @returns {Promise<number>} - Duration in minutes
 */
const fetchYouTubeDuration = async (videoUrl) => {
  const videoId = extractYouTubeId(videoUrl);
  if (!videoId) return 0;

  const youtubeApiKey = process.env.YOUTUBE_API_KEY;
  if (!youtubeApiKey) {
    console.error("YOUTUBE_API_KEY not set in environment");
    return 0;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${youtubeApiKey}`
    );

    if (!response.ok) {
      console.error("YouTube API error:", response.status);
      return 0;
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const duration = data.items[0].contentDetails?.duration;
      return parseDuration(duration);
    }

    return 0;
  } catch (error) {
    console.error("Error fetching YouTube duration:", error);
    return 0;
  }
};

module.exports = {
  extractYouTubeId,
  parseDuration,
  fetchYouTubeDuration,
};
