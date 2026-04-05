const mongoose = require("mongoose");
const fetch = require("node-fetch");
const durationCache = require("../services/durationCache");

// Helper function to extract YouTube video ID
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

// Helper function to parse ISO 8601 duration to minutes
const parseDuration = (duration) => {
  if (!duration) return 0;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  return hours * 60 + minutes + (seconds > 30 ? 1 : 0);
};

// Async function to calculate total duration from YouTube API
const calculateTotalDuration = async (containerIds, youtubeApiKey) => {
  if (!containerIds || containerIds.length === 0 || !youtubeApiKey) return 0;
  
  try {
    // Fetch all containers/lectures to get video links
    const Container = mongoose.model("Container");
    const Lecture = mongoose.model("Lecture");
    
    const containers = await Container.find({ _id: { $in: containerIds } });
    const containerIdsSet = new Set(containers.map(c => c._id.toString()));
    
    // Find lecture IDs (not in containers collection)
    const lectureIds = containerIds.filter(id => !containerIdsSet.has(id.toString()));
    const lectures = lectureIds.length > 0 
      ? await Lecture.find({ _id: { $in: lectureIds } })
      : [];
    
    // Combine all items
    const allItems = [...containers, ...lectures];
    
    // Recursively get all child lecture IDs
    const getAllLectureIds = async (items) => {
      let lectureIds = [];
      let containerIdsToProcess = [];
      
      for (const item of items) {
        if (item.type === 'lecture' && item.videoLink) {
          lectureIds.push(item);
        } else if (item.children && item.children.length > 0) {
          containerIdsToProcess.push(...item.children);
        }
      }
      
      // Process nested containers
      if (containerIdsToProcess.length > 0) {
        const nestedContainers = await Container.find({ 
          _id: { $in: containerIdsToProcess } 
        });
        const nestedLectures = await Lecture.find({ 
          _id: { $in: containerIdsToProcess } 
        });
        
        const nestedLectureIds = await getAllLectureIds([...nestedContainers, ...nestedLectures]);
        lectureIds.push(...nestedLectureIds);
      }
      
      return lectureIds;
    };
    
    const allLectures = await getAllLectureIds(allItems);
    
    // Extract video IDs
    const videoIds = allLectures
      .map(lecture => extractYouTubeId(lecture.videoLink))
      .filter(Boolean);
    
    if (videoIds.length === 0) return 0;
    
    // Batch fetch from YouTube API
    const batchSize = 50;
    let totalMinutes = 0;
    
    for (let i = 0; i < videoIds.length; i += batchSize) {
      const batch = videoIds.slice(i, i + batchSize);
      const idsString = batch.join(',');
      
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${idsString}&key=${youtubeApiKey}`
      );
      
      if (!response.ok) {
        console.error('YouTube API error:', response.status);
        continue;
      }
      
      const data = await response.json();
      
      if (data.items) {
        data.items.forEach(item => {
          const duration = item.contentDetails?.duration;
          const minutes = parseDuration(duration);
          totalMinutes += minutes;
        });
      }
    }
    
    return totalMinutes;
  } catch (error) {
    console.error('Error calculating total duration:', error);
    return 0;
  }
};

const containerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["year", "term", "month", "lecture", "course"],
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: false,
    },
    level: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Level",
      required: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecturer",
      required: true,
    },
    teacherAllowed: {
      type: Boolean,
      required: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Container",
      default: null,
    },
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: "Container" }],
    price: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true, index: true },
    description: { type: String },
    goal: [{ type: String }],
    image: {
      url: { type: String },
      publicId: { type: String }
    },
    // Pre-calculated total duration in minutes
    totalDuration: { type: Number, default: 0, min: 0 },
    // Last time duration was calculated
    durationCalculatedAt: { type: Date, default: null },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    discriminatorKey: "kind",
    timestamps: true,
  }
);

// Create virtual to get image from parent if not available
containerSchema.virtual('containerImage').get(function() {
  // If container has its own image, return it
  if (this.image && this.image.url) {
    return this.image;
  }
  // Otherwise, it will inherit from parent (handled in the controller)
  return null;
});

containerSchema.index({ parent: 1 });
containerSchema.index({ createdBy: 1 });
containerSchema.index({ createdBy: 1, type: 1, createdAt: -1 });
containerSchema.index({ totalDuration: 1 });

// Pre-save hook to calculate total duration when children change
containerSchema.pre('save', async function(next) {
  // Only calculate for containers with children (not individual lectures)
  if (this.children && this.children.length > 0) {
    // Check if children array was modified
    if (this.isModified('children')) {
      const youtubeApiKey = process.env.YOUTUBE_API_KEY;
      if (youtubeApiKey) {
        this.totalDuration = await calculateTotalDuration(this.children, youtubeApiKey);
        this.durationCalculatedAt = new Date();
      }
    }
  }
  next();
});

// Instance method to manually recalculate duration (with Redis caching)
containerSchema.methods.recalculateDuration = async function() {
  const containerId = this._id.toString();
  
  // Try to get from Redis cache first
  await durationCache.connect();
  const cachedDuration = await durationCache.getDuration(containerId);
  if (cachedDuration !== null && cachedDuration > 0) {
    this.totalDuration = cachedDuration;
    this.durationCalculatedAt = new Date();
    await this.save({ validateBeforeSave: false });
    return this.totalDuration;
  }
  
  const youtubeApiKey = process.env.YOUTUBE_API_KEY;
  if (!youtubeApiKey) {
    console.error('YOUTUBE_API_KEY not set in environment');
    return this.totalDuration;
  }
  
  this.totalDuration = await calculateTotalDuration(this.children, youtubeApiKey);
  this.durationCalculatedAt = new Date();
  await this.save({ validateBeforeSave: false });
  
  // Cache the result in Redis
  await durationCache.setDuration(containerId, this.totalDuration);
  
  return this.totalDuration;
};

// Static method to recalculate all courses
containerSchema.statics.recalculateAllDurations = async function() {
  const youtubeApiKey = process.env.YOUTUBE_API_KEY;
  if (!youtubeApiKey) {
    throw new Error('YOUTUBE_API_KEY not set in environment');
  }
  
  const containers = await this.find({ children: { $exists: true, $not: { $size: 0 } } });
  let updated = 0;
  
  for (const container of containers) {
    await container.recalculateDuration();
    updated++;
  }
  
  return updated;
};

module.exports = mongoose.model("Container", containerSchema);
