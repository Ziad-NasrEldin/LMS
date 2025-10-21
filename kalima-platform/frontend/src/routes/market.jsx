import axios from "axios"
import { getToken } from "./auth-services"

const API_URL = import.meta.env.VITE_API_URL

// Function to get all sections (categories)
export const getAllSections = async (queryParams = {}) => {
  try {
    const response = await axios.get(`${API_URL}/api/v1/ec/sections`, {
      params: queryParams,
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })
    return response.data
  } catch (error) {
    console.error(`Error fetching sections: ${error.message}`)
    throw error
  }
}

// Function to get all books with pagination support
export const getAllBooks = async (queryParams = {}) => {
  try {
    const response = await axios.get(`${API_URL}/api/v1/ec/books`, {
      params: queryParams,
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })
    return response.data
  } catch (error) {
    console.error(`Error fetching books: ${error.message}`)
    throw error
  }
}

// Function to get all products with pagination support
export const getAllProducts = async (queryParams = {}) => {
  try {
    const response = await axios.get(`${API_URL}/api/v1/ec/products`, {
      params: queryParams,
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })
    return response.data
  } catch (error) {
    console.error(`Error fetching products: ${error.message}`)
    throw error
  }
}

// Function to get a book by ID
export const getBookById = async (bookId) => {
  try {
    const response = await axios.get(`${API_URL}/api/v1/ec/books/${bookId}`, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })
    return response.data
  } catch (error) {
    console.error(`Error fetching book by ID: ${error.message}`)
    throw error
  }
}

// Function to get a product by ID
export const getProductById = async (productId) => {
  try {
    const response = await axios.get(`${API_URL}/api/v1/ec/products/${productId}`, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })
    return response.data
  } catch (error) {
    console.error(`Error fetching product by ID: ${error.message}`)
    throw error
  }
}

// Function to get books by section
export const getBooksBySection = async (sectionId, queryParams = {}) => {
  try {
    const response = await axios.get(`${API_URL}/api/v1/ec/books`, {
      params: { section: sectionId, ...queryParams },
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })
    return response.data
  } catch (error) {
    console.error(`Error fetching books by section: ${error.message}`)
    throw error
  }
}

export const getProductsBySection = async (sectionId, queryParams = {}) => {
  try {
    const response = await axios.get(`${API_URL}/api/v1/ec/sections/${sectionId}/products`, {
      params: queryParams,
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })
    return response.data
  } catch (error) {
    console.error(`Error fetching products by section: ${error.message}`)
    throw error
  }
}

export const createSection = async (sectionData) => {
  try {
    const response = await axios.post(`${API_URL}/api/v1/ec/sections`, sectionData, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    })
    return response.data
  } catch (error) {
    console.error(`Error creating section: ${error.message}`)
    throw error
  }
}

// Function to update a section
export const updateSection = async (sectionId, updateData) => {
  try {
    const response = await axios.patch(`${API_URL}/api/v1/ec/sections/${sectionId}`, updateData, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    })
    return response.data
  } catch (error) {
    console.error(`Error updating section: ${error.message}`)
    throw error
  }
}

// Function to delete a section
export const deleteSection = async (sectionId) => {
  try {
    const response = await axios.delete(`${API_URL}/api/v1/ec/sections/${sectionId}`, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })
    return response.data
  } catch (error) {
    console.error(`Error deleting section: ${error.message}`)
    throw error
  }
}

export const createProduct = async (productData) => {
  try {

    // Validate required fields including subSection
    if (!productData.subSection || productData.subSection === "" || productData.subSection === "undefined") {
      console.error("❌ DEBUG createProduct - SubSection validation failed!")
      throw new Error("SubSection is required. Please select a subsection before creating the product.")
    }


    const formData = new FormData()

    // Append all the required form fields
    formData.append("title", productData.title)
    formData.append("serial", productData.serial)
    formData.append("section", productData.section)
    
    formData.append("subSection", productData.subSection)
    
    formData.append("price", productData.price)
    formData.append("priceAfterDiscount", productData.priceAfterDiscount || "0")
    formData.append("paymentNumber", productData.paymentNumber)

    // NEW REQUIRED FIELDS
    formData.append("whatsAppNumber", productData.whatsAppNumber)
    formData.append("description", productData.description)

    // Append files if they exist
    if (productData.thumbnail) {
      formData.append("thumbnail", productData.thumbnail)
    }
    if (productData.sample) {
      formData.append("sample", productData.sample)
    }

    // Handle gallery files (multiple files)
    if (productData.gallery && productData.gallery.length > 0) {
      // If gallery is a FileList or array of files
      for (let i = 0; i < productData.gallery.length; i++) {
        formData.append("gallery", productData.gallery[i])
      }
    }
    
    
    const response = await axios.post(`${API_URL}/api/v1/ec/products`, formData, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data
  } catch (error) {
    console.error(`Error creating product: ${error.message}`)
    throw error
  }
}

export const createBook = async (bookData) => {
  try {

    // Validate required fields including subSection
    if (!bookData.subSection || bookData.subSection === "" || bookData.subSection === "undefined") {
      console.error("❌ DEBUG createBook - SubSection validation failed!")
      throw new Error("SubSection is required. Please select a subsection before creating the book.")
    }


    const formData = new FormData()

    // Append all the form fields
    formData.append("title", bookData.title)
    formData.append("serial", bookData.serial)
    formData.append("section", bookData.section)
    
    formData.append("subSection", bookData.subSection)
    
    formData.append("price", bookData.price)
    formData.append("priceAfterDiscount", bookData.priceAfterDiscount || "0")
    formData.append("subject", bookData.subject)
    formData.append("paymentNumber", bookData.paymentNumber)
    formData.append("description", bookData.description)
    formData.append("whatsAppNumber", bookData.whatsAppNumber)

    // Append files if they exist
    if (bookData.thumbnail) {
      formData.append("thumbnail", bookData.thumbnail)
    }
    if (bookData.sample) {
      formData.append("sample", bookData.sample)
    }
    if (bookData.gallery && bookData.gallery.length > 0) {
      // If gallery is a FileList or array of files
      for (let i = 0; i < bookData.gallery.length; i++) {
        formData.append("gallery", bookData.gallery[i])
      }
    }


    const response = await axios.post(`${API_URL}/api/v1/ec/books`, formData, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data
  } catch (error) {
    console.error(`Error creating book: ${error.message}`)
    throw error
  }
}

export const updateProduct = async (productId, productData) => {
  try {
    const formData = new FormData()

    // Append all the form fields that are provided
    if (productData.title !== undefined) formData.append("title", productData.title)
    if (productData.serial !== undefined) formData.append("serial", productData.serial)
    if (productData.section !== undefined) formData.append("section", productData.section)
    if (productData.subSection !== undefined) formData.append("subSection", productData.subSection)
    if (productData.price !== undefined) formData.append("price", productData.price)
    if (productData.priceAfterDiscount !== undefined) formData.append("priceAfterDiscount", productData.priceAfterDiscount)
    if (productData.paymentNumber !== undefined) formData.append("paymentNumber", productData.paymentNumber)
    if (productData.whatsAppNumber !== undefined) formData.append("whatsAppNumber", productData.whatsAppNumber)
    if (productData.subject !== undefined) formData.append("subject", productData.subject)
    if (productData.description !== undefined) formData.append("description", productData.description)

    // Append files if they exist
    if (productData.thumbnail) {
      formData.append("thumbnail", productData.thumbnail)
    }
    if (productData.sample) {
      formData.append("sample", productData.sample)
    }

    const response = await axios.patch(
      `${API_URL}/api/v1/ec/products/${productId}`,
      formData,
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "multipart/form-data",
        },
      }
    )
    return response.data
  } catch (error) {
    console.error(`Error updating product: ${error.message}`)
    throw error
  }
}

// Function to delete a product
export const deleteProduct = async (productId) => {
  try {
    const response = await axios.delete(`${API_URL}/api/v1/ec/products/${productId}`, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })
    return response.data
  } catch (error) {
    console.error(`Error deleting product: ${error.message}`)
    throw error
  }
}

export const purchaseProduct = async (purchaseData) => {
  try {
    const formData = new FormData()
    formData.append("productId", purchaseData.productId)
    formData.append("numberTransferredFrom", purchaseData.numberTransferredFrom)

    if (purchaseData.paymentScreenShot) {
      formData.append("paymentScreenShot", purchaseData.paymentScreenShot)
    }

    if (purchaseData.notes) {
      formData.append("notes", purchaseData.notes)
    }

    if (purchaseData.couponCode) {
      formData.append("couponCode", purchaseData.couponCode)
    }

    const response = await axios.post(`${API_URL}/api/v1/ec/purchases/`, formData, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "multipart/form-data",
      },
    })

    return response.data
  } catch (error) {
    console.error(`Error purchasing product: ${error.message}`)
    throw error
  }
}

// Function to purchase a book
export const purchaseBook = async (purchaseData) => {
  try {
    const formData = new FormData()

    formData.append("productId", purchaseData.productId)
    formData.append("numberTransferredFrom", purchaseData.numberTransferredFrom)
    if (purchaseData.paymentScreenShot) {
      formData.append("paymentScreenShot", purchaseData.paymentScreenShot)
    }
    if(purchaseData.notes){
      formData.append("notes", purchaseData.notes)
    }
    formData.append("nameOnBook", purchaseData.nameOnBook)
    formData.append("numberOnBook", purchaseData.numberOnBook)
    formData.append("seriesName", purchaseData.seriesName)

    if (purchaseData.couponCode) {
      formData.append("couponCode", purchaseData.couponCode)
    }

    const response = await axios.post(`${API_URL}/api/v1/ec/book-purchases/`, formData, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data
  } catch (error) {
    console.error(`Error purchasing book: ${error.message}`)
    throw error
  }
}

export const RecalculateInvites = async () => {
  try {
    const response = await axios.post(
      `${API_URL}/api/v1/ec/referrals/recalculate`,
      {},
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      },
    )
    return response.data
  } catch (error) {
    console.error(`Error Calculating Invites: ${error.message}`)
    throw error
  }
}

// Subsection functions

// Function to get all subsections
export const getAllSubSections = async (queryParams = {}) => {
  try {
    const response = await axios.get(`${API_URL}/api/v1/ec/subsections`, {
      params: queryParams,
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })
    return response.data
  } catch (error) {
    console.error(`Error fetching subsections: ${error.message}`)
    throw error
  }
}

// Function to get subsections by section ID
export const getSubSectionsBySection = async (sectionId, queryParams = {}) => {
  try {
    const response = await axios.get(`${API_URL}/api/v1/ec/sections/${sectionId}/subsections`, {
      params: queryParams,
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })
    return response.data
  } catch (error) {
    console.error(`Error fetching subsections by section: ${error.message}`)
    throw error
  }
}

// Function to get a single subsection with its products
export const getSubSectionById = async (subSectionId) => {
  try {
    const response = await axios.get(`${API_URL}/api/v1/ec/subsections/${subSectionId}`, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })
    return response.data
  } catch (error) {
    console.error(`Error fetching subsection by ID: ${error.message}`)
    throw error
  }
}

// Function to create a new subsection
export const createSubSection = async (subSectionData) => {
  try {
    const response = await axios.post(`${API_URL}/api/v1/ec/subsections`, subSectionData, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    })
    return response.data
  } catch (error) {
    console.error(`Error creating subsection: ${error.message}`)
    throw error
  }
}

// Function to update a subsection
export const updateSubSection = async (subSectionId, updateData) => {
  try {
    const response = await axios.patch(`${API_URL}/api/v1/ec/subsections/${subSectionId}`, updateData, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    })
    return response.data
  } catch (error) {
    console.error(`Error updating subsection: ${error.message}`)
    throw error
  }
}

// Function to delete a subsection
export const deleteSubSection = async (subSectionId) => {
  try {
    const response = await axios.delete(`${API_URL}/api/v1/ec/subsections/${subSectionId}`, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })
    return response.data
  } catch (error) {
    console.error(`Error deleting subsection: ${error.message}`)
    throw error
  }
}

