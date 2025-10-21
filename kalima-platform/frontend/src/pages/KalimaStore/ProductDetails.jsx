"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { getBookById, getProductById, purchaseProduct, purchaseBook } from "../../routes/market"
import { validateCoupon } from "../../routes/marketCoupouns" // Assuming this is the correct path

// Import components
import ProductHeader from "./components/ProductHeader"
import ProductGallery from "./components/ProductsGallery"
import SampleDownload from "./components/SampleDownload"
import ProductInfo from "./components/ProductInfo"
import PaymentSection from "./components/PaymentSection"
import PurchaseForm from "./components/PurchaseForm"

const ProductDetails = () => {
  const { t, i18n } = useTranslation("kalimaStore-ProductDetails")
  const isRTL = i18n.language === "ar"

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)

  // Coupon and Price State
  const [couponCode, setCouponCode] = useState("")
  const [finalPrice, setFinalPrice] = useState(null)
  const [couponValidation, setCouponValidation] = useState({
    isValid: false,
    message: "",
    discount: 0,
    loading: false,
  })

  // Purchase form state
  const [purchaseForm, setPurchaseForm] = useState({
    numberTransferredFrom: "",
    nameOnBook: "",
    numberOnBook: "",
    seriesName: "",
    notes: "",
  })

  const { id, type } = useParams()
  const navigate = useNavigate()

  const getItemType = (item) => {
    return item && item.__t === "ECBook" ? "book" : "product"
  }

  // Helper function to get the display price (priceAfterDiscount or original price)
  const getDisplayPrice = (productData) => {
    if (productData.priceAfterDiscount && productData.priceAfterDiscount < productData.price) {
      return productData.priceAfterDiscount
    }
    return productData.price
  }

  // Fetch product/book data
  useEffect(() => {
    const fetchItemData = async () => {
      if (!id) {
        setError(t("errors.invalidProductInfo"))
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        let response

        if (type === "book") {
          response = await getBookById(id)
        } else {
          try {
            response = await getProductById(id)
          } catch (productError) {
            console.log("Failed to fetch as product, trying as book:", productError.message)
            response = await getBookById(id)
          }
        }

        if (response.status === "success") {
          const itemData = response.data.book || response.data.product
          setProduct(itemData)

          // Set initial price to the display price (priceAfterDiscount if available)
          const initialDisplayPrice = getDisplayPrice(itemData)
          setFinalPrice(initialDisplayPrice)
        } else {
          throw new Error(t("errors.fetchFailed"))
        }
      } catch (err) {
        setError(err.message)
        console.error(t("errors.fetchErrorLog"), err)
      } finally {
        setLoading(false)
      }
    }

    fetchItemData()
  }, [id, type, t])

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      alert(t("errors.noCouponCode"))
      return
    }

    setCouponValidation({ ...couponValidation, loading: true, message: "" })

    const result = await validateCoupon(couponCode)

    // This handles both network errors and API responses with status: "fail"
    if (!result.success || result.data?.status === "fail") {
      const errorMessage = result.data?.message || result.error || t("errors.invalidCoupon")

      // Reset to display price (priceAfterDiscount if available)
      const resetPrice = getDisplayPrice(product)
      setFinalPrice(resetPrice)

      setCouponValidation({
        isValid: false,
        message: errorMessage,
        discount: 0,
        loading: false,
      })
      return
    }

    // This handles a successful validation
    if (result.data?.status === "success" && result.data?.data?.isValid) {
      const couponData = result.data.data.coupon
      const discountAmount = couponData.value // Assuming 'value' is a fixed discount amount

      if (typeof discountAmount !== "number") {
        setCouponValidation({
          isValid: false,
          message: t("errors.invalidDiscountValue"),
          discount: 0,
          loading: false,
        })
        return
      }

      // Apply discount to the base display price (price after initial discount)
      const basePrice = getDisplayPrice(product)
      const newPrice = basePrice - discountAmount

      setFinalPrice(newPrice < 0 ? 0 : newPrice)
      setCouponValidation({
        isValid: true,
        message: t("success.couponApplied"),
        discount: discountAmount,
        loading: false,
      })
    } else {
      // Fallback for any other unexpected success response format
      const resetPrice = getDisplayPrice(product)
      setFinalPrice(resetPrice)
      setCouponValidation({
        isValid: false,
        message: t("errors.invalidCoupon"),
        discount: 0,
        loading: false,
      })
    }
  }

  const handleRemoveCoupon = () => {
    setCouponCode("")

    // Reset to display price (priceAfterDiscount if available)
    const resetPrice = getDisplayPrice(product)
    setFinalPrice(resetPrice)

    setCouponValidation({
      isValid: false,
      message: "",
      discount: 0,
      loading: false,
    })
  }

  const handleSubmit = async () => {
    if (!product) {
      alert(t("errors.productDataNotLoaded"))
      return
    }

    const actualType = getItemType(product)

    if (!uploadedFile) {
      alert(t("errors.noFileSelected"))
      return
    }

    if (!purchaseForm.numberTransferredFrom) {
      alert(t("errors.noTransferNumber"))
      return
    }

    if (actualType === "book" && (!purchaseForm.nameOnBook || !purchaseForm.numberOnBook || !purchaseForm.seriesName)) {
      alert(t("errors.fillBookFields"))
      return
    }

    try {
      setPurchaseLoading(true)

      const purchaseData = {
        productId: product._id,
        numberTransferredFrom: purchaseForm.numberTransferredFrom,
        paymentScreenShot: uploadedFile,
        notes: purchaseForm.notes || "",
      }

      // Add coupon code if valid
      if (couponValidation.isValid && couponCode.trim()) {
        purchaseData.couponCode = couponCode.trim()
      }

      // Add book-specific fields if it's a book
      if (actualType === "book") {
        purchaseData.nameOnBook = purchaseForm.nameOnBook
        purchaseData.numberOnBook = purchaseForm.numberOnBook
        purchaseData.seriesName = purchaseForm.seriesName
      }

      let response
      if (actualType === "book") {
        response = await purchaseBook(purchaseData)
      } else {
        response = await purchaseProduct(purchaseData)
      }

      if (response.status === "success" || response.message) {
        alert(t("success.purchaseSubmitted"))

        // Reset form
        setUploadedFile(null)
        setPurchaseForm({
          numberTransferredFrom: "",
          nameOnBook: "",
          numberOnBook: "",
          seriesName: "",
          notes: "",
        })
        handleRemoveCoupon() // Also reset coupon state
// dummy comment to re-commit
        const fileInput = document.getElementById("file-upload")
        if (fileInput) fileInput.value = ""
      } else {
        throw new Error("Unexpected response format")
      }
    } catch (err) {
      console.error("💥 Error submitting purchase:", err)
      const errorMessage = err.response?.data?.message || err.message || t("errors.unknownError")
      alert(t("errors.purchaseSubmissionFailed") + errorMessage)
    } finally {
      setPurchaseLoading(false)
    }
  }

  const displayType = product ? getItemType(product) : type

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg mb-4"></div>
          <p className="text-lg">{t("loading.productDetails")}</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card bg-base-100 shadow-xl max-w-md w-full">
          <div className="card-body text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold mb-2">{t("errors.title")}</h3>
            <p className="mb-6">{error || t("errors.productNotFound")}</p>
            <button onClick={() => navigate(-1)} className="btn btn-primary">
              {t("navigation.goBack")}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
      <ProductHeader onBack={() => navigate(-1)} isRTL={isRTL} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body p-0">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-0">
              <div className="p-8 lg:p-12">
                <ProductGallery gallery={product.gallery} title={product.title} />
                <div className="mt-8">
                  <SampleDownload sample={product.sample} title={product.title} type={displayType} isRTL={isRTL} />
                </div>
              </div>
              <div className="p-8 lg:p-12 border-l border-base-200">
                <ProductInfo product={product} type={displayType} isRTL={isRTL} />
              </div>
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <PurchaseForm
              type={displayType}
              purchaseForm={purchaseForm}
              setPurchaseForm={setPurchaseForm}
              uploadedFile={uploadedFile}
              setUploadedFile={setUploadedFile}
              onSubmit={handleSubmit}
              purchaseLoading={purchaseLoading}
              // Coupon and Price Props
              productPrice={product.price}
              displayPrice={getDisplayPrice(product)}
              finalPrice={finalPrice}
              couponCode={couponCode}
              setCouponCode={setCouponCode}
              onValidateCoupon={handleValidateCoupon}
              onRemoveCoupon={handleRemoveCoupon}
              couponValidation={couponValidation}
            />
          </div>
        </div>
        {product && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <PaymentSection
                paymentNumber={product.paymentNumber}
                isRTL={isRTL}
                whatsAppNumber={product?.whatsAppNumber || ""}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductDetails
