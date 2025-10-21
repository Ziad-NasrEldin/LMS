"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react'

const ProductGallery = ({ gallery = [], title, onImageClick }) => {
  const [selectedImage, setSelectedImage] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [modalImageIndex, setModalImageIndex] = useState(0)
  const { t } = useTranslation("kalimaStore-ProductDetails")

  const convertPathToUrl = (filePath) => {
    if (!filePath) return null;
    if (filePath.startsWith("http")) return filePath;

    const normalizedPath = filePath.replace(/\\/g, "/");
    const API_URL = import.meta.env.VITE_API_URL || window.location.origin;
    const baseUrl = API_URL.replace(/\/$/, "");

    return `${baseUrl}/${normalizedPath}`;
  };
  // dummy comment to re-commit
  const galleryImages = (gallery || [])
    .map((img, index) => ({
      url: convertPathToUrl(img),
      alt: `${title} - Gallery Image ${index + 1}`,
    }))
    .filter((img) => img.url)

  const handleImageClick = (imageUrl, index) => {
    setModalImageIndex(index)
    setShowModal(true)
    onImageClick?.(imageUrl)
  }

  const closeModal = () => {
    setShowModal(false)
  }

  const nextImage = () => {
    setModalImageIndex((prev) => (prev + 1) % galleryImages.length)
  }

  const prevImage = () => {
    setModalImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') closeModal()
    if (e.key === 'ArrowRight') nextImage()
    if (e.key === 'ArrowLeft') prevImage()
  }

  if (galleryImages.length === 0) {
    return (
      <div className="w-full">
        <div className="card bg-base-200 border-2 border-dashed border-base-300">
          <div className="card-body text-center">
            <div className="text-6xl mb-4">🖼️</div>
            <h5 className="text-lg font-semibold mb-2">{t("gallery.noImages")}</h5>
            <p className="text-base-content/70">{t("gallery.noImagesDesc")}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="w-full">
        <div className="card bg-base-100 shadow-lg">
          <div className="card-header px-6 py-4 border-b border-base-200">
            <h4 className="text-lg font-semibold flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {t("gallery.title")}
            </h4>
          </div>

          <div className="card-body">
            {/* Main Image Display */}
            <div className="mb-6">
              <div
                className="aspect-square w-full bg-base-200 rounded-lg overflow-hidden cursor-pointer relative group"
                onClick={() => handleImageClick(galleryImages[selectedImage]?.url, selectedImage)}
              >
                <img
                  src={galleryImages[selectedImage]?.url || "/placeholder.svg?height=400&width=400"}
                  alt={galleryImages[selectedImage]?.alt || title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                {/* Zoom overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/90 rounded-full p-3">
                      <ZoomIn className="w-6 h-6 text-gray-800" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Thumbnail Navigation */}
            {galleryImages.length > 1 && (
              <div className="space-y-4">
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {galleryImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index ? "border-primary" : "border-base-300 hover:border-base-content/20"
                        }`}
                    >
                      <img
                        src={image.url || "/placeholder.svg"}
                        alt={image.alt}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>

                {/* Image Counter */}
                <div className="text-center">
                  <div className="badge badge-outline">
                    {t("gallery.imageCounter", { current: selectedImage + 1, total: galleryImages.length })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Screen Modal */}
      {showModal && (
        <div 
          className="modal modal-open"
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div className="modal-box max-w-none w-full h-full max-h-none p-0 bg-black/95">
            {/* Modal Header */}
            <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4 bg-gradient-to-b from-black/50 to-transparent">
              <div className="text-white">
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm opacity-75">
                  {modalImageIndex + 1} of {galleryImages.length}
                </p>
              </div>
              <button 
                className="btn btn-circle btn-ghost text-white hover:bg-white/20"
                onClick={closeModal}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Image Container */}
            <div className="w-full h-full flex items-center justify-center p-4">
              <img
                src={galleryImages[modalImageIndex]?.url || "/placeholder.svg"}
                alt={galleryImages[modalImageIndex]?.alt}
                className="max-w-full max-h-full object-contain"
                style={{ maxHeight: 'calc(100vh - 2rem)' }}
              />
            </div>

            {/* Navigation Arrows */}
            {galleryImages.length > 1 && (
              <>
                <button
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 btn btn-circle btn-ghost text-white hover:bg-white/20"
                  onClick={prevImage}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 btn btn-circle btn-ghost text-white hover:bg-white/20"
                  onClick={nextImage}
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Thumbnail Strip */}
            {galleryImages.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
                <div className="flex gap-2 justify-center overflow-x-auto">
                  {galleryImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setModalImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${modalImageIndex === index ? "border-white" : "border-white/30 hover:border-white/60"
                        }`}
                    >
                      <img
                        src={image.url || "/placeholder.svg"}
                        alt={image.alt}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default ProductGallery
