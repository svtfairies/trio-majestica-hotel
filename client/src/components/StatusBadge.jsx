import { FiCheckCircle, FiClock, FiLogIn, FiLogOut, FiXCircle, FiUserX, FiLoader, FiHome, FiAlertCircle, FiTool, FiEye, FiCheck } from 'react-icons/fi'
import '../styles/StatusBadge.css'

const statusConfig = {
  Confirmed: { icon: <FiCheckCircle />, className: 'confirmed' },
  Pending: { icon: <FiClock />, className: 'pending' },
  'Checked In': { icon: <FiLogIn />, className: 'checked-in' },
  'Checked Out': { icon: <FiLogOut />, className: 'checked-out' },
  Cancelled: { icon: <FiXCircle />, className: 'cancelled' },
  'No Show': { icon: <FiUserX />, className: 'no-show' },
  'In Progress': { icon: <FiLoader />, className: 'in-progress' },
  Clean: { icon: <FiHome />, className: 'clean' },
  Dirty: { icon: <FiAlertCircle />, className: 'dirty' },
  Inspected: { icon: <FiEye />, className: 'inspected' },
  Maintenance: { icon: <FiTool />, className: 'maintenance' },
}

function StatusBadge({ status }) {
  const config = statusConfig[status] || {
    icon: <FiClock />,
    className: 'default',
  }

  return (
    <span className={`status-badge status-${config.className}`}>
      <i>{config.icon}</i>
      <span>{status}</span>
    </span>
  )
}

export default StatusBadge