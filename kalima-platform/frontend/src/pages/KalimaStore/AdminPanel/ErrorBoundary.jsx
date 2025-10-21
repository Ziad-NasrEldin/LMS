"use client"

import React from "react"
import { withTranslation } from "react-i18next"

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error("Admin Panel Error:", error, errorInfo)
    this.setState({
      error: error,
      errorInfo: errorInfo,
    })
  }

  render() {
    const { t } = this.props;
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="alert alert-error max-w-md">
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
            <div>
              <h3 className="font-bold">{t("errorTitle")}</h3>
              <div className="text-xs">{this.state.error?.message || t("unexpectedError")}</div>
              <button className="btn btn-sm btn-outline mt-2" onClick={() => window.location.reload()}>
                {t("reloadButton")}
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default withTranslation("kalimaStore-errorBoundary")(ErrorBoundary)
