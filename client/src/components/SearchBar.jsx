import { FiSearch, FiX } from 'react-icons/fi'
import '../styles/SearchBar.css'

function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="search-bar">
      <div className="search-icon">
        <FiSearch />
      </div>

      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}/>

      {value && (
        <button type="button" className="search-clear" onClick={() => onChange('')}>
          <FiX />
        </button>
      )}
    </div>
  )
}

export default SearchBar