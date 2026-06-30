"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  getLectureById,
  getLectureAttachments,
  downloadAttachmentById,
  createLectureAttachment,
  loadLecturePage,
  recheckAssessmentAccess,
} from "../../../routes/lectures"
import {
  findFirstAttachmentLinkUrl,
  formatTime,
  getYouTubeId,
  pickFirstUrl,
} from "./lectureDisplay.utils"
import { translateErrorMessage } from "../../../utils/errorTranslator"
import { uploadHomework } from "../../../routes/homeworks"
import { getUserFromToken } from "../../../routes/auth-services"
import { accountStudentLecturePlayStart } from "../../../routes/student-lecture-access"
import {
  createEmptyAssessments,
  createEmptyAttachmentGroups,
  flattenLectureAttachments,
  normalizeLecturePageData,
  resolveAssessmentFormUrls,
  uploadLectureHomeworkFiles,
} from "./lecture-submission-workflow"
import {
  FiUpload,
  FiDownload,
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
  FiEdit,
  FiCopy,
} from "react-icons/fi"
import CommunityTab from "../../../components/lecture-community/CommunityTab";
import Button from "../../../components/ui/Button";
import { designTokens } from "../../../constants/designTokens";

import Input from "../../../components/ui/Input";
import Badge from "../../../components/ui/Badge";
import Card from "../../../components/ui/Card";
import Modal from "../../../components/ui/Modal";
import Tabs from "../../../components/ui/Tabs";

// Vidstack imports
import { MediaPlayer, MediaProvider, Poster } from "@vidstack/react";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

const DEFAULT_LECTURE_ATTACHMENT_TYPE = "pdfsandimages";

const getAssessmentStatus = (assessment) => {
  if (assessment?.verified || assessment?.passed || assessment?.status === "passed") return "passed"
  if (assessment?.status === "failed" || assessment?.status === "sync_error") return "failed"
  return assessment?.status || "pending"
}

const getAssessmentBadgeVariant = (assessment) => {
  const status = getAssessmentStatus(assessment)
  if (status === "passed") return "success"
  if (status === "failed") return "error"
  return "accent"
}

const getAssessmentStatusLabel = (assessment, t) => {
  const status = getAssessmentStatus(assessment)
  if (status === "passed") return t("statusPassed", "Passed")
  if (status === "failed") return t("statusFailed", "Failed")
  return t("statusPending", "Pending")
}

const formatAssessmentValue = (value, t) =>
  value === undefined || value === null || value === ""
    ? t("notAvailable", "Not available")
    : value

const getAssessmentScore = (assessment) => ({
  score: assessment?.score ?? assessment?.submission?.score ?? null,
  maxScore: assessment?.maxScore ?? assessment?.submission?.maxScore ?? null,
})

const hasAssessmentScore = (assessment) => {
  const { score, maxScore } = getAssessmentScore(assessment)
  return score !== null || maxScore !== null
}

const LectureDisplay = () => {
  const { t, i18n } = useTranslation("lectureDisplay");
  const isRTL = i18n.language === "ar";
  const TOKENS = designTokens.colors;
  const SHADOWS = designTokens.shadows;
  const RADIUS = designTokens.radius;
  const GRADIENTS = designTokens.gradients;
  const pageBackground = `${GRADIENTS.pageAtmosphere}, linear-gradient(180deg, ${TOKENS.creamSurface} 0%, rgba(241,243,246,0.94) 100%)`;
  const shellStyle = {
    background: "rgba(255,255,255,0.62)",
    border: `1px solid ${TOKENS.borderSubtle}`,
    borderRadius: RADIUS.section,
    boxShadow: SHADOWS.level1,
    backdropFilter: "blur(14px)",
  };
  const panelStyle = {
    background: TOKENS.neutralCloud,
    border: `1px solid ${TOKENS.borderSubtle}`,
    borderRadius: RADIUS.card,
    boxShadow: SHADOWS.level1,
  };
  const softCardStyle = {
    background: "rgba(255,255,255,0.86)",
    border: `1px solid ${TOKENS.borderSubtle}`,
    borderRadius: RADIUS.card,
    boxShadow: SHADOWS.level1,
  };
  const chipStyle = {
    background: "rgba(188,231,236,0.38)",
    color: TOKENS.deepTeal,
    border: `1px solid rgba(14,85,99,0.12)`,
    borderRadius: RADIUS.chip,
  };

  const { lectureId } = useParams();
  const navigate = useNavigate();
  const [lecture, setLecture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attachments, setAttachments] = useState(createEmptyAttachmentGroups);
  const [allAttachments, setAllAttachments] = useState([]);
  const [showFiftyPercentWarning, setShowFiftyPercentWarning] = useState(false);
  const [remainingViews, setRemainingViews] = useState(null);
  const [studentLectureAccessId, setStudentLectureAccessId] = useState(null);   
  const [videoBlocked, setVideoBlocked] = useState(false);
  const [userRole, setUserRole] = useState(() => {
    const user = getUserFromToken();
    return user?.role || user?.UserInfo?.role || null;
  });
  const [userId, setUserId] = useState(() => {
    const user = getUserFromToken();
    return user?.id || user?._id || user?.UserInfo?.id || null;
  });
  const [userEmail, setUserEmail] = useState("");
  const [studentFullName, setStudentFullName] = useState("");
  const [studentSequenceId, setStudentSequenceId] = useState("");
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

  // Consolidated assessment state (replaces 12 separate state variables)
  const [assessments, setAssessments] = useState(createEmptyAssessments);
  const [verificationLoading, setVerificationLoading] = useState(false);

  // Attachment uploads
  const [activeMainTab, setActiveMainTab] = useState("video");
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
  const [viewSyncStatus, setViewSyncStatus] = useState(null);

  const playerRef = useRef(null)
  const progressBarRef = useRef(null)
  const lastUpdateTimeRef = useRef(0)
  const hasViewedRef = useRef(false)
  const pendingViewEventIdRef = useRef(null)
  const viewSyncRetryTimeoutRef = useRef(null)
  const redirectTimeoutRef = useRef(null)
  const accessResolvedForLectureRef = useRef(null)
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

  const canEditLecture = ["Lecturer", "Admin", "SubAdmin", "Moderator"].includes(userRole)
  const assessmentFormUrls = useMemo(
    () => resolveAssessmentFormUrls({ lecture, attachments, assessments }),
    [assessments, attachments, lecture],
  )
  const resolvedExamFormUrl = assessmentFormUrls.exam
  const resolvedHomeworkFormUrl = assessmentFormUrls.homework

  const handleEditLecture = () => {
    if (!lecture || !canEditLecture) {
      return
    }
 
    const lecturesPageRoute =
      userRole === "Lecturer"
        ? "/dashboard/lecturer-dashboard/lectures-page"
        : "/dashboard/admin-dashboard/lectures-page"
 
    navigate(lecturesPageRoute, {
      state: {
        lectureEditTarget: lecture,
      },
    })
  }
 
  const handleCopyEmail = () => {
    if (!userEmail) {
      toast.error(t("studentEmailUnavailableToast") || "No email found to copy");
      return;
    }
    navigator.clipboard.writeText(userEmail);
    toast.success(t("emailCopiedToast") || "Email copied to clipboard!");
  }
 
  // Fetch all page data in one go
  const fetchPageData = useCallback(async ({ showLoader = true } = {}) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      setError(null);

      const result = await loadLecturePage(lectureId);
      console.log("[DEBUG] loadLecturePage result:", result);

      if (result.success) {
        const pageData = normalizeLecturePageData(result, lectureId)
        const { lecture, attachments, accessData, assessments, homeworks, user } = pageData

        // 1. Set Lecture & User Info
        setLecture(lecture);
        const normalizedUser = user || {}
        setUserRole(normalizedUser.role || "");
        setUserId(normalizedUser.id || "");
        setUserEmail(normalizedUser.email || "");
        setStudentFullName(normalizedUser.name || normalizedUser.fullName || "");
        setStudentSequenceId(normalizedUser.sequenceId || normalizedUser.studentId || "");

        // 2. Set Attachments
        setAttachments(attachments);
        setAllAttachments(pageData.allAttachments);

        // 3. Set Access & Views (Student Only)
        if (normalizedUser.role === "Student") {
          if (accessData) {
            setStudentLectureAccessId(accessData._id);
            setRemainingViews(accessData.remainingViews);
            if (accessData.remainingViews <= 0) {
              setVideoBlocked(true);
              redirectTimeoutRef.current = setTimeout(() => navigate(-1), 180000);
            }
          }
          setAccessDataLoaded(true);
          accessResolvedForLectureRef.current = lectureId;
        }
        setAssessments(assessments)

        // 4. Set Homeworks (Privileged)
        setHomeworks(homeworks);
      } else {
        setError(translateErrorMessage(result.error || t("failedToLoadLecture"), t));
      }
    } catch (err) {
      const detail = err?.message || String(err || "")
      setError(
        detail
          ? `${t("failedToLoadLectureTryAgain")} (${detail})`
          : t("failedToLoadLectureTryAgain")
      );
      console.error("Error loading page data:", err);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, [lectureId, navigate, t]);

  useEffect(() => {
    if (lectureId) {
      fetchPageData();
    }
  }, [lectureId, fetchPageData]);

  const debouncedRecheck = useCallback(async () => {
    setVerificationLoading(true);
    
    const syncResult = await recheckAssessmentAccess(lectureId);
    
    const resultData = syncResult.data || {}
    const recheckExamPassed = !resultData.requiresExam || resultData.results?.exam?.passed === true
    const recheckHomeworkPassed = !resultData.requiresHomework || resultData.results?.homework?.passed === true

    if (syncResult.success && resultData.hasAccess === true && recheckExamPassed && recheckHomeworkPassed) {
      toast.success(t("accessGranted") || "Access granted!");
    } else if (syncResult.success) {
      const showAssessmentToast = (assessmentType, assessmentResult) => {
        if (!assessmentResult || assessmentResult.passed === true) return false

        if (assessmentResult.error) {
          toast.error(assessmentResult.error || t("assessmentSyncFailed", "Could not sync this assessment. Please try again."))
          return true
        }

        if (assessmentResult.status === "not_found" || assessmentResult.status === "pending") {
          toast.error(
            assessmentType === "homework"
              ? t("homeworkNotFound") || "Homework submission not found."
              : t("examNotFound") || "Exam submission not found. Make sure you submitted the exam using your account email."
          )
          return true
        }

        if (assessmentResult.status === "failed" || assessmentResult.passed === false) {
          const messageKey = assessmentType === "homework" ? "homeworkFailed" : "examFailed"
          toast.error(t(messageKey, {
            score: formatAssessmentValue(assessmentResult.score, t),
            maxScore: formatAssessmentValue(assessmentResult.maxScore, t),
            requiredScore: formatAssessmentValue(assessmentResult.requiredScore, t),
          }))
          return true
        }

        return false
      }

      const showedExamToast = resultData.requiresExam
        ? showAssessmentToast("exam", resultData.results?.exam)
        : false
      const showedHomeworkToast = resultData.requiresHomework
        ? showAssessmentToast("homework", resultData.results?.homework)
        : false

      if (!showedExamToast && !showedHomeworkToast) {
        toast.error(t("recheckFailed") || "Failed to recheck access");
      }
    } else {
      toast.error(syncResult.error || t("recheckFailed") || "Failed to recheck access");
    }
    
    await fetchPageData({ showLoader: false });
    setVerificationLoading(false);
  }, [lectureId, fetchPageData, t]);

  // Remove old fetchUserData, fetchLecture, fetchAttachments, fetchHomeworks, and verifyExamAndCheckAccess useEffects.
  // Keep only the view sync, upload, and video player logic.

    useEffect(() => {
      setUploadingFiles([]);
      setUploadError(null);
      setUploadSuccess(false);
    }, []);

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
            const message = t("exitWarningMessage")
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
        !accessDataLoaded ||
        !studentLectureAccessId
      )
        return

      setIsPlaying(true)

      try {
        hasViewedRef.current = true

        const updateViewState = (accessPayload) => {
          const nextViews = accessPayload?.access?.remainingViews
          setViewSyncStatus(null)

          if (typeof nextViews === "number") {
            setRemainingViews(nextViews)

            if (nextViews <= 0) {
              setVideoBlocked(true)
              playerRef.current?.pause()
              alert(t("noMoreViewsAlert"))
              redirectTimeoutRef.current = setTimeout(() => navigate(-1), 180000)
            }
          }

          pendingViewEventIdRef.current = null
        }

        const scheduleRetry = (eventId, attempt = 1) => {
          if (attempt > 3) {
            setViewSyncStatus(t("viewUpdateError"))
            setError(t("viewUpdateError"))
            return
          }

          const retryDelay = Math.min(1200 * 2 ** (attempt - 1), 10000)
          setViewSyncStatus(
            t("viewSyncRetrying", {
              defaultValue: "Syncing play progress...",
              attempt,
            })
          )
          if (viewSyncRetryTimeoutRef.current) {
            clearTimeout(viewSyncRetryTimeoutRef.current)
          }

          viewSyncRetryTimeoutRef.current = setTimeout(async () => {
            const retryResponse = await accountStudentLecturePlayStart(
              studentLectureAccessId,
              eventId,
              purchaseId,
            )

            if (retryResponse.success) {
              updateViewState(retryResponse.data)
              return
            }

            scheduleRetry(eventId, attempt + 1)
          }, retryDelay)
        }

        const generatedEventId =
          pendingViewEventIdRef.current ||
          `${lectureId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

        pendingViewEventIdRef.current = generatedEventId

        const response = await accountStudentLecturePlayStart(
          studentLectureAccessId,
          generatedEventId,
          purchaseId,
        )

        if (response.success) {
          updateViewState(response.data)
        } else {
          scheduleRetry(generatedEventId, 1)
        }
      } catch (error) {
        console.error("View update error:", error)
        setViewSyncStatus(t("viewUpdateError"))
        setError(t("viewUpdateError"))
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

    const getFullscreenElement = () =>
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement ||
      null

    const handleFullscreenChange = () => {
      const player = playerRef.current
      if (!player) return

      setIsFullscreen(getFullscreenElement() !== null)
    }

    // Custom controls handlers
    const handlePlayerPromiseError = (error) => {
      const message = String(error?.message || error || "").toLowerCase()
      if (message.includes("provider destroyed")) return
      console.error("Vidstack player action failed:", error)
    }

    const togglePlay = () => {
      const player = playerRef.current
      if (!player) return

      if (player.paused) {
        Promise.resolve(player.play()).catch(handlePlayerPromiseError)
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
      const container = videoContainerRef.current
      if (!container) return

      if (!getFullscreenElement()) {
        const requestFullscreen =
          container.requestFullscreen ||
          container.webkitRequestFullscreen ||
          container.msRequestFullscreen
        if (typeof requestFullscreen !== "function") return

        Promise.resolve(requestFullscreen.call(container)).catch((err) => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`)
        })
      } else {
        const exitFullscreen =
          document.exitFullscreen ||
          document.webkitExitFullscreen ||
          document.msExitFullscreen
        if (typeof exitFullscreen !== "function") return

        Promise.resolve(exitFullscreen.call(document)).catch((err) => {
          console.error(`Error attempting to exit fullscreen: ${err.message}`)
        })
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
            type: DEFAULT_LECTURE_ATTACHMENT_TYPE,
            attachment: file,
          };

          await createLectureAttachment(lectureId, attachmentData);
        }

        // Refresh attachments after successful upload
        const result = await getLectureAttachments(lectureId);
        if (result.status === "success") {
          setAttachments(result.data);
          setAllAttachments(flattenLectureAttachments(result.data));
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

      if (homeworkSubmitType === "form" && !resolvedHomeworkFormUrl) {
        setHomeworkError(t("noFormLinkAvailable"));
        return;
      }

      if (homeworkSubmitType === "form") {
        // Open the Google Form in a new tab
        window.open(resolvedHomeworkFormUrl, "_blank");
        return;
      }

      setIsSubmittingHomework(true);
      setHomeworkError(null);

      try {
        await uploadLectureHomeworkFiles({
          lectureId,
          files: homeworkFiles,
          uploadHomework,
        })

        await fetchPageData()

        toast.success(t("homeworkUploadSuccess"));

        setHomeworkFiles([]);
        setHomeworkSuccess(true);
        if (homeworkFileInputRef.current) {
          homeworkFileInputRef.current.value = "";
        }
      } catch (err) {
        console.error("Error uploading homework:", err);
        const translatedError = translateErrorMessage(err.message, t);
        setHomeworkError(`${t("homeworkUploadFailed")}: ${translatedError}`);

        toast.error(`${t("homeworkUploadFailed")}: ${translatedError}`);
      } finally {
        setIsSubmittingHomework(false);
      }
    };

    // Handle taking the exam
    const handleTakeExam = () => {
      if (resolvedExamFormUrl) {
        window.open(resolvedExamFormUrl, "_blank");
      }
    };

    // Cleanup
    useEffect(() => {
      return () => {
        if (redirectTimeoutRef.current) {
          clearTimeout(redirectTimeoutRef.current);
        }

        if (viewSyncRetryTimeoutRef.current) {
          clearTimeout(viewSyncRetryTimeoutRef.current)
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
            throw new Error(translateErrorMessage("No file path available"));
          }
        } catch (fallbackErr) {
          console.error("Fallback download failed:", fallbackErr);
          setError(`${t("downloadFailure")}: ${translateErrorMessage(err.message, t)}`);
        }
      } finally {
        setIsDownloading(false);
      }
    };

    const isVideoEffectivelyBlocked =
      userRole === "Student" &&
      (videoBlocked || (remainingViews !== null && remainingViews <= 0));

    // Check if content should be blocked due to exam requirements
    const isContentBlocked = userRole === "Student" && 
      ((assessments.exam.required && !assessments.exam.verified) || 
       (assessments.homework.required && !assessments.homework.verified));

    if (loading || verificationLoading) {
      return (
          <div
            className="flex min-h-screen items-center justify-center px-4 py-10"
            dir={isRTL ? "rtl" : "ltr"}
            style={{ background: pageBackground }}
          >
            <div className="w-full max-w-xl p-8 text-center" style={shellStyle}>
              <div
                className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent"
                style={{ borderColor: TOKENS.deepTeal, borderTopColor: "transparent" }}
              />
              <h2 className="text-2xl font-black" style={{ color: TOKENS.deepTeal }}>
                {t("loadingLecture", "Loading lecture")}
              </h2>
              <p className="mt-2 text-sm" style={{ color: TOKENS.slateText }}>
                {t("pleaseWait", "Please wait while the lecture details are prepared.")}
              </p>
            </div>
          </div>
      );
    }

    if (error) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4" style={{ background: pageBackground }}>
          <div className="w-full max-w-xl p-6" style={shellStyle}>
            <div
              className="flex items-center gap-3 rounded-2xl p-4"
              style={{ background: TOKENS.successLight.replace("22,163,74", "220,38,38"), border: `1px solid rgba(220,38,38,0.2)`, color: TOKENS.error }}
            >
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
            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.location.reload()}
                style={{ background: GRADIENTS.cta, color: "#F8FCFF", borderRadius: RADIUS.chip }}
              >
                {t("retry", "Retry")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(-1)}
                className="rounded-full"
                style={{ borderRadius: RADIUS.chip, borderColor: TOKENS.deepTeal, color: TOKENS.deepTeal }}
              >
                {t("back", "Back")}
              </Button>
            </div>
          </div>
        </div>
      );

    }

    const showViewSyncBanner =
      userRole === "Student" && viewSyncStatus && !videoBlocked;

    // Render requirements gate for students when lecture access is still restricted.
    if (isContentBlocked) {
      const requirementCards = [
        assessments.exam.required && {
          key: "exam", title: t("examInfo"), subtitle: t("examRequiredDescription"),
          passed: assessments.exam.verified,
          status: assessments.exam.status,
          threshold: assessments.exam.requiredScore ?? assessments.exam.data?.requiredScore ?? assessments.exam.data?.passingThreshold,
          score: assessments.exam.score,
          maxScore: assessments.exam.maxScore,
          error: assessments.exam.error,
          actionUrl: resolvedExamFormUrl, actionLabel: t("startExam"),
        },
        assessments.homework.required && {
          key: "homework", title: t("homeworkInfo", "Homework Information"),
          subtitle: t("homeworkRequiredDescription", "Complete homework to access this lecture."),
          passed: assessments.homework.verified,
          status: assessments.homework.status,
          threshold: assessments.homework.requiredScore ?? assessments.homework.data?.requiredScore ?? assessments.homework.data?.passingThreshold,
          score: assessments.homework.score,
          maxScore: assessments.homework.maxScore,
          error: assessments.homework.error,
          actionUrl: resolvedHomeworkFormUrl, actionLabel: t("startHomework", "Start Homework"),
        },
      ].filter(Boolean);
 
      return (
        <div className="min-h-screen px-3 py-4 sm:px-4 sm:py-6" dir={isRTL ? "rtl" : "ltr"} style={{ background: pageBackground }}>
          <div className="mx-auto w-full max-w-6xl space-y-5">
            <section className="p-5 md:p-7" style={shellStyle}>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 text-xs font-bold" style={chipStyle}>
                      {t("lectureDisplay", "Lecture Display")}
                    </span>
                    <span className="px-3 py-1 text-xs font-bold" style={{ ...chipStyle, background: "rgba(243,154,63,0.18)", color: TOKENS.inkText }}>
                      {t("accessLockedTitle", "Lecture Access Is Locked")}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-black leading-tight md:text-5xl" style={{ color: TOKENS.deepTeal }}>
                      {lecture?.name || t("loadingLecture")}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm md:text-base" style={{ color: TOKENS.slateText }}>
                      {t(
                        "accessLockedDescription",
                        "Complete all required exam/homework items to unlock this lecture.",
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(-1)}
                    className="rounded-full"
                    style={{ borderRadius: RADIUS.chip, borderColor: TOKENS.deepTeal, color: TOKENS.deepTeal }}
                  >
                    {t("back")}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={debouncedRecheck}
                    isDisabled={verificationLoading}
                    className="rounded-full"
                    style={{ background: GRADIENTS.cta, color: "#F8FCFF", borderRadius: RADIUS.chip }}
                  >
                    {verificationLoading ? t("loading") : t("recheckAccess", "Recheck Access")}
                  </Button>
                </div>
              </div>
            </section>
            {showViewSyncBanner && (
              <div className="rounded-2xl px-4 py-3 text-sm shadow-sm" style={{ ...softCardStyle, color: TOKENS.deepTeal }}>
                {viewSyncStatus}
              </div>
            )}
            <div className="p-5 md:p-6" style={shellStyle}>
             <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
               <div className="flex items-center gap-3">
                 <div
                   className="flex h-11 w-11 items-center justify-center rounded-2xl"
                   style={{ background: "rgba(243,154,63,0.18)", color: TOKENS.warmMango }}
                 >
                   <FiAlertTriangle className="h-5 w-5" />
                 </div>
                  <div>
                    <h2 className="text-xl font-extrabold md:text-2xl" style={{ color: TOKENS.deepTeal }}>
                      {t("accessLockedTitle", "Lecture Access Is Locked")}
                    </h2>
                    <p className="text-sm" style={{ color: TOKENS.slateText }}>
                      {t(
                        "accessLockedDescription",
                        "Complete all required exam/homework items to unlock this lecture.",
                     )}
                   </p>
                 </div>
               </div>
             </div>
 
            <div className="grid gap-4 md:grid-cols-2">
{requirementCards.map((item) => (
                <div
                  key={item.key}
                   className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm"
                   style={{ border: `1px solid ${TOKENS.borderSubtle}` }}
                >
                     <div className="mb-2 flex items-start justify-between gap-3">
                       <h3 className="text-lg font-bold text-neutral">{item.title}</h3>
                       <Badge variant={getAssessmentBadgeVariant(item)}>
                          {getAssessmentStatusLabel(item, t)}
                        </Badge>
                      </div>
  
                   <p className="mb-3 text-sm text-neutral/70">{item.subtitle}</p>
  
                    {item.threshold !== undefined && item.threshold !== null && (
                      <p className="mb-3 text-sm font-medium text-neutral">
                        {t("requiredPassingScore")}: {item.threshold}
                      </p>
                    )}
                    {(item.score !== undefined && item.score !== null) || (item.maxScore !== undefined && item.maxScore !== null) ? (
                      <p className="mb-3 text-sm font-medium text-neutral">
                        {t("score")}: {formatAssessmentValue(item.score, t)}/{formatAssessmentValue(item.maxScore, t)}
                      </p>
                    ) : null}
                    {item.error && (
                      <p className="mb-3 rounded-xl bg-error/10 px-3 py-2 text-sm font-medium text-error">
                        {t("assessmentSyncFailed", "Could not sync this assessment. Please try again.")}: {item.error}
                      </p>
                    )}
  
<div className="mt-2 flex flex-wrap gap-2">
                       {!item.passed && item.actionUrl && (
                          <div className="w-full mb-4 p-4 rounded-xl flex flex-col gap-3 shadow-sm" style={{ background: "rgba(243,154,63,0.14)" }}>
                           <div className="flex items-center gap-2 text-[#92400E]">
                             <FiAlertTriangle className="h-5 w-5 shrink-0" />
                             <p className="text-sm md:text-base font-bold">
                               {t("useAccountEmail")}
                             </p>
                           </div>
                           <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-3 sm:p-2 rounded-lg">
                             <code className="text-sm md:text-base font-mono break-all px-2">
                               {userEmail}
                             </code>
                             <Button 
                               variant="warning" 
                               size="sm" 
                               onClick={handleCopyEmail}
                               className="shrink-0 w-full sm:w-auto"
                             >
                               <FiCopy className="mr-1" /> {t("copyEmail")}
                             </Button>
                           </div>
                            </div>
                         )}
                       {!item.passed && item.actionUrl && (
                         <Button
                           variant="primary"
                           size="sm"
                           onClick={() => window.open(item.actionUrl, "_blank")}
                         >
                           <FiExternalLink className={isRTL ? "ml-1" : "mr-1"} />
                           {item.actionLabel}
                         </Button>
                       )}
  
                      {item.passed && (
                        <Badge variant="success" outline>
                          {t("completed", "Completed")}
                        </Badge>
                      )}
                    </div>

                </div>
              ))}
            </div>
 
            <div className="mt-4 rounded-2xl bg-info/10 px-4 py-3 text-sm text-neutral/80">
              {t(
                "accessVerificationHint",
                "After submitting, wait a moment for sync, then click Recheck Access.",
              )}
            </div>
          </div>
        </div>
      </div>
      );
    }

    // Function to get appropriate icon based on file type
    const getFileIcon = (fileType) => {
      if (!fileType) return <FiFile className="text-primary text-base sm:text-xl" />;

      const type = fileType.toLowerCase();
      if (type.includes("pdf")) {
        return <FiFile className="text-red-500 text-base sm:text-xl" />;
      } else if (
        type.includes("image") ||
        type.includes("png") ||
        type.includes("jpg") ||
        type.includes("jpeg")
      ) {
        return <FiFile className="text-green-500 text-base sm:text-xl" />;
      } else if (type.includes("video")) {
        return <FiFile className="text-blue-500 text-base sm:text-xl" />;
      } else if (type.includes("audio")) {
        return <FiFile className="text-purple-500 text-base sm:text-xl" />;
      } else {
        return <FiFile className="text-primary text-base sm:text-xl" />;
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

    const metaCards = [
      { label: t("subject", "Subject"), value: lecture?.subject?.name || t("notSpecified") },
      { label: t("level", "Level"), value: lecture?.level?.name || t("notSpecified") },
      { label: t("lecturer", "Lecturer"), value: lecture?.createdBy?.name || lecture?.lecturer?.name || t("unknown") },
      { label: t("attachments", "Attachments"), value: `${allAttachments.length}` },
    ];
    const progressStatusLabel =
      progress < 25
        ? t("justStarted")
        : progress < 50
          ? t("almostHalfway")
          : progress < 75
            ? t("goodProgress")
            : progress < 95
              ? t("almostDone")
              : t("completed");
    const summaryBadges = [
      lecture?.subject?.name,
      lecture?.level?.name,
      userRole && userRole !== "Student" ? t("viewingAs", { role: userRole }) : null,
      resolvedExamFormUrl || resolvedHomeworkFormUrl ? t("googleForms", "Google Forms") : null,
    ].filter(Boolean);

    return (
      <div className="min-h-screen px-3 py-4 sm:px-4 sm:py-6" dir={isRTL ? "rtl" : "ltr"} style={{ background: pageBackground }}>
        <div className="mx-auto w-full max-w-6xl space-y-4 sm:space-y-5">
          <section className="relative overflow-hidden p-4 sm:p-5 md:p-7" style={shellStyle}>
            <div
              className="absolute inset-x-0 top-0 h-20 opacity-80 sm:h-28"
              style={{ background: "linear-gradient(180deg, rgba(188,231,236,0.55) 0%, rgba(188,231,236,0) 100%)" }}
            />
            <div className="relative flex flex-col gap-4 sm:gap-5 md:gap-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-3 sm:space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 text-xs font-bold" style={chipStyle}>
                      {t("lectureDisplay", "Lecture Display")}
                    </span>
                    {summaryBadges.map((item) => (
                      <span
                        key={item}
                        className="px-3 py-1 text-xs font-bold"
                        style={{ ...chipStyle, background: "rgba(255,255,255,0.75)", color: TOKENS.slateText }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  <div>
                    <h1 className="text-2xl font-black leading-tight sm:text-3xl md:text-5xl" style={{ color: TOKENS.deepTeal }}>
                      {lecture?.name || t("loadingLecture")}
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm leading-6 md:mt-3 md:text-base" style={{ color: TOKENS.slateText }}>
                      {lecture?.description || t("lectureDisplayDescription", "A refreshed lecture workspace built on the shared design system.")}
                    </p>
                  </div>
                </div>
                <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end sm:gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(-1)}
                    className="w-full justify-center rounded-full sm:w-auto"
                    style={{ borderRadius: RADIUS.chip, borderColor: TOKENS.deepTeal, color: TOKENS.deepTeal }}
                  >
                    {t("back")}
                  </Button>
                  {canEditLecture && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleEditLecture}
                      className="w-full justify-center rounded-full sm:w-auto"
                      style={{ background: GRADIENTS.cta, color: "#F8FCFF", borderRadius: RADIUS.chip, boxShadow: SHADOWS.level1 }}
                    >
                      <FiEdit className={isRTL ? "ml-2" : "mr-2"} />
                      {t("edit")}
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
                {metaCards.map((item) => (
                  <div key={item.label} className="min-w-0 p-3 sm:p-4" style={softCardStyle}>
                    <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] sm:text-xs sm:tracking-[0.16em]" style={{ color: TOKENS.slateText }}>
                      {item.label}
                    </p>
                    <p className="mt-1.5 text-base font-black leading-snug break-words sm:mt-2 sm:text-lg" style={{ color: TOKENS.deepTeal }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-center">
                <div
                  className="w-full max-w-full rounded-full p-1 sm:w-auto"
                  style={{ background: "rgba(17,24,39,0.06)", border: `1px solid ${TOKENS.borderSubtle}` }}
                >
                  <Tabs
                    tabs={[
                      { id: 'video', label: t("viewLecture", "View Lecture") },
                      { id: 'community', label: t("community", "Community") }
                    ]}
                    activeIndex={activeMainTab === 'video' ? 0 : 1}
                    onChange={(index) => setActiveMainTab(index === 0 ? 'video' : 'community')}
                  />
                </div>
              </div>
            </div>
          </section>

          {userRole && userRole !== "Student" && (
            <div className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm shadow-sm" style={{ ...softCardStyle, color: TOKENS.deepTeal }}>
              <FiEye className="h-5 w-5" />
              <span>{t("viewingAs", { role: userRole })}</span>
            </div>
          )}

          {activeMainTab === 'community' ? (
            <section className="p-4 md:p-5" style={shellStyle}>
              <CommunityTab 
                  lectureId={lectureId} 
                  userId={userId} 
                  userRole={userRole} 
              />
            </section>
          ) : (
            <>
  
        {userRole === "Student" && (assessments.exam.required || assessments.homework.required) && (
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            {assessments.exam.required && (
              <div className="p-4" style={{ ...softCardStyle, background: "rgba(22,163,74,0.08)", border: `1px solid ${TOKENS.successBorder}` }}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-neutral">
                    <FiAward className="h-5 w-5 text-success" />
                    {t("examInfo")}
                  </div>
                  <Badge variant={getAssessmentBadgeVariant(assessments.exam)}>
                    {getAssessmentStatusLabel(assessments.exam, t)}
                  </Badge>
                </div>
                {hasAssessmentScore(assessments.exam) && (
                  <div className="text-sm text-neutral/80">
                    <span>{t("score")}: {formatAssessmentValue(getAssessmentScore(assessments.exam).score, t)}/{formatAssessmentValue(getAssessmentScore(assessments.exam).maxScore, t)}</span>
                    <span className="mx-2">|</span>
                    <span>{t("passDate")}: {formatDate(assessments.exam.submission?.verifiedAt)}</span>
                  </div>
                )}
                {assessments.exam.error && (
                  <div className="mt-2 text-sm font-medium text-error">
                    {t("assessmentSyncFailed", "Could not sync this assessment. Please try again.")}: {assessments.exam.error}
                  </div>
                )}
              </div>
            )}
            {assessments.homework.required && (
              <div className="p-4" style={{ ...softCardStyle, background: "rgba(77,179,194,0.12)", border: `1px solid rgba(77,179,194,0.24)` }}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-neutral">
                    <FiCheck className="h-5 w-5 text-info" />
                    {t("homeworkInfo", "Homework Information")}
                  </div>
                  <Badge variant={getAssessmentBadgeVariant(assessments.homework)}>
                    {getAssessmentStatusLabel(assessments.homework, t)}
                  </Badge>
                </div>
                {hasAssessmentScore(assessments.homework) && (
                  <div className="text-sm text-neutral/80">
                    <span>{t("score")}: {formatAssessmentValue(getAssessmentScore(assessments.homework).score, t)}/{formatAssessmentValue(getAssessmentScore(assessments.homework).maxScore, t)}</span>
                    <span className="mx-2">|</span>
                    <span>{t("passDate")}: {formatDate(assessments.homework.submission?.verifiedAt)}</span>
                  </div>
                )}
                {assessments.homework.error && (
                  <div className="mt-2 text-sm font-medium text-error">
                    {t("assessmentSyncFailed", "Could not sync this assessment. Please try again.")}: {assessments.homework.error}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
  
        {showFiftyPercentWarning && !isVideoEffectivelyBlocked && (
          <div className="mb-3 flex items-center gap-3 px-4 py-3 text-sm shadow-md" style={{ ...softCardStyle, background: "rgba(243,154,63,0.14)", border: "1px solid rgba(243,154,63,0.28)", color: "#92400E" }}>
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
          <div className="mb-3 flex items-center gap-3 px-4 py-3 text-sm shadow-md" style={{ ...softCardStyle, background: "rgba(243,154,63,0.14)", border: "1px solid rgba(243,154,63,0.28)", color: "#92400E" }}>
            <div>
              <FiAlertTriangle className="stroke-current shrink-0 h-6 w-6" />
              <span>
                {t("exitWarningMessage")}
              </span>
            </div>
          </div>
        )}
   
        {isVideoEffectivelyBlocked ? (
          <div className="mb-4 flex items-center gap-3 px-4 py-3 text-sm shadow-md" style={{ ...softCardStyle, background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.22)", color: "#991B1B" }}>
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

          <div
            className="lecture-player-card relative mb-4 overflow-hidden"
            ref={videoContainerRef}
            style={{ ...shellStyle, background: "rgba(255,255,255,0.78)" }}
          >
            <div className="lecture-player-frame relative mx-auto w-full">
              <MediaPlayer
                ref={playerRef}
                className="h-full w-full"
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
              </MediaPlayer>
              {userRole === "Student" && studentFullName && (
                <div className="lecture-video-watermark" aria-hidden="true">
                  <div className="lecture-video-watermark__content">
                    <span className="lecture-video-watermark__name">{studentFullName}</span>
                    {studentSequenceId && (
                      <span className="lecture-video-watermark__id">{studentSequenceId}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced custom progress bar */}
            <div className="p-4" dir="ltr" style={{ background: "rgba(241,243,246,0.75)", borderTop: `1px solid ${TOKENS.borderSubtle}` }}>
              <div className="flex flex-col space-y-2">
                {/* Video info */}
                 <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                   <div className="flex items-center gap-2">
                      <FiClock style={{ color: TOKENS.deepTeal }} />
                      <span className="text-sm font-medium" style={{ color: TOKENS.inkText }}>
                       {formatTime(currentTime)} / {formatTime(duration)}
                     </span>
                   </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Playback rate selector */}
                      <div className="relative group">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="rounded-full"
                          style={{ borderRadius: RADIUS.chip, color: TOKENS.deepTeal }}
                        >
                          {playbackRate}x
                        </Button>
                        <div className="absolute bottom-full right-0 z-[1] mb-2 hidden w-32 rounded-xl bg-white p-2 shadow-lg group-hover:block" style={{ border: `1px solid ${TOKENS.borderSubtle}` }}>
                          <div className="flex flex-col gap-1">
                            {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                              <button 
                                key={rate} 
                                className="text-left px-3 py-2 text-sm rounded-lg transition-colors"
                                style={playbackRate === rate ? { background: TOKENS.deepTeal, color: "#F8FCFF" } : { color: TOKENS.inkText }}
                                onClick={() => changePlaybackRate(rate)}
                              >
                                {rate}x
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>



                     {/* Volume control */}
                     <div className="flex items-center gap-2">
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         className={`rounded-full ${isRTL ? "rotate-180" : ""}`} 
                         onClick={toggleMute}
                       >
                         {isMuted ? <FiVolumeX /> : <FiVolume2 />}
                       </Button>
                           <input
                             type="range"
                             min="0"
                             max="100"
                             value={isMuted ? 0 : volume}
                             onChange={(e) => changeVolume(Number.parseInt(e.target.value))}
                            className="w-20 cursor-pointer sm:w-24"
                            style={{ accentColor: TOKENS.deepTeal }}
                           />
                     </div>


                     {/* Fullscreen toggle */}
                     <Button 
                       variant="ghost" 
                       size="sm" 
                       onClick={toggleFullscreen}
                     >
                       {isFullscreen ? <FiMinimize /> : <FiMaximize />}
                     </Button>

                  </div>
                </div>

                {/* Progress bar container */}
                <div
                    className="relative w-full h-4 cursor-pointer overflow-hidden rounded-full group"
                    style={{ background: "rgba(17,24,39,0.14)" }}
                  ref={progressBarRef}
                  onClick={handleProgressBarClick}
                >
                  {/* Buffered progress */}
                  <div
                    className="absolute top-0 left-0 h-full opacity-50 transition-all duration-300"
                    style={{ width: `${buffered}%`, background: "rgba(14,85,99,0.32)" }}
                    ></div>

                  {/* Actual progress */}
                  <div
                    className="absolute top-0 left-0 h-full transition-all duration-300 ease-in-out"
                    style={{ width: `${progress}%`, background: GRADIENTS.cta }}
                  ></div>

                  {/* Hover effect */}
                  <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-20 bg-white"></div>

                  {/* Thumb indicator */}
                  <div
                    className="absolute top-0 h-full aspect-square transform -translate-x-1/2 rounded-full border-2 border-white opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ left: `${progress}%`, background: TOKENS.deepTeal }}
                  ></div>
                </div>

                {/* Play/Pause button centered over video */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="w-16 h-16 rounded-full bg-primary/70 hover:bg-primary/90 text-white flex items-center justify-center transition-all duration-200 shadow-lg"
                      onClick={togglePlay}
                    >
                      {isPlaying ? <FiPause className="text-2xl" /> : <FiPlay className="text-2xl" />}
                    </button>
                </div>
              </div>
            </div>

            {/* Video stats and info */}
              <div className="rounded-b-lg p-4" dir="ltr" style={{ background: "rgba(241,243,246,0.92)", borderTop: `1px solid ${TOKENS.borderSubtle}` }}>
              <div className="flex flex-wrap justify-between items-center">
                 <div className="flex items-center gap-2">
                   <Badge variant="primary">
                     {t("totalDuration")} : {formatTime(duration)}
                   </Badge>
                   { (userRole === "Student" || userRole === "Parent") && (
                      <Badge variant="secondary">
                        {t("remainingViews")}: {remainingViews === null ? t("loading") : remainingViews}
                      </Badge>
                    )}
                 </div>


                 <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                    <Badge outline>{progressStatusLabel}</Badge>


                   {progress > 0 && progress < 100 && (
                     <Badge variant="info">
                       {Math.round(progress)}% {t("completed")}
                     </Badge>
                   )}

                </div>
              </div>
            </div>
          </div>
          ) : lecture?.videoLink ? (
            <div className="mb-4 flex items-center gap-3 px-4 py-3 text-sm shadow-md" style={{ ...softCardStyle, background: "rgba(243,154,63,0.14)", border: "1px solid rgba(243,154,63,0.28)", color: "#92400E" }}>
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
            <div className="mb-4 flex items-center gap-3 px-4 py-3 text-sm shadow-md" style={{ ...softCardStyle, background: "rgba(243,154,63,0.14)", border: "1px solid rgba(243,154,63,0.28)", color: "#92400E" }}>
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

          {(resolvedExamFormUrl || resolvedHomeworkFormUrl) && (
            <Card
              className="mb-4"
              title={t("googleForms", "Google Forms")}
              style={shellStyle}
            >
              <div className="grid gap-3 md:grid-cols-2">
                {resolvedExamFormUrl && (
                  <div className="p-4" style={softCardStyle}>
                    <h3 className="mb-1 text-base font-semibold" style={{ color: TOKENS.deepTeal }}>{t("examInfo")}</h3>
                    <p className="mb-3 text-sm" style={{ color: TOKENS.slateText }}>
                      {t("openExamGoogleForm", "Open the exam Google Form for this lecture.")}
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full sm:w-auto"
                      style={{ background: GRADIENTS.cta, color: "#F8FCFF", borderRadius: RADIUS.chip }}
                      onClick={handleTakeExam}
                    >
                      <FiExternalLink className={isRTL ? "ml-1" : "mr-1"} />
                      {t("openExamForm", "Open Exam Form")}
                    </Button>
                  </div>
                )}
                {resolvedHomeworkFormUrl && (
                  <div className="p-4" style={softCardStyle}>
                    <h3 className="mb-1 text-base font-semibold" style={{ color: TOKENS.deepTeal }}>{t("homeworkInfo", "Homework Information")}</h3>
                    <p className="mb-3 text-sm" style={{ color: TOKENS.slateText }}>
                      {t("openHomeworkGoogleForm", "Open the homework Google Form for this lecture.")}
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full sm:w-auto"
                      style={{ background: GRADIENTS.cta, color: "#F8FCFF", borderRadius: RADIUS.chip }}
                      onClick={() => window.open(resolvedHomeworkFormUrl, "_blank")}
                    >
                      <FiExternalLink className={isRTL ? "ml-1" : "mr-1"} />
                      {t("openHomeworkForm", "Open Homework Form")}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}

<Card
            className="mb-4"
            title={t("attachments", "Attachments")}
          >
{allAttachments.length > 0 ? (
              <div className="grid grid-cols-1 gap-2 sm:gap-3">
                {allAttachments.map((attachment, index) => (
                  <Card
                    key={attachment._id || `${attachment.fileName || "attachment"}-${index}`}
                    className="transition-all duration-300"
                    style={{ ...softCardStyle, border: "none" }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 justify-between">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="mt-0.5">
                          {getFileIcon(attachment.fileType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="mb-1 text-sm sm:text-lg font-bold break-words" style={{ color: TOKENS.deepTeal }}>
                            {attachment.fileName || t("fileWithoutName")}
                          </h3>
                          <div className="text-xs sm:text-sm" style={{ color: TOKENS.slateText }}>
                            <p>
                              {t("type", "Type")}: {attachment.fileType || t("notSpecified")}
                            </p>
                            <p>
                              {t("uploadedOn", "Uploaded on")}: {formatDate(attachment.createdAt || attachment.uploadedOn)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2 sm:mt-0 justify-end">
                        {attachment.filePath && (
                          <Button
                            variant="outline"
                            size="xs"
                            className="rounded-full"
                            style={{ borderRadius: RADIUS.chip, borderColor: TOKENS.deepTeal, color: TOKENS.deepTeal }}
                            onClick={() => window.open(attachment.filePath, "_blank")}
                          >
                            <FiEye className="w-3 h-3 sm:mr-1" />
                            <span className="hidden sm:inline">{t("view")}</span>
                          </Button>
                        )}
                        <Button
                          variant="primary"
                          size="xs"
                          className="rounded-full"
                          style={{ background: GRADIENTS.cta, color: "#F8FCFF", borderRadius: RADIUS.chip }}
                          onClick={() => handleDownload(attachment)}
                          isDisabled={isDownloading}
                        >
                          <FiDownload className="w-3 h-3 sm:mr-1" />
                          <span className="hidden sm:inline">{t("download", "Download")}</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
) : (
              <div className="rounded-xl px-4 py-6 text-sm" style={{ color: TOKENS.slateText, background: "rgba(241,243,246,0.55)" }}>
                {t("noAttachmentsAvailable", {
                  defaultValue: isRTL
                    ? "لا توجد مرفقات مرفوعة لهذه المحاضرة حتى الآن."
                    : "No uploaded attachments are available for this lecture yet.",
                })}
              </div>
            )}
          </Card>

          {userRole === "Student" && (
            <Card 
              className="mb-4"
              title={t("submitHomework")}
              style={shellStyle}
            >
              <Tabs 
                tabs={[
                    { id: 'file', label: t("uploadFile") },
                    { id: 'form', label: t("googleForm") }
                ]}
                activeIndex={homeworkSubmitType === 'file' ? 0 : 1}
                onChange={(index) => setHomeworkSubmitType(index === 0 ? 'file' : 'form')}
                className="mb-4"
              />


<div className="rounded-xl p-4" style={{ background: "rgba(241,243,246,0.45)" }}>
                {homeworkSubmitType === "file" ? (
                  <>
                    <h3 className="text-base md:text-lg font-semibold mb-2">
                      {t("uploadHomeworkFile")}
                    </h3>

                    <div className="mb-4">
                      <input
                        type="file"
                        ref={homeworkFileInputRef}
                        onChange={handleHomeworkFileSelect}
                        multiple
                        className="sr-only"
                        aria-label={t("chooseFiles")}
                      />
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => homeworkFileInputRef.current?.click()}
                          className="w-full sm:w-auto"
                        >
                          {t("chooseFiles")}
                        </Button>
                        <span className="text-sm" style={{ color: TOKENS.slateText }}>
                          {homeworkFiles.length > 0
                            ? t("selectedFilesCount", { count: homeworkFiles.length })
                            : t("noFilesSelected")}
                        </span>
                      </div>
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
                              className="flex items-center justify-between rounded-xl p-2"
                              style={{ background: "rgba(255,255,255,0.7)" }}
                            >
                              <span className="text-sm truncate max-w-[80%]">
                                {file.name}
                              </span>
                               <Button
                                 onClick={() => handleRemoveHomeworkFile(index)}
                                 variant="ghost"
                                 size="xs"
                                 className="rounded-full"
                               >
                                 <FiX />
                               </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {homeworkError && (
                        <div className="mb-4 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm shadow-sm" style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.22)", color: "#991B1B" }}>
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
                       <div className="mb-4 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm shadow-sm" style={{ background: TOKENS.successLight, border: `1px solid ${TOKENS.successBorder}`, color: "#065F46" }}>
                         <FiCheck className="stroke-current shrink-0 h-6 w-6" />
                         <span>{t("homeworkUploadSuccess")}</span>
                       </div>
                    )}

                     <Button
                       onClick={handleSubmitHomework}
                       isDisabled={
                         homeworkFiles.length === 0 || isSubmittingHomework
                       }
                       isLoading={isSubmittingHomework}
                        variant="primary"
                        className="w-full"
                        style={{ background: GRADIENTS.cta, color: "#F8FCFF", borderRadius: RADIUS.card }}
                      >
                       {isSubmittingHomework ? (
                         t("submittingHomework")
                       ) : (
                         <>
                           <FiUpload className="mr-2" />
                           {t("submitHomework")}
                         </>
                       )}
                     </Button>

                  </>
                ) : (
                  <>
                    <h3 className="text-base md:text-lg font-semibold mb-2">
                      {t("completeGoogleForm")}
                    </h3>

{resolvedHomeworkFormUrl ? (
                      <div className="mb-4">
                        <div className="mb-4 flex flex-col gap-3 rounded-xl p-4 shadow-sm" style={{ background: "rgba(243,154,63,0.14)" }}>
                          <div className="flex items-center gap-2 text-[#92400E]">
                            <FiAlertTriangle className="h-5 w-5 shrink-0" />
                            <p className="text-sm md:text-base font-bold">
                              {t("useAccountEmail")}
                            </p>
                          </div>
                           <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg bg-white p-3 sm:p-2">
                            <code className="text-sm md:text-base font-mono break-all px-2">
                              {userEmail}
                            </code>
                             <Button
                              onClick={handleCopyEmail}
                              variant="warning"
                              size="sm"
                              className="shrink-0 w-full sm:w-auto"
                              style={{ background: TOKENS.warmMango, color: "#FFF9F3", borderRadius: RADIUS.chip }}
                            >
                              <FiCopy className="mr-1" /> {t("copyEmail")}
                            </Button>
                           </div>
                        </div>
                        <p className="mb-4">
                          {t("completeGoogleFormDescription")}
                        </p>
                         <Button
                           onClick={() => {
                             window.open(resolvedHomeworkFormUrl, "_blank");
                           }}
                           variant="primary"
                           className="w-full"
                           style={{ background: GRADIENTS.cta, color: "#F8FCFF", borderRadius: RADIUS.card }}
                          >
                           <FiLink className="mr-2" />
                           {t("openGoogleForm")}
                         </Button>

                      </div>
                    ) : (
                       <div className="mb-4 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm shadow-sm" style={{ background: "rgba(243,154,63,0.14)", border: "1px solid rgba(243,154,63,0.28)", color: "#92400E" }}>
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
             </Card>
           )}

        {/* Homeworks list for authorized users */}
         {hasUploadPermission() && homeworks.length > 0 && (
           <Card 
             className="mb-4"
             title={t("studentSubmittedHomeworks")}
             style={shellStyle}
           >
               <div className="grid grid-cols-1 gap-3">
                 {homeworks.map((homework, index) => (
                   <Card 
                     key={index}
                     className="transition-all duration-300"
                     style={softCardStyle}
                   >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {getFileIcon(homework.fileType)}
                          </div>
                          <div className="flex-1">
                            <h3 className="mb-1 text-lg font-bold break-words" style={{ color: TOKENS.deepTeal }}>
                              {homework.fileName || t("fileWithoutName")}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 text-sm gap-x-4" style={{ color: TOKENS.slateText }}>
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
                                {homework.studentId?.name || t("notSpecified")}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3 sm:mt-0 justify-end">
                          {homework.filePath && (
                             <Button
                               variant="primary"
                               size="sm"
                               className="rounded-full"
                               style={{ background: GRADIENTS.cta, color: "#F8FCFF", borderRadius: RADIUS.chip }}
                               onClick={() => window.open(homework.filePath, "_blank")}
                             >
                               <FiEye className="mr-1" /> {t("view")}
                             </Button>
                          )}
                        </div>
                      </div>
                   </Card>
                 ))}
               </div>
           </Card>
         )}


        {/* File uploader for authorized users */}
         {hasUploadPermission() && (
           <Card 
             className="mb-4"
             title={t("uploadAttachments", "Upload Attachments")}
             style={shellStyle}
           >
<div className="rounded-xl p-4" style={{ background: "rgba(241,243,246,0.45)" }}>
                  <h3 className="text-lg font-semibold mb-2">
                   {t("addNewAttachments", "Add New Attachments")}
                 </h3>
                 <p className="mb-4 text-sm text-neutral/70">
                   {t(
                     "attachmentsUploadHint",
                     "Upload any files that belong to this lecture. They will appear in the unified Attachments section."
                   )}
                 </p>
  
                 <div className="mb-4">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      multiple
                      className="sr-only"
                      aria-label={t("chooseFiles")}
                    />
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full sm:w-auto"
                      >
                        {t("chooseFiles")}
                      </Button>
                      <span className="text-sm" style={{ color: TOKENS.slateText }}>
                        {uploadingFiles.length > 0
                          ? t("selectedFilesCount", { count: uploadingFiles.length })
                          : t("noFilesSelected")}
                      </span>
                    </div>
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
                           className="flex items-center justify-between rounded-xl p-2"
                           style={{ background: "rgba(255,255,255,0.7)" }}
                         >
                           <span className="text-sm truncate max-w-[80%]">
                             {file.name}
                           </span>
                           <Button 
                             variant="ghost" 
                             size="xs" 
                              className="rounded-full"
                             onClick={() => handleRemoveFile(index)}
                           >
                             <FiX />
                           </Button>
                         </li>
                       ))}
                     </ul>
                   </div>
                 )}
  
                 {uploadError && (
                    <div className="mb-4 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm shadow-sm" style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.22)", color: "#991B1B" }}>
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
                    <div className="mb-4 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm shadow-sm" style={{ background: TOKENS.successLight, border: `1px solid ${TOKENS.successBorder}`, color: "#065F46" }}>
                      <FiCheck className="stroke-current shrink-0 h-6 w-6" />
                      <span>{t("filesUploadedSuccessfully")}</span>
                    </div>
                 )}
  
                 <Button
                   onClick={handleUploadFiles}
                   isDisabled={uploadingFiles.length === 0 || isUploading}
                   isLoading={isUploading}
                   variant="primary"
                   className="w-full"
                   style={{ background: GRADIENTS.cta, color: "#F8FCFF", borderRadius: RADIUS.card }}
                 >
                   {isUploading ? (
                     t("uploading")
                   ) : (
                     <>
                       <FiUpload className="mr-2" />
                       {t("uploadFiles")}
                     </>
                   )}
                 </Button>
               </div>
           </Card>
         )}

         {/* Exit confirmation dialog */}
         <Modal 
           isOpen={showExitConfirmation} 
           onClose={handleCancelNavigation} 
           title={t("exitWarningTitle")}
           footer={
             <div className="flex justify-end gap-2">
               <Button 
                 variant="outline" 
                 onClick={handleCancelNavigation}
               >
                 {t("stayOnPage")}
               </Button>
               <Button 
                 variant="primary" 
                 onClick={handleConfirmNavigation}
               >
                 {t("leavePage")}
               </Button>
             </div>
           }
          >
            <p>
              {t("exitWarningMessage") ||
                "You haven't completed 50% of this lecture yet. Are you sure you want to leave?"}
            </p>
          </Modal>
        </>
      )}
      </div>
    </div>
    );
  };


  export default LectureDisplay;
