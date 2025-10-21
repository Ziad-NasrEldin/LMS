"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  getLectureById,
  getLectureAttachments,
  downloadAttachmentById,
  createLectureAttachment,
} from "../../../routes/lectures"
import { verifyExamSubmission, checkLectureAccess } from "../../../routes/examsAndHomeworks"
import { uploadHomework, getLectureHomeworks } from "../../../routes/homeworks"
import { getUserDashboard } from "../../../routes/auth-services"
import { checkStudentLectureAccess, updateStudentLectureAccess } from "../../../routes/student-lecture-access"
import {
  FiUpload,
  FiFile,
  FiX,
  FiCheck,
  FiEye,
  FiLink,
  FiAlertTriangle,
  FiExternalLink,
  FiAward,
  FiClock,
  FiPlay,
  FiPause,
  FiVolume2,
  FiVolumeX,
  FiMaximize,
  FiMinimize,
} from "react-icons/fi"

// Vidstack imports
import { MediaPlayer, MediaProvider, Poster } from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

// Helper function to extract YouTube Video ID
const getYouTubeId = (url) => {
  if (!url) return null;
  let videoId = null;
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname === "youtu.be") {
      // Handles youtu.be short links
      videoId = parsedUrl.pathname.slice(1);
    } else if (parsedUrl.hostname.includes("youtube.com")) {
      // Handles youtube.com links
      videoId = parsedUrl.searchParams.get("v");
    } else if (parsedUrl.pathname.includes("/embed/")) {
      // Handles youtube.com/embed links
      videoId = parsedUrl.pathname.split("/").pop();
    }
  } catch (e) {
    console.warn(
      "Could not parse YouTube URL with standard new URL(), trying regex:",
      e
    );
  }

  if (!videoId) {
    // Fallback regex for various URL formats
    const patterns = [
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        videoId = match[1];
        break;
      }
    }
  }
  return videoId;
};

// Helper function to format time in HH:MM:SS format
const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return "00:00:00"

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

const LectureDisplay = () => {
  const { t, i18n } = useTranslation("lectureDisplay");
  const isRTL = i18n.language === "ar";

  const { lectureId } = useParams();
  const navigate = useNavigate();
  const [lecture, setLecture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attachments, setAttachments] = useState({
    exams: [],
    booklets: [],
    homeworks: [],
    pdfsandimages: [],
  });
  const [allAttachments, setAllAttachments] = useState([]);
  const [showFiftyPercentWarning, setShowFiftyPercentWarning] = useState(false);
  const [remainingViews, setRemainingViews] = useState(null);
  const [studentLectureAccessId, setStudentLectureAccessId] = useState(null);
  const [videoBlocked, setVideoBlocked] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [purchaseId, setPurchaseId] = useState(null);
  const [currentPurchase, setCurrentPurchase] = useState(null);

  // Add this state to track if we should show the exit confirmation
  const [showExitConfirmation, setShowExitConfirmation] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState(null)

  // Add this function to handle navigation attempts
  const handleNavigateAway = (to) => {
    if (userRole === "Student" && progress < 50 && !showFiftyPercentWarning) {
      // If they haven't watched 50% of the video, show the confirmation dialog
      setShowExitConfirmation(true)
      setPendingNavigation(to)
      return false
    }
    return true
  }

  // Add these functions to handle confirmation dialog responses
  const handleConfirmNavigation = () => {
    setShowExitConfirmation(false)
    if (pendingNavigation) {
      navigate(pendingNavigation)
    }
  }

  const handleCancelNavigation = () => {
    setShowExitConfirmation(false)
    setPendingNavigation(null)
    setHasAttemptedToLeave(true)
  }

  // Video player state
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [progress, setProgress] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(100)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [videoQuality, setVideoQuality] = useState("auto")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [hasAttemptedToLeave, setHasAttemptedToLeave] = useState(false)

  // Exam verification states
  const [examVerified, setExamVerified] = useState(false);
  const [examVerificationLoading, setExamVerificationLoading] = useState(false);
  const [examRequired, setExamRequired] = useState(false);
  const [examData, setExamData] = useState(null);
  const [examUrl, setExamUrl] = useState("");
  const [examSubmission, setExamSubmission] = useState(null);

  // Attachment tabs and uploads
  const [activeTab, setActiveTab] = useState("pdfsandimages");
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Homework state
  const [homeworkFiles, setHomeworkFiles] = useState([])
  const [isSubmittingHomework, setIsSubmittingHomework] = useState(false)
  const [homeworkSuccess, setHomeworkSuccess] = useState(false)
  const [homeworkSubmitType, setHomeworkSubmitType] = useState("file") // "file" or "form"
  const [homeworkError, setHomeworkError] = useState(null)
  const [homeworks, setHomeworks] = useState([])
  const homeworkFileInputRef = useRef(null)
  const [accessDataLoaded, setAccessDataLoaded] = useState(false)
  const [homeworkRequired, setHomeworkRequired] = useState(false);
  const [homeworkVerified, setHomeworkVerified] = useState(false);
  const [homeworkData, setHomeworkData] = useState(null);
  const [homeworkSubmission, setHomeworkSubmission] = useState(null);

  const playerRef = useRef(null)
  const progressBarRef = useRef(null)
  const lastUpdateTimeRef = useRef(0)
  const hasViewedRef = useRef(false)
  const redirectTimeoutRef = useRef(null)
  const fileInputRef = useRef(null)
  const videoContainerRef = useRef(null)

  // Check if user has permission to upload files
  const hasUploadPermission = () => {
    const allowedRoles = [
      "Lecturer",
      "Admin",
      "SubAdmin",
      "Moderator",
      "Assistant",
    ];
    return userRole && allowedRoles.includes(userRole);
  };

  // Fetch user data first
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const dashboardResult = await getUserDashboard();
        if (dashboardResult.success) {
          const { userInfo } = dashboardResult.data.data;
          setUserRole(userInfo.role);
          setUserId(userInfo.id);

          // Get purchase ID from purchase history if available
          if (
            dashboardResult.data.data.purchaseHistory &&
            dashboardResult.data.data.purchaseHistory.length > 0
          ) {
            
            // Find the purchase for this lecture - handle both container and direct lecture purchases
            const lecturePurchase = dashboardResult.data.data.purchaseHistory.find((purchase) => {
              // Direct lecture purchase (new structure)
              if (purchase.lecture && purchase.lecture._id === lectureId) {
                return true;
              }
              
              // Container purchase (old structure)
              if (purchase.container && purchase.container._id === lectureId) {
                return true;
              }
              
              // Check if lecture is within a purchased container/course
              if (purchase.container && purchase.container.lectures) {
                return purchase.container.lectures.some(lecture => lecture._id === lectureId);
              }
              
              return false;
            });

            if (lecturePurchase) {
              setPurchaseId(lecturePurchase._id);
              setCurrentPurchase(lecturePurchase); // Store the purchase data
            } else {
            }
          } else {
          }
        } else {
          console.error("Failed to fetch user data:", dashboardResult.error);
          setError(t("failedToAuthenticateUser"));
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(t("failedToAuthenticateUser"));
      }
    };
    fetchUserData();
  }, [t]);

  // Fetch lecture data and attachments
  useEffect(() => {
    const fetchLecture = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getLectureById(lectureId);
        if (result.success) {
          const lectureData = result.data.container;
          setLecture(lectureData);
        } else {
          setError(result.error || t("failedToLoadLecture"));
        }
      } catch (err) {
        setError(t("failedToLoadLectureTryAgain"));
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchAttachments = async () => {
      try {
        const result = await getLectureAttachments(lectureId);
        if (result.status === "success") {

          // Set the entire data object with all attachment types
          setAttachments(result.data);

          // Create a flat array of all attachments for simple display
          const allAttachmentsArray = [
            ...(result.data.pdfsandimages || []),
            ...(result.data.homeworks || []),
            ...(result.data.exams || []),
            ...(result.data.booklets || []),
          ];

          setAllAttachments(allAttachmentsArray);
        } else {
          console.error("Failed to fetch attachments:", result.message);
        }
      } catch (err) {
        console.error("Error fetching attachments:", err);
      }
    };

    // Fetch homeworks if user has permission
    const fetchHomeworks = async () => {
      if (!hasUploadPermission()) return;

      try {
        const result = await getLectureHomeworks(lectureId);
        if (result.success) {
          setHomeworks(result.data.attachments || []);
        } else {
          console.error("Failed to fetch homeworks:", result.error);
        }
      } catch (err) {
        console.error("Error fetching homeworks:", err);
      }
    };

    if (lectureId) {
      fetchLecture();
      fetchAttachments();
      fetchHomeworks();
    }
  }, [lectureId, userId, userRole, t]);

  // Implement the complete flow for exam verification and lecture access
  const verifyExamAndCheckAccess = async () => {
    if (userRole !== "Student" || !lectureId) return;

    try {
      setExamVerificationLoading(true);

      // Step 1: Check all submissions (exam and homework)
      const verificationResult = await verifyExamSubmission(lectureId);

      // Step 2: Check lecture access requirements
      const accessResult = await checkLectureAccess(lectureId);

      if (accessResult.status === "restricted") {
        // Handle exam requirements
        if (accessResult.data?.exam?.required) {
          setExamRequired(true);
          setExamData({
            passingThreshold: accessResult.data.exam.passingThreshold,
            examUrl: accessResult.data.exam.url,
            examType: "exam",
          });

          // Check exam submission status
          if (verificationResult.data?.exam?.passed) {
            setExamVerified(true);
            setExamSubmission(verificationResult.data.exam.submission);
          } else {
            setExamVerified(false);
            if (verificationResult.data?.exam?.submission) {
              setExamSubmission(verificationResult.data.exam.submission);
            }
          }
        }

        // Handle homework requirements
        if (accessResult.data?.homework?.required && accessResult.status === "restricted") {
          setHomeworkRequired(true);
          setHomeworkData({
            passingThreshold: accessResult.data.homework.passingThreshold,
            homeworkUrl: accessResult.data.homework.url,
            homeworkType: "homework",
          });

          // Check homework submission status
          if (verificationResult.data?.homework?.passed) {
            setHomeworkVerified(true);
            setHomeworkSubmission(verificationResult.data.homework.submission);
          } else {
            setHomeworkVerified(false);
            if (verificationResult.data?.homework?.submission) {
              setHomeworkSubmission(verificationResult.data.homework.submission);
            }
          }
        }

        // Handle case where neither exam nor homework is required but access is restricted
        if (!accessResult.data?.exam?.required && !accessResult.data?.homework?.required) {
          console.error("Unexpected restricted access:", accessResult);
          setExamVerified(true);
          setHomeworkVerified(true);
        }
      } else {
        // No restrictions found
        setExamRequired(false);
        setHomeworkRequired(false);
        setExamVerified(true);
        setHomeworkVerified(true);
      }
    } catch (err) {
      console.error("Error in verification flow:", err);
      setExamVerified(true); // Fallback to allow access
      setHomeworkVerified(true);
    } finally {
      setExamVerificationLoading(false);
    }
  };

    // Add a useEffect to call verifyExamAndCheckAccess on refresh
    useEffect(() => {
      // This will run when the component mounts or when lectureId or userRole changes
      if (userRole === "Student" && lectureId) {
        verifyExamAndCheckAccess();
      }
    }, [lectureId, userRole]);

    // Fetch student access data - only for students
    useEffect(() => {
      const fetchAccessData = async () => {
        if (
          userRole === "Lecturer" ||
          userRole === "Admin" ||
          userRole === "SubAdmin" ||
          userRole === "Moderator" ||
          userRole === "Assistant" ||
          !userId || // Make sure we have a userId before proceeding
          !purchaseId // Make sure we have a purchaseId before proceeding
        ) {
          return;
        }

        try {
          
          
          let apiLectureId = lectureId; // Default to lecture ID
          let isStandaloneLecture = false;
          
          // Determine if this is a standalone lecture or container-based lecture
          if (currentPurchase && currentPurchase.type === "containerPurchase" && currentPurchase.container) {
            // For container purchases, use the container ID
            apiLectureId = currentPurchase.container._id;
            isStandaloneLecture = false;
          } else if (currentPurchase && currentPurchase.type === "lecturePurchase") {
            // For lecture purchases, use the lecture ID and mark as standalone
            apiLectureId = lectureId;
            isStandaloneLecture = true;
          }
          
          // Use the updated function to check student lecture access
          const result = await checkStudentLectureAccess(
            userId,
            apiLectureId,
            purchaseId,
            isStandaloneLecture
          );

          if (result.success && result.data) {
            // The access data is directly in result.data.access
            if (result.data.access) {
              
              // Only set the studentLectureAccessId, don't update remainingViews yet
              setStudentLectureAccessId(result.data.access._id)
              setAccessDataLoaded(true)

              // Store the remaining views in a ref to use when the video plays
              if (result.data.access.remainingViews !== undefined) {
                setRemainingViews(result.data.access.remainingViews);
              }

              if (result.data.access.remainingViews < 0) {
                setVideoBlocked(true)
                redirectTimeoutRef.current = setTimeout(() => navigate(-1), 180000)
              }
            } else {
              console.error("No access data found in API response");
              setError(t("noAccessToLecture"));
            }
          } else {
            console.error("Failed to check lecture access:", result.error);
            setError(t("noAccessToLecture"));
          }
        } catch (error) {
          console.error("Error fetching access data:", error)
          setError(t("failedToLoadAccessData"))
          setAccessDataLoaded(true)
        }
      };

      if (lectureId && userRole === "Student" && userId && purchaseId) {
        fetchAccessData();
      } else {
        setError(t("noAccessToLecture"));
      }
    }, [lectureId, navigate, userRole, userId, purchaseId, t]);

    // Reset upload states when changing tabs
    useEffect(() => {
      setUploadingFiles([]);
      setUploadError(null);
      setUploadSuccess(false);
    }, [activeTab]);

    // Clear success message after 3 seconds
    useEffect(() => {
      let timer;
      if (uploadSuccess) {
        timer = setTimeout(() => {
          setUploadSuccess(false);
        }, 3000);
      }
      return () => clearTimeout(timer);
    }, [uploadSuccess]);

    // Clear homework success message after 3 seconds
    useEffect(() => {
      let timer;
      if (homeworkSuccess) {
        timer = setTimeout(() => {
          setHomeworkSuccess(false);
        }, 3000);
      }
      return () => clearTimeout(timer);
    }, [homeworkSuccess]);

    // Fix for exit warning
    useEffect(() => {
      // Only add the beforeunload event listener for students who haven't watched 50%
      if (userRole === "Student") {
        const handleBeforeUnload = (e) => {
          // Only show the warning if they haven't watched 50% of the video
          if (progress < 50) {
            const message =
              t("exitWarningMessage") || "You haven't completed 50% of this lecture yet. Are you sure you want to leave?"
            e.preventDefault()
            e.returnValue = message
            setHasAttemptedToLeave(true)
            return message
          }
        }

        window.addEventListener("beforeunload", handleBeforeUnload)

        return () => {
          window.removeEventListener("beforeunload", handleBeforeUnload)
        }
      }
    }, [userRole, progress, t])

    // Add this to handle the back button specifically
    useEffect(() => {
      // Only add for students who haven't watched 50%
      if (userRole === "Student" && progress < 50 && !showFiftyPercentWarning) {
        // Override the back button
        const handleBackButton = (e) => {
          e.preventDefault()
          setShowExitConfirmation(true)
          setPendingNavigation(-1) // -1 means go back
        }

        window.addEventListener("popstate", handleBackButton)

        return () => {
          window.removeEventListener("popstate", handleBackButton)
        }
      }
    }, [userRole, progress, showFiftyPercentWarning])

    // Vidstack Player Logic
    const youtubeVideoId = lecture ? getYouTubeId(lecture.videoLink) : null;

    const handleOnCanPlay = () => {
      const player = playerRef.current;
      if (!player) return;

      const savedTime = localStorage.getItem(
        `lecture_${lectureId}_vidstack_time`
      );
      if (savedTime) {
        try {
          const parsedTime = Number.parseFloat(savedTime);
          if (
            !isNaN(parsedTime) &&
            parsedTime > 0 &&
            parsedTime < player.duration
          ) {
            player.currentTime = parsedTime;
          } else if (parsedTime >= player.duration) {
            localStorage.removeItem(`lecture_${lectureId}_vidstack_time`);
          }
        } catch (e) {
          console.error("Error parsing saved time:", e);
          localStorage.removeItem(`lecture_${lectureId}_vidstack_time`);
        }
      }
    };

    const handleOnPlay = async () => {
      if (
        userRole !== "Student" ||
        hasViewedRef.current ||
        (remainingViews !== null && remainingViews <= 0) ||
        !accessDataLoaded
      )
        return

      setIsPlaying(true)

      try {
        hasViewedRef.current = true;

        // Use the updateStudentLectureAccess function
        const response = await updateStudentLectureAccess(
          studentLectureAccessId,
          {
            remainingViews: remainingViews - 1,
          }
        );

        if (response.success) {
          // The updated data is directly in response.data
          setRemainingViews(response.data.remainingViews);

          if (response.data.remainingViews <= 0) {
            setVideoBlocked(true);
            playerRef.current?.pause();
            alert(t("noMoreViewsAlert"));
            redirectTimeoutRef.current = setTimeout(() => navigate(-1), 180000);
          }
        } else {
          console.error("Failed to update remaining views:", response.error);
          hasViewedRef.current = false;
        }
      } catch (error) {
        console.error("View update error:", error);
        hasViewedRef.current = false;
        if (error.message && error.message.includes("CORS")) {
          setError(t("connectionError"));
        } else {
          setError(t("viewUpdateError"));
        }
      }
    };

    const handleOnPause = () => {
      setIsPlaying(false)
      const player = playerRef.current
      if (player && player.currentTime > 0 && !player.ended) {
        localStorage.setItem(
          `lecture_${lectureId}_vidstack_time`,
          player.currentTime.toString()
        );
      }
    };

    const handleOnTimeUpdate = () => {
      const player = playerRef.current
      if (!player) return

      const currentTimeValue = player.currentTime || 0
      const durationValue = player.duration || 0
      const now = Date.now()

      // Update state with current values
      setCurrentTime(currentTimeValue)
      setDuration(durationValue)

      // Calculate progress percentage
      if (durationValue > 0) {
        const progressValue = (currentTimeValue / durationValue) * 100
        setProgress(progressValue)

        // Check if we've passed 50% for the warning
        if (progressValue > 50 && !showFiftyPercentWarning) {
          setShowFiftyPercentWarning(true)
        }
      }

      // Update buffered amount
      if (player.buffered && player.buffered.length > 0) {
        const bufferedEnd = player.buffered.end(player.buffered.length - 1)
        const bufferedPercent = (bufferedEnd / durationValue) * 100
        setBuffered(bufferedPercent)
      }

      // Save time to localStorage periodically
      if (now - lastUpdateTimeRef.current >= 5000) {
        localStorage.setItem(`lecture_${lectureId}_vidstack_time`, currentTimeValue.toString())
        lastUpdateTimeRef.current = now
      }
    }

    const handleOnEnded = () => {
      setIsPlaying(false)
      localStorage.removeItem(`lecture_${lectureId}_vidstack_time`)
      if (!showFiftyPercentWarning) {
        setShowFiftyPercentWarning(true);
      }
    };

    const handleOnError = (event) => {
      console.error("Vidstack Player Error:", event.detail);
      let errorMessage = t("videoPlaybackError");
      const errorObj = event.detail;
      if (errorObj && errorObj.message) {
        if (
          errorObj.data &&
          (errorObj.data.code === 101 || errorObj.data.code === 150)
        ) {
          errorMessage = t("videoUnavailable");
        } else if (errorObj.message.toLowerCase().includes("network")) {
          errorMessage = t("networkError");
        }
      }
      setError(errorMessage);
    };

    const handleVolumeChange = (event) => {
      const player = playerRef.current
      if (!player) return

      setVolume(player.volume * 100)
      setIsMuted(player.muted)
    }

    const handlePlaybackRateChange = (event) => {
      const player = playerRef.current
      if (!player) return

      setPlaybackRate(player.playbackRate)
    }

    const handleFullscreenChange = () => {
      const player = playerRef.current
      if (!player) return

      setIsFullscreen(document.fullscreenElement !== null)
    }

    // Custom controls handlers
    const togglePlay = () => {
      const player = playerRef.current
      if (!player) return

      if (player.paused) {
        player.play()
      } else {
        player.pause()
      }
    }

    const toggleMute = () => {
      const player = playerRef.current
      if (!player) return

      player.muted = !player.muted
    }

    const changeVolume = (value) => {
      const player = playerRef.current
      if (!player) return

      player.volume = value / 100
    }

    const changePlaybackRate = (rate) => {
      const player = playerRef.current
      if (!player) return

      player.playbackRate = rate
    }

    const toggleFullscreen = () => {
      if (!videoContainerRef.current) return

      if (!document.fullscreenElement) {
        videoContainerRef.current.requestFullscreen().catch((err) => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`)
        })
      } else {
        document.exitFullscreen()
      }
    }

    const handleProgressBarClick = (e) => {
      const player = playerRef.current
      const progressBar = progressBarRef.current
      if (!player || !progressBar) return

      const rect = progressBar.getBoundingClientRect()
      const clickPosition = (e.clientX - rect.left) / rect.width
      const newTime = clickPosition * player.duration

      if (!isNaN(newTime) && isFinite(newTime) && newTime >= 0 && newTime <= player.duration) {
        player.currentTime = newTime
      }
    }

    // File upload handlers
    const handleFileSelect = (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        setUploadingFiles(files);
        setUploadError(null);
      }
    };

    const handleRemoveFile = (index) => {
      setUploadingFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleUploadFiles = async () => {
      if (uploadingFiles.length === 0) return;

      setIsUploading(true);
      setUploadError(null);
      setUploadSuccess(false);

      try {
        // Upload each file sequentially
        for (const file of uploadingFiles) {
          const attachmentData = {
            type: activeTab,
            attachment: file,
          };

          await createLectureAttachment(lectureId, attachmentData);
        }

        // Refresh attachments after successful upload
        const result = await getLectureAttachments(lectureId);
        if (result.status === "success") {
          setAttachments(result.data);

          // Update the flat array of all attachments
          const allAttachmentsArray = [
            ...(result.data.pdfsandimages || []),
            ...(result.data.homeworks || []),
            ...(result.data.exams || []),
            ...(result.data.booklets || []),
          ];
          setAllAttachments(allAttachmentsArray);
        }

        setUploadingFiles([]);
        setUploadSuccess(true);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (err) {
        console.error("Error uploading files:", err);
        setUploadError(`${t("uploadFailure")}: ${err.message}`);
      } finally {
        setIsUploading(false);
      }
    };

    // Homework handlers
    const handleHomeworkFileSelect = (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        setHomeworkFiles(files);
        setHomeworkError(null);
      }
    };

    const handleRemoveHomeworkFile = (index) => {
      setHomeworkFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmitHomework = async () => {
      if (homeworkSubmitType === "file" && homeworkFiles.length === 0) {
        setHomeworkError(t("pleaseSelectFile"));
        return;
      }

      if (homeworkSubmitType === "form" && !lecture?.homeworkFormLink) {
        setHomeworkError(t("noFormLinkAvailable"));
        return;
      }

      if (homeworkSubmitType === "form") {
        // Open the Google Form in a new tab
        window.open(lecture.homeworkFormLink, "_blank");
        return;
      }

      setIsSubmittingHomework(true);
      setHomeworkError(null);

      try {
        // Upload each file sequentially using the new homework API
        for (const file of homeworkFiles) {
          const homeworkData = {
            type: "homeworks",
            attachment: file,
          };

          const result = await uploadHomework(lectureId, homeworkData);

          if (!result.success) {
            throw new Error(result.error || t("homeworkUploadFailed"));
          }
        }

        // Refresh attachments after successful upload
        const result = await getLectureAttachments(lectureId);
        if (result.status === "success") {
          setAttachments(result.data);

          // Update the flat array of all attachments
          const allAttachmentsArray = [
            ...(result.data.pdfsandimages || []),
            ...(result.data.homeworks || []),
            ...(result.data.exams || []),
            ...(result.data.booklets || []),
          ];
          setAllAttachments(allAttachmentsArray);
        }

        // Show success notification using toast
        toast.success(t("homeworkUploadSuccess"));

        setHomeworkFiles([]);
        setHomeworkSuccess(true);
        if (homeworkFileInputRef.current) {
          homeworkFileInputRef.current.value = "";
        }
      } catch (err) {
        console.error("Error uploading homework:", err);
        setHomeworkError(`${t("homeworkUploadFailed")}: ${err.message}`);

        // Show error notification using toast
        toast.error(`${t("homeworkUploadFailed")}: ${err.message}`);
      } finally {
        setIsSubmittingHomework(false);
      }
    };

    // Handle taking the exam
    const handleTakeExam = () => {
      if (examData && examData.examUrl) {
        window.open(examData.examUrl, "_blank");
      }
    };

    // Cleanup
    useEffect(() => {
      return () => {
        if (redirectTimeoutRef.current) {
          clearTimeout(redirectTimeoutRef.current);
        }
      };
    }, []);

    // Enhanced download function to handle different file types
    const handleDownload = async (attachment) => {
      if (!attachment || !attachment._id) {
        setError(t("invalidAttachmentId"));
        return;
      }

      setIsDownloading(true);
      try {
        // First try to use the downloadAttachmentById function
        await downloadAttachmentById(attachment._id);
      } catch (err) {
        console.error("Error with primary download method:", err);

        // If the primary method fails, try a direct download approach
        try {
          if (attachment.filePath) {
            // Create a temporary anchor element
            const link = document.createElement("a");
            link.href = attachment.filePath;

            // Set the download attribute with the filename
            link.download = attachment.fileName || `download-${Date.now()}`;

            // Append to the document
            document.body.appendChild(link);

            // Trigger the download
            link.click();

            // Clean up
            document.body.removeChild(link);
          } else {
            throw new Error("No file path available");
          }
        } catch (fallbackErr) {
          console.error("Fallback download failed:", fallbackErr);
          setError(`${t("downloadFailure")}: ${err.message}`);
        }
      } finally {
        setIsDownloading(false);
      }
    };

    const isVideoEffectivelyBlocked =
      userRole === "Student" &&
      (videoBlocked || (remainingViews !== null && remainingViews <= 0));

    // Check if content should be blocked due to exam requirements
    const isContentBlocked =
  userRole === "Student" && 
  ((examRequired && !examVerified) || 
   (homeworkRequired && !homeworkVerified));

    if (loading || examVerificationLoading) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex justify-center items-center min-h-screen p-4">
          <div className="alert alert-error">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      );
    }

    // Render exam requirement message if needed
    if (isContentBlocked) {
  // Determine which requirement is blocking access
  const isHomeworkBlock = homeworkRequired && !homeworkVerified;
  const requirementData = isHomeworkBlock ? homeworkData : examData;
  const requirementType = isHomeworkBlock ? "homework" : "exam";

  return (
    <div className="container mx-auto p-4" dir={isRTL ? "rtl" : "ltr"}>
      <button
        onClick={() => navigate(-1)}
        className="btn btn-outline btn-primary mb-4"
      >
        {t("back")}
      </button>
      <h1 className="text-3xl font-bold mb-6 text-center md:text-right">
        {lecture?.name || t("loadingLecture")}
      </h1>

      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title flex items-center gap-2">
            <FiAlertTriangle className="text-warning" />
            {requirementType === "homework"
              ? t("homeworkRequiredFirst") || "Homework Submission Required"
              : t("examRequiredFirst")}
          </h2>
          <p className="my-4">
            {requirementType === "homework"
              ? t("homeworkRequiredDescription") ||
                "You must complete and submit the homework before accessing this lecture content."
              : t("examRequiredDescription")}
          </p>

          {requirementData && (
            <div className="bg-base-200 p-4 rounded-lg my-4">
              <h3 className="font-semibold mb-2">
                {requirementType === "homework" 
                  ? t("homeworkInfo") || "Homework Information" 
                  : t("examInfo")}:
              </h3>

              {requirementData.passingThreshold && (
                <ul className="space-y-2">
                  <li>
                    <span className="font-medium">{t("requiredPassingScore")}:</span> 
                    {requirementData.passingThreshold}
                  </li>
                </ul>
              )}

              <div className="mt-6">
                <a
                  href={requirementType === "homework" 
                    ? requirementData.homeworkUrl 
                    : requirementData.examUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary w-full sm:w-auto"
                >
                  <FiExternalLink className="mr-2" />
                  {requirementType === "homework" 
                    ? t("startHomework") || "Complete Homework" 
                    : t("startExam")}
                </a>
              </div>
            </div>
          )}

          <div className="alert alert-info mt-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span>
              {requirementType === "homework"
                ? t("afterCompletingHomework") ||
                  "After completing the homework, you'll be able to access this lecture."
                : t("afterPassingExam")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

    // Function to get appropriate icon based on file type
    const getFileIcon = (fileType) => {
      if (!fileType) return <FiFile className="text-primary text-xl" />;

      const type = fileType.toLowerCase();
      if (type.includes("pdf")) {
        return <FiFile className="text-red-500 text-xl" />;
      } else if (
        type.includes("image") ||
        type.includes("png") ||
        type.includes("jpg") ||
        type.includes("jpeg")
      ) {
        return <FiFile className="text-green-500 text-xl" />;
      } else if (type.includes("video")) {
        return <FiFile className="text-blue-500 text-xl" />;
      } else if (type.includes("audio")) {
        return <FiFile className="text-purple-500 text-xl" />;
      } else {
        return <FiFile className="text-primary text-xl" />;
      }
    };

    // Add a function to format dates for better display
    // Add this with the other utility functions:
    const formatDate = (dateString) => {
      if (!dateString) return t("notAvailable");

      try {
        const date = new Date(dateString);
        return date.toLocaleDateString(
          i18n.language === "ar" ? "ar-EG" : "en-US",
          {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }
        );
      } catch (error) {
        console.error("Error formatting date:", error);
        return t("invalidDate");
      }
    };

    return (
      <div className="container mx-auto p-4" dir={isRTL ? "rtl" : "ltr"}>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-outline btn-primary mb-4"
        >
          {t("back")}
        </button>
        <h1 className="text-3xl font-bold mb-6 text-center md:text-right">
          {lecture?.name || t("loadingLecture")}
        </h1>

        {userRole && userRole !== "Student" && (
          <div className="alert alert-info mb-6 shadow-lg">
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-current shrink-0 w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span>{t("viewingAs", { role: userRole })}</span>
            </div>
          </div>
        )}

        {userRole === "Student" &&
          examRequired &&
          examVerified &&
          examSubmission && (
            <div className="alert alert-success mb-6 shadow-lg">
              <div className="flex items-center gap-2">
                <FiAward className="stroke-current shrink-0 w-6 h-6" />
                <div>
                  <span className="font-bold">{t("examPassedSuccessfully")}</span>
                  <div className="text-sm mt-1">
                    <span>
                      {t("score")}: {examSubmission.score}/
                      {examSubmission.maxScore}
                    </span>
                    <span className="mx-2">|</span>
                    <span>
                      {t("passDate")}: {formatDate(examSubmission.verifiedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        {showFiftyPercentWarning && !isVideoEffectivelyBlocked && (
          <div className="alert alert-warning my-4 shadow-lg">
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>{t("fiftyPercentWarning")}</span>
            </div>
          </div>
        )}

        {hasAttemptedToLeave && !showFiftyPercentWarning && (
          <div className="alert alert-warning my-4 shadow-lg">
            <div>
              <FiAlertTriangle className="stroke-current shrink-0 h-6 w-6" />
              <span>
                {t("exitWarningMessage") || "You haven't completed 50% of this lecture yet. Please continue watching."}
              </span>
            </div>
          </div>
        )}

        {isVideoEffectivelyBlocked ? (
          <div className="alert alert-error mb-6 shadow-lg">
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>{t("noMoreViewsRedirect")}</span>
            </div>
          </div>
        ) : youtubeVideoId ? (
          <div className="mb-6 shadow-xl rounded-lg overflow-hidden bg-base-300" ref={videoContainerRef}>
            <MediaPlayer
              ref={playerRef}
              title={lecture?.name}
              src={`youtube/${youtubeVideoId}`}
              poster={lecture?.thumbnailLink || ""}
              playsInline
              autoPlay={false}
              onCanPlay={handleOnCanPlay}
              onPlay={handleOnPlay}
              onTimeUpdate={handleOnTimeUpdate}
              onPause={handleOnPause}
              onEnded={handleOnEnded}
              onError={handleOnError}
              onVolumeChange={handleVolumeChange}
              onRateChange={handlePlaybackRateChange}
              aspectRatio="16/9"
            >
              <MediaProvider>
                {lecture?.thumbnailLink && (
                  <Poster
                    className="vds-poster"
                    src={lecture.thumbnailLink}
                    alt={t("lecturePoster", { name: lecture?.name })}
                  />
                )}
              </MediaProvider>
              <DefaultVideoLayout icons={defaultLayoutIcons} thumbnails={lecture?.videoThumbnailsVTT || null} />
            </MediaPlayer>

            {/* Enhanced custom progress bar */}
            <div className="p-4 bg-base-200">
              <div className="flex flex-col space-y-2">
                {/* Video info */}
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <FiClock className="text-primary" />
                    <span className="text-sm font-medium">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Playback rate selector */}
                    <div className="dropdown dropdown-top dropdown-end">
                      <label tabIndex={0} className="btn btn-sm btn-ghost">
                        {playbackRate}x
                      </label>
                      <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                        {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                          <li key={rate}>
                            <a className={playbackRate === rate ? "active" : ""} onClick={() => changePlaybackRate(rate)}>
                              {rate}x
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Volume control */}
                    <div className="flex items-center gap-2">
                      <button className={`btn btn-sm btn-ghost ${isRTL ? "rotate-180" : ""}`} onClick={toggleMute}>
                        {isMuted ? <FiVolumeX /> : <FiVolume2 />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => changeVolume(Number.parseInt(e.target.value))}
                        className="range range-xs range-primary w-24"
                      />
                    </div>

                    {/* Fullscreen toggle */}
                    <button className="btn btn-sm btn-ghost" onClick={toggleFullscreen}>
                      {isFullscreen ? <FiMinimize /> : <FiMaximize />}
                    </button>
                  </div>
                </div>

                {/* Progress bar container */}
                <div
                  className="relative w-full h-4 bg-gray-300 rounded-full cursor-pointer overflow-hidden group"
                  ref={progressBarRef}
                  onClick={handleProgressBarClick}
                >
                  {/* Buffered progress */}
                  <div
                    className="absolute top-0 left-0 h-full bg-gray-500 opacity-50 transition-all duration-300"
                    style={{ width: `${buffered}%` }}
                  ></div>

                  {/* Actual progress */}
                  <div
                    className="absolute top-0 left-0 h-full bg-primary transition-all duration-300 ease-in-out"
                    style={{ width: `${progress}%` }}
                  ></div>

                  {/* Hover effect */}
                  <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-20 bg-white"></div>

                  {/* Thumb indicator */}
                  <div
                    className="absolute top-0 h-full aspect-square rounded-full bg-primary-focus border-2 border-white transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ left: `${progress}%` }}
                  ></div>
                </div>

                {/* Play/Pause button centered over video */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="btn btn-circle btn-lg bg-primary bg-opacity-70 hover:bg-opacity-90 border-0"
                    onClick={togglePlay}
                  >
                    {isPlaying ? <FiPause className="text-2xl" /> : <FiPlay className="text-2xl" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Video stats and info */}
            <div className="p-4 bg-base-200 rounded-b-lg">
              <div className="flex flex-wrap justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="badge badge-primary">
                    {t("totalDuration")} : {formatTime(duration)}
                  </span>
                  {userRole === "Student" && (
                    <span className="badge badge-secondary">
                      {t("remainingViews")}: {remainingViews === null ? t("loading") : remainingViews}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                  <span className="badge badge-outline">
                    {progress < 25
                      ? t("justStarted")
                      : progress < 50
                        ? t("almostHalfway")
                        : progress < 75
                          ? t("goodProgress")
                          : progress < 95
                            ? t("almostDone")
                            : t("completed")}
                  </span>

                  {progress > 0 && progress < 100 && (
                    <span className="badge badge-info">
                      {Math.round(progress)}% {t("completed")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : lecture?.videoLink ? (
          <div className="alert alert-warning mb-6 shadow-lg">
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-current shrink-0 w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span>{t("invalidVideoLink")}</span>
            </div>
          </div>
        ) : (
          <div className="alert alert-warning mb-6 shadow-lg">
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-current shrink-0 w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span>{t("noVideoLink")}</span>
            </div>
          </div>
        )}

        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title">{t("lectureDetails")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="mb-2">
                  <strong>{t("description")}:</strong>{" "}
                  {lecture?.description || t("noDescriptionAvailable")}
                </p>
                <p className="mb-2">
                  <strong>{t("price")}:</strong>{" "}
                  {lecture?.price !== undefined
                    ? t("pricePoints", { price: lecture?.price })
                    : t("notSpecified")}
                </p>
              </div>
              <div>
                <p className="mb-2">
                  <strong>{t("type")}:</strong>{" "}
                  {lecture?.lecture_type || t("notSpecified")}
                </p>
                <p className="mb-2">
                  <strong>{t("createdBy")}:</strong>{" "}
                  {lecture?.createdBy?.name || t("notSpecified")}
                </p>
                {lecture?.requiresExam && (
                  <p className="mb-2">
                    <strong>{t("requiresExam")}:</strong> {t("yes")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* IMPROVED RESPONSIVE ATTACHMENTS DISPLAY */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title mb-4">{t("attachments")}</h2>

            {allAttachments.length === 0 ? (
              <div className="alert alert-info">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="stroke-current shrink-0 w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span>{t("noAttachments")}</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {allAttachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="card bg-base-100 border border-base-300 hover:border-primary transition-all duration-300"
                  >
                    <div className="card-body p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {getFileIcon(attachment.fileType)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg mb-1 break-words">
                              {attachment.fileName || t("fileWithoutName")}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 text-sm gap-x-4">
                              <p className="mb-1">
                                {t("size")}:{" "}
                                {attachment.fileSize
                                  ? t("kilobytes", {
                                    size: Math.round(
                                      attachment.fileSize / 1024
                                    ),
                                  })
                                  : t("notSpecified")}
                              </p>
                              <p className="mb-1">
                                {t("uploadDate")}:{" "}
                                {attachment.uploadedOn
                                  ? new Date(
                                    attachment.uploadedOn
                                  ).toLocaleDateString(
                                    i18n.language === "ar" ? "ar-EG" : "en-US"
                                  )
                                  : t("notSpecified")}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3 sm:mt-0 justify-end">
                          {attachment.filePath && (
                            <a
                              href={attachment.filePath}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-primary"
                            >
                              <FiEye className="mr-1" /> {t("view")}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Homework upload section for students */}
        {userRole === "Student" && (
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <h2 className="card-title mb-4">{t("submitHomework")}</h2>

              <div className="tabs tabs-boxed mb-4">
                <a
                  className={`tab ${homeworkSubmitType === "file" ? "tab-active" : ""
                    }`}
                  onClick={() => setHomeworkSubmitType("file")}
                >
                  {t("uploadFile")}
                </a>
                <a
                  className={`tab ${homeworkSubmitType === "form" ? "tab-active" : ""
                    }`}
                  onClick={() => setHomeworkSubmitType("form")}
                >
                  {t("googleForm")}
                </a>
              </div>

              <div className="p-4 border border-dashed border-primary rounded-lg">
                {homeworkSubmitType === "file" ? (
                  <>
                    <h3 className="text-lg font-semibold mb-2">
                      {t("uploadHomeworkFile")}
                    </h3>

                    <div className="mb-4">
                      <input
                        type="file"
                        ref={homeworkFileInputRef}
                        onChange={handleHomeworkFileSelect}
                        multiple
                        className="file-input file-input-bordered file-input-primary w-full"
                      />
                    </div>

                    {homeworkFiles.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">
                          {t("selectedFiles")}:
                        </h4>
                        <ul className="space-y-2">
                          {homeworkFiles.map((file, index) => (
                            <li
                              key={index}
                              className="flex justify-between items-center p-2 bg-base-200 rounded"
                            >
                              <span className="text-sm truncate max-w-[80%]">
                                {file.name}
                              </span>
                              <button
                                onClick={() => handleRemoveHomeworkFile(index)}
                                className="btn btn-circle btn-xs btn-ghost"
                              >
                                <FiX />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {homeworkError && (
                      <div className="alert alert-error mb-4">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="stroke-current shrink-0 h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>{homeworkError}</span>
                      </div>
                    )}

                    {homeworkSuccess && (
                      <div className="alert alert-success mb-4">
                        <FiCheck className="stroke-current shrink-0 h-6 w-6" />
                        <span>{t("homeworkUploadSuccess")}</span>
                      </div>
                    )}

                    <button
                      onClick={handleSubmitHomework}
                      disabled={
                        homeworkFiles.length === 0 || isSubmittingHomework
                      }
                      className="btn btn-primary w-full"
                    >
                      {isSubmittingHomework ? (
                        <>
                          <span className="loading loading-spinner"></span>
                          {t("submittingHomework")}
                        </>
                      ) : (
                        <>
                          <FiUpload className="mr-2" />
                          {t("submitHomework")}
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold mb-2">
                      {t("completeGoogleForm")}
                    </h3>

                    {lecture?.homeworkFormLink || examUrl ? (
                      <div className="mb-4">
                        <p className="mb-4">
                          {t("completeGoogleFormDescription")}
                        </p>
                        <button
                          onClick={() => {
                            // Open the Google Form in a new tab
                            if (
                              examData &&
                              examData.examType === "homework" &&
                              examUrl
                            ) {
                              window.open(examUrl, "_blank");
                            } else if (lecture.homeworkFormLink) {
                              window.open(lecture.homeworkFormLink, "_blank");
                            }
                          }}
                          className="btn btn-primary w-full"
                        >
                          <FiLink className="mr-2" />
                          {t("openGoogleForm")}
                        </button>
                      </div>
                    ) : (
                      <div className="alert alert-warning">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="stroke-current shrink-0 h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        <span>{t("noGoogleFormLink")}</span>
                      </div>
                    )}
                  </>
                )}

                <div className="mt-4 text-sm text-gray-600">
                  <p>{t("notes")}:</p>
                  <ul className="list-disc list-inside">
                    <li>{t("fileFormatsNote")}</li>
                    <li>{t("fileSizeLimit")}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Homeworks list for authorized users */}
        {hasUploadPermission() && homeworks.length > 0 && (
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <h2 className="card-title mb-4">
                {t("studentSubmittedHomeworks")}
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {homeworks.map((homework, index) => (
                  <div
                    key={index}
                    className="card bg-base-100 border border-base-300 hover:border-primary transition-all duration-300"
                  >
                    <div className="card-body p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {getFileIcon(homework.fileType)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg mb-1 break-words">
                              {homework.fileName || t("fileWithoutName")}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 text-sm gap-x-4">
                              <p className="mb-1">
                                {t("size")}:{" "}
                                {homework.fileSize
                                  ? t("kilobytes", {
                                    size: Math.round(homework.fileSize / 1024),
                                  })
                                  : t("notSpecified")}
                              </p>
                              <p className="mb-1">
                                {t("submissionDate")}:{" "}
                                {homework.uploadedOn
                                  ? new Date(
                                    homework.uploadedOn
                                  ).toLocaleDateString(
                                    i18n.language === "ar" ? "ar-EG" : "en-US"
                                  )
                                  : t("notSpecified")}
                              </p>
                              <p className="mb-1">
                                {t("student")}:{" "}
                                {homework.studentId.name || t("notSpecified")}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3 sm:mt-0 justify-end">
                          {homework.filePath && (
                            <a
                              href={homework.filePath}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-primary"
                            >
                              <FiEye className="mr-1" /> {t("view")}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* File uploader for authorized users */}
        {hasUploadPermission() && (
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <h2 className="card-title mb-4">{t("uploadNewAttachments")}</h2>

              <div className="tabs tabs-boxed mb-4 flex flex-wrap">
                {["pdfsandimages", "homeworks", "exams", "booklets"].map(
                  (type) => (
                    <a
                      key={type}
                      className={`tab flex-grow sm:flex-grow-0 ${activeTab === type ? "tab-active" : ""
                        }`}
                      onClick={() => setActiveTab(type)}
                    >
                      {t(type)}
                    </a>
                  )
                )}
              </div>

              <div className="p-4 border border-dashed border-primary rounded-lg">
                <h3 className="text-lg font-semibold mb-2">
                  {t("addNewAttachments")} ({t(activeTab)})
                </h3>

                <div className="mb-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    className="file-input file-input-bordered file-input-primary w-full"
                  />
                </div>

                {uploadingFiles.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">
                      {t("selectedFiles")}:
                    </h4>
                    <ul className="space-y-2">
                      {uploadingFiles.map((file, index) => (
                        <li
                          key={index}
                          className="flex justify-between items-center p-2 bg-base-200 rounded"
                        >
                          <span className="text-sm truncate max-w-[80%]">
                            {file.name}
                          </span>
                          <button
                            onClick={() => handleRemoveFile(index)}
                            className="btn btn-circle btn-xs btn-ghost"
                          >
                            <FiX />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {uploadError && (
                  <div className="alert alert-error mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="stroke-current shrink-0 h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{uploadError}</span>
                  </div>
                )}

                {uploadSuccess && (
                  <div className="alert alert-success mb-4">
                    <FiCheck className="stroke-current shrink-0 h-6 w-6" />
                    <span>{t("filesUploadedSuccessfully")}</span>
                  </div>
                )}

                <button
                  onClick={handleUploadFiles}
                  disabled={uploadingFiles.length === 0 || isUploading}
                  className="btn btn-primary w-full"
                >
                  {isUploading ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      {t("uploading")}
                    </>
                  ) : (
                    <>
                      <FiUpload className="mr-2" />
                      {t("uploadFiles")}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Exit confirmation dialog */}
        {showExitConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-base-100 p-6 rounded-lg shadow-xl max-w-md w-full">
              <h3 className="font-bold text-lg mb-4">{t("exitWarningTitle") || "Leaving so soon?"}</h3>
              <p className="mb-6">
                {t("exitWarningMessage") ||
                  "You haven't completed 50% of this lecture yet. Are you sure you want to leave?"}
              </p>
              <div className="flex justify-end gap-2">
                <button onClick={handleCancelNavigation} className="btn btn-outline">
                  {t("stayOnPage") || "Stay on page"}
                </button>
                <button onClick={handleConfirmNavigation} className="btn btn-primary">
                  {t("leavePage") || "Leave anyway"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  export default LectureDisplay;
