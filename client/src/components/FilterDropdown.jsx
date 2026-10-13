import { useEffect, useRef, useState } from 'react'
import { FiFilter, FiChevronDown, FiCheck } from 'react-icons/fi'
import '../styles/FilterDropdown.css'

function FilterDropdown({ value, onChange, options = [], label = 'All Statuses' }) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)
  const selectedOption = options.find((option) => option.value === value)

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setOpen(false)
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const handleSelect = (option) => {
    onChange(option.value)
    setOpen(false)
  }

  const handleClear = () => {
    onChange('')
    setOpen(false)
  }

  return (
    <div className={`filter-dropdown ${open ? 'open' : ''}`} ref={dropdownRef}>
      <button type="button" className="filter-trigger" onClick={() => setOpen((previous) => !previous)} aria-expanded={open} aria-haspopup="listbox">
        <span className="filter-icon"><FiFilter /></span>
        <span className="filter-value">{selectedOption ? selectedOption.label : label}</span>
        <FiChevronDown className="filter-arrow" />
      </button>

      {open && (
        <div className="filter-menu">
          <button type="button" className={`filter-option ${!value ? 'selected' : ''}`} onClick={() => { onChange(''); setOpen(false) }}>
            <span>All Statuses</span>
            {!value && <FiCheck />}
          </button>
          {options.filter((option) => option.value && option.label.toLowerCase() !== 'status' && option.label.toLowerCase() !== 'all statuses').map((option) => (
            <button type="button" className={`filter-option ${value === option.value ? 'selected' : ''}`} key={option.value} onClick={() => handleSelect(option)}>
              <span>{option.label}</span>
              {value === option.value && <FiCheck />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default FilterDropdown