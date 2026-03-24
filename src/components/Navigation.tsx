import { Button } from '@consta/uikit/Button'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Navigation() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const isCustomersActive = location.pathname === '/' || location.pathname === '/customers'
  const isLotsActive = location.pathname === '/lots'
  
  return (
    <div style={{ 
      position: 'sticky',
      top: 0,
      backgroundColor: 'var(--bg)',
      borderBottom: '1px solid var(--border)',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      paddingTop: '16px'
    }}>
      <div style={{ 
        maxWidth: 1126, 
        margin: '0 auto',
        padding: '0 40px 12px 40px',
        display: 'flex',
        gap: '12px'
      }}>
        <Button
          label="Контрагенты"
          view={isCustomersActive ? 'primary' : 'secondary'}
          onClick={() => navigate('/customers')}
          size="m"
          className="button-rounded"
        />
        <Button
          label="Лоты"
          view={isLotsActive ? 'primary' : 'secondary'}
          onClick={() => navigate('/lots')}
          size="m"
          className="button-rounded"
        />
      </div>
    </div>
  )
}