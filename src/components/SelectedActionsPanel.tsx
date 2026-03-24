import { Button } from '@consta/uikit/Button'

type Props = {
  selectedCount: number
  onEdit?: () => void
  onDelete: () => void
  onExport: () => void
  showEditButton?: boolean
  editButtonLabel?: string
  deleteButtonLabel?: string
  exportButtonLabel?: string
}

export default function SelectedActionsPanel({
  selectedCount,
  onEdit,
  onDelete,
  onExport,
  showEditButton = false,
  editButtonLabel = '✎ Редактировать',
  deleteButtonLabel = '🗑️ Удалить',
  exportButtonLabel = '📎 Экспорт'
}: Props) {
  if (selectedCount === 0) return null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: 16,
      marginTop: 20,
      padding: '12px 20px',
      backgroundColor: 'var(--accent-bg)',
      borderRadius: 8,
      border: '1px solid var(--accent-border)'
    }}>
      <span style={{
        fontSize: 14,
        fontWeight: 500,
        color: 'var(--accent)',
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }}>
        <span style={{ fontSize: 16, color: 'var(--accent)' }}>✅</span>
        Выбрано: {selectedCount}
      </span>
      
      {showEditButton && onEdit && (
        <Button
          label={editButtonLabel}
          view="ghost"
          size="s"
          onClick={onEdit}
          className="button-rounded"
        />
      )}
      
      <Button
        label={deleteButtonLabel}
        view="ghost"
        size="s"
        onClick={onDelete}
        className="button-rounded"
        style={{ color: '#ff4d4f' }}
      />
      
      <Button
        label={exportButtonLabel}
        view="secondary"
        size="s"
        onClick={onExport}
        className="button-rounded"
      />
    </div>
  )
}