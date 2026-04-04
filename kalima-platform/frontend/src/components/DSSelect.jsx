import { Children, isValidElement, useEffect, useId, useMemo, useRef, useState } from "react"
import { Check, ChevronDown } from "lucide-react"

const normalizeValue = (value) => (value === undefined || value === null ? "" : String(value))

const sanitizeClassName = (className = "") => {
  const tokens = String(className)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)

  const sanitized = tokens.map((token) => {
    if (token === "select-error") return "ds-select-error"
    if (/^[a-z]+:select-error$/.test(token)) return token.replace(/select-error$/, "ds-select-error")
    return token
  }).filter((token) => {
    if (token === "select") return false
    if (/^[a-z]+:select$/.test(token)) return false
    if (token === "select-bordered") return false
    if (/^[a-z]+:select-bordered$/.test(token)) return false
    if (token === "select-ghost") return false
    if (/^[a-z]+:select-ghost$/.test(token)) return false
    if (
      token === "select-neutral" ||
      token === "select-primary" ||
      token === "select-secondary" ||
      token === "select-accent" ||
      token === "select-info" ||
      token === "select-success" ||
      token === "select-warning" ||
      token === "select-error"
    ) {
      return false
    }
    return true
  })

  return sanitized.join(" ")
}

const textFromNode = (node) => {
  if (node === undefined || node === null || typeof node === "boolean") return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(textFromNode).join("")
  if (isValidElement(node)) return textFromNode(node.props?.children)
  return ""
}

const collectOptions = (children, groupLabel = "", bucket = []) => {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return

    if (child.type === "optgroup") {
      collectOptions(child.props?.children, String(child.props?.label || ""), bucket)
      return
    }

    if (child.type !== "option") return

    const rawValue = child.props?.value ?? textFromNode(child.props?.children)
    bucket.push({
      value: normalizeValue(rawValue),
      label: textFromNode(child.props?.children) || normalizeValue(rawValue),
      disabled: Boolean(child.props?.disabled),
      hidden: Boolean(child.props?.hidden),
      selected: Boolean(child.props?.selected),
      groupLabel,
    })
  })

  return bucket
}

const findDefaultValue = (options, defaultValue) => {
  if (defaultValue !== undefined) return normalizeValue(defaultValue)

  const selectedOption = options.find((option) => option.selected)
  if (selectedOption) return selectedOption.value

  return options[0]?.value ?? ""
}

const buildSyntheticEvent = ({ name, id, value, type }) => ({
  type,
  target: { name, id, value },
  currentTarget: { name, id, value },
  preventDefault() {},
  stopPropagation() {},
})

export default function DSSelect({
  children,
  className = "",
  style,
  value,
  defaultValue,
  onChange,
  onBlur,
  onFocus,
  name,
  id,
  disabled = false,
  required = false,
  multiple = false,
  ...rest
}) {
  if (multiple) {
    return (
      <select
        className={className}
        style={style}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        name={name}
        id={id}
        disabled={disabled}
        required={required}
        multiple
        {...rest}
      >
        {children}
      </select>
    )
  }

  const wrapperRef = useRef(null)
  const triggerRef = useRef(null)
  const optionRefs = useRef([])
  const generatedId = useId().replace(/:/g, "")
  const controlId = id || `ds-select-${generatedId}`
  const listboxId = `${controlId}-listbox`

  const options = useMemo(() => collectOptions(children), [children])
  const isControlled = value !== undefined

  const [internalValue, setInternalValue] = useState(() => findDefaultValue(options, defaultValue))
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const selectedValue = isControlled ? normalizeValue(value) : internalValue
  const selectedOption = options.find((option) => option.value === selectedValue) || null
  const enabledOptions = options.filter((option) => !option.disabled && !option.hidden)
  const triggerClassName = sanitizeClassName(className)

  useEffect(() => {
    if (isControlled) return

    const exists = options.some((option) => option.value === internalValue)
    if (!exists) {
      setInternalValue(findDefaultValue(options, defaultValue))
    }
  }, [defaultValue, internalValue, isControlled, options])

  useEffect(() => {
    if (!isOpen && !isClosing) return undefined

    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        closeMenu()
      }
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeMenu()
        triggerRef.current?.focus()
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, isClosing])

  useEffect(() => {
    if (!isOpen || activeIndex < 0) return
    optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" })
  }, [activeIndex, isOpen])

  const selectValue = (nextValue) => {
    if (!isControlled) {
      setInternalValue(nextValue)
    }

    onChange?.(buildSyntheticEvent({ name, id: controlId, value: nextValue, type: "change" }))
    closeMenu()
    triggerRef.current?.focus()
  }

  const openMenu = () => {
    if (disabled) return
    if (!enabledOptions.length) return

    const selectedEnabledIndex = enabledOptions.findIndex((option) => option.value === selectedValue)
    setActiveIndex(selectedEnabledIndex >= 0 ? selectedEnabledIndex : 0)
    setIsOpen(true)
    
    // Add opening animation after menu is rendered
    setTimeout(() => {
      if (wrapperRef.current) {
        const menuElement = wrapperRef.current.querySelector('.ds-select-menu')
        if (menuElement) {
          // Start from hidden state
          menuElement.style.opacity = '0'
          menuElement.style.transform = 'translateY(-12px) scale(0.92)'
          menuElement.style.transition = 'opacity 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          
          // Animate to visible state
          requestAnimationFrame(() => {
            menuElement.style.opacity = '1'
            menuElement.style.transform = 'translateY(0) scale(1)'
          })
        }
      }
    }, 10)
    
    // Simple fixed scroll based on number of options
    setTimeout(() => {
      if (wrapperRef.current) {
        const scrollContainer = wrapperRef.current.closest('.custom-scrollbar') || 
                              wrapperRef.current.closest('[class*="overflow-y"]') ||
                              document.documentElement
        
        // Calculate scroll distance: 40px per option
        const scrollDistance = enabledOptions.length * 40
        
        if (scrollContainer !== document.documentElement) {
          // For custom scroll container - try smooth scroll first
          if (scrollContainer.scrollTo) {
            scrollContainer.scrollTo({
              top: scrollContainer.scrollTop + scrollDistance,
              behavior: 'smooth'
            })
          } else {
            // Fallback - animate manually
            const startScroll = scrollContainer.scrollTop
            const targetScroll = startScroll + scrollDistance
            const duration = 300 // ms
            const startTime = performance.now()
            
            const animateScroll = (currentTime) => {
              const elapsed = currentTime - startTime
              const progress = Math.min(elapsed / duration, 1)
              const easeProgress = 1 - Math.pow(1 - progress, 3) // Ease out cubic
              
              scrollContainer.scrollTop = startScroll + (targetScroll - startScroll) * easeProgress
              
              if (progress < 1) {
                requestAnimationFrame(animateScroll)
              }
            }
            
            requestAnimationFrame(animateScroll)
          }
        } else {
          // For document scrolling
          window.scrollBy({
            top: scrollDistance,
            behavior: 'smooth'
          })
        }
      }
    }, 50)
  }

  const closeMenu = () => {
    if (!isOpen || isClosing) return
    
    setIsClosing(true)
    
    // Add closing animation
    if (wrapperRef.current) {
      const menuElement = wrapperRef.current.querySelector('.ds-select-menu')
      if (menuElement) {
        menuElement.style.transition = 'opacity 220ms cubic-bezier(0.55, 0.055, 0.675, 0.19), transform 220ms cubic-bezier(0.55, 0.055, 0.675, 0.19)'
        menuElement.style.opacity = '0'
        menuElement.style.transform = 'translateY(-8px) scale(0.96)'
      }
    }
    
    // Actually close after animation
    setTimeout(() => {
      setIsOpen(false)
      setIsClosing(false)
      
      // Reset animation styles
      if (wrapperRef.current) {
        const menuElement = wrapperRef.current.querySelector('.ds-select-menu')
        if (menuElement) {
          menuElement.style.transition = ''
          menuElement.style.opacity = ''
          menuElement.style.transform = ''
        }
      }
    }, 220)
  }

  const handleTriggerKeyDown = (event) => {
    if (disabled) return

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      if (!isOpen) {
        openMenu()
        return
      }

      if (!enabledOptions.length) return
      const delta = event.key === "ArrowDown" ? 1 : -1
      const next = (activeIndex + delta + enabledOptions.length) % enabledOptions.length
      setActiveIndex(next)
      return
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      if (!isOpen) {
        openMenu()
        return
      }

      if (activeIndex >= 0 && activeIndex < enabledOptions.length) {
        selectValue(enabledOptions[activeIndex].value)
      }
      return
    }

    if (event.key === "Escape") {
      if (isOpen) {
        event.preventDefault()
        closeMenu()
      }
    }
  }

  const handleListboxKeyDown = (event) => {
    if (!enabledOptions.length) return

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      const delta = event.key === "ArrowDown" ? 1 : -1
      const next = (activeIndex + delta + enabledOptions.length) % enabledOptions.length
      setActiveIndex(next)
      return
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      if (activeIndex >= 0 && activeIndex < enabledOptions.length) {
        selectValue(enabledOptions[activeIndex].value)
      }
      return
    }

    if (event.key === "Escape") {
      event.preventDefault()
      closeMenu()
      triggerRef.current?.focus()
    }
  }

  return (
    <div ref={wrapperRef} className={`ds-select ${isOpen ? "ds-select-open" : ""} ${disabled ? "ds-select-disabled" : ""}`}>
      {name ? (
        <input
          className="ds-select-value-proxy"
          name={name}
          value={selectedValue}
          readOnly
          required={required}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden="true"
        />
      ) : null}

      <button
        ref={triggerRef}
        id={controlId}
        type="button"
        className={`ds-select-trigger ${triggerClassName}`.trim()}
        style={style}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => (isOpen || isClosing ? closeMenu() : openMenu())}
        onKeyDown={handleTriggerKeyDown}
        onFocus={onFocus}
        onBlur={(event) => {
          setTimeout(() => {
            if (!wrapperRef.current?.contains(document.activeElement)) {
              closeMenu()
              onBlur?.(event)
            }
          }, 0)
        }}
        {...rest}
      >
        <span className="ds-select-label">
          {selectedOption?.label || ""}
        </span>
        <ChevronDown size={16} className={`ds-select-chevron ${isOpen ? "ds-select-chevron-open" : ""}`} />
      </button>

      {(isOpen || isClosing) ? (
        <ul
          id={listboxId}
          className={`ds-select-menu ${isClosing ? 'ds-select-menu-closing' : ''}`}
          role="listbox"
          aria-labelledby={controlId}
          tabIndex={-1}
          onKeyDown={handleListboxKeyDown}
        >
          {options
            .filter((option) => !option.hidden)
            .map((option) => {
              const isSelected = option.value === selectedValue
              const optionIndex = enabledOptions.findIndex((enabledOption) => enabledOption.value === option.value)
              const isActive = optionIndex >= 0 && optionIndex === activeIndex

              return (
                <li key={`${option.groupLabel}-${option.value}`} role="presentation">
                  <button
                    ref={(node) => {
                      if (optionIndex >= 0) optionRefs.current[optionIndex] = node
                    }}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={option.disabled}
                    className={`ds-select-option ${isSelected ? "ds-select-option-selected" : ""} ${isActive ? "ds-select-option-active" : ""}`.trim()}
                    onMouseEnter={() => {
                      if (optionIndex >= 0) setActiveIndex(optionIndex)
                    }}
                    onClick={() => {
                      if (!option.disabled) selectValue(option.value)
                    }}
                  >
                    <span className="ds-select-option-label">{option.label}</span>
                    {isSelected ? <Check size={14} className="ds-select-check" /> : null}
                  </button>
                </li>
              )
            })}
        </ul>
      ) : null}
    </div>
  )
}
