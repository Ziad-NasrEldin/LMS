"use client"

// Enhanced upload service with progress tracking
export const uploadFileWithProgress = async (file, endpoint, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const formData = new FormData()
    formData.append("file", file)

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100
        onProgress(percentComplete)
      }
    })

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText)
          resolve(response)
        } catch (e) {
          resolve({ success: true, url: `uploaded/${file.name}` })
        }
      } else {
        reject(new Error(`Upload failed with status: ${xhr.status}`))
      }
    })

    xhr.addEventListener("error", () => {
      reject(new Error("Upload failed due to network error"))
    })

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload was cancelled"))
    })

    xhr.open("POST", endpoint || "/api/upload")
    xhr.send(formData)
  })
}

// Simulate file upload with realistic progress
export const simulateFileUpload = async (file, onProgress) => {
  return new Promise((resolve, reject) => {
    let progress = 0
    const fileSize = file.size
    const chunkSize = Math.max(fileSize / 20, 1024) // Simulate chunks

    const interval = setInterval(
      () => {
        progress += Math.random() * 15 + 5 // Random progress between 5-20%

        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
          onProgress(100)

          // Simulate server response
          setTimeout(() => {
            resolve({
              success: true,
              url: `uploaded/${file.name}`,
              size: fileSize,
              type: file.type,
            })
          }, 200)
        } else {
          onProgress(Math.round(progress))
        }
      },
      100 + Math.random() * 200,
    ) // Variable timing for realism
  })
}