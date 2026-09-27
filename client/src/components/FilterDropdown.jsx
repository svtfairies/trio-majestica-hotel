import { useState } from 'react'
import { FiFilter, FiChevronDown, FiCheck } from 'react-icons/fi'
import '../styles/FilterDropdown.css'

function FilterDropdown({ value, onChange, options = [], label = 'All' }) {
  const [open, setOpen] = useState(false)
  const selectedOption = options.find((option) => option.value === value)

  const handleSelect = (option) => {
    onChange(option.value)
    setOpen(false)
  }

  return (
    <div className={`filter-dropdown ${open ? 'open' : ''}`}>
      <button type="button" className="filter-trigger" onClick={() => setOpen(!open)}>
        <span className="filter-icon"><FiFilter /></span>
        <span className="filter-value">{selectedOption ? selectedOption.label : label}</span>
        <FiChevronDown className="filter-arrow" />
      </button>

      {open && (
        <div className="filter-menu">
          <button type="button" className={`filter-option ${!value ? 'selected' : ''}`} onClick={() => { onChange(''); setOpen(false) }}>
            <span>All</span>
            {!value && <FiCheck />}
          </button>

          {options.map((option) => (
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