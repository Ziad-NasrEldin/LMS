"use client"

import { useState, useEffect, useCallback } from "react"
import { getAllSections, getAllBooks, getAllProducts, getAllSubSections } from "../../../routes/market"
import { getAllSubjects } from "../../../routes/courses"

export const useAdminData = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sections, setSections] = useState([])
  const [subSections, setSubSections] = useState([])
  const [books, setBooks] = useState([])
  const [products, setProducts] = useState([])
  const [subjects, setSubjects] = useState([])
  const [stats, setStats] = useState({
    totalSales: 0,
    pendingApplications: 0,
    totalProducts: 0,
    totalSections: 0,
  })

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all data
      const [sectionsResponse, subSectionsResponse, booksResponse, productsResponse, subjectsResponse] = await Promise.all([
        getAllSections(),
        getAllSubSections(),
        getAllBooks(),
        getAllProducts(),
        getAllSubjects(),
      ])

      // Process sections data
      if (sectionsResponse?.status === "success" && sectionsResponse?.data?.sections) {
        setSections(sectionsResponse.data.sections)
      } else {
        console.warn("Sections data not available:", sectionsResponse)
        setSections([])
      }

      // Process subsections data
      if (subSectionsResponse?.status === "success" && subSectionsResponse?.data?.subsections) {
        console.log("SubSections fetched:", subSectionsResponse.data.subsections)
        setSubSections(subSectionsResponse.data.subsections)
      } else {
        console.warn("SubSections data not available:", subSectionsResponse)
        setSubSections([])
      }

      // Process books data
      if (booksResponse?.status === "success" && booksResponse?.data?.books) {
        setBooks(booksResponse.data.books)
      } else {
        console.warn("Books data not available:", booksResponse)
        setBooks([])
      }

      // Process products data
      if (productsResponse?.status === "success" && productsResponse?.data?.products) {
        setProducts(productsResponse.data.products)
      } else {
        console.warn("Products data not available:", productsResponse)
        setProducts([])
      }

      // Process subjects data
      if (subjectsResponse?.success && subjectsResponse?.data) {
        setSubjects(subjectsResponse.data)
      } else {
        console.warn("Subjects data not available:", subjectsResponse)
        setSubjects([])
      }

      // Calculate statistics
      const totalSections = sectionsResponse?.data?.sections?.length || 0
      const totalProducts = productsResponse?.data?.products?.length || 0
      const totalBooks = booksResponse?.data?.books?.length || 0

      const booksTotal = booksResponse?.data?.books?.reduce((sum, book) => sum + (book?.priceAfterDiscount || book?.price || 0), 0) || 0
      const productsTotal = productsResponse?.data?.products?.reduce((sum, product) => sum + (product?.priceAfterDiscount || product?.price || 0), 0) || 0

      setStats({
        totalSales: booksTotal + productsTotal,
        pendingApplications: 50, // This would come from a different API
        totalProducts: totalProducts + totalBooks,
        totalSections: totalSections,
      })
    } catch (err) {
      console.error("Error fetching initial admin data:", err)
      setError(err?.message || "Failed to fetch data")
      // Set empty arrays as fallbacks
      setSections([])
      setSubSections([])
      setBooks([])
      setProducts([])
      setSubjects([])
    } finally {
      setLoading(false)
    }
  }

  const refetch = useCallback(async () => {
    await fetchInitialData()
  }, [])

  // Fetch data on component mount
  useEffect(() => {
    fetchInitialData()
  }, [])

  return {
    loading,
    error,
    sections,
    subSections,
    books,
    products,
    subjects,
    stats,
    refetch,
    setSections,
    setSubSections,
    setBooks,
    setProducts,
  }
}
