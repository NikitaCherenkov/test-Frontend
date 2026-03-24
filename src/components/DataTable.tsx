import type { ReactNode } from 'react'
import { Checkbox } from '@consta/uikit/Checkbox'
import { Loader } from '@consta/uikit/Loader';

export type Column<T> = {
  title: string
  field: keyof T
  width?: string
  flex?: number
  minWidth?: string
  align?: 'left' | 'center' | 'right'
  render?: (item: T) => ReactNode
}

type Props<T> = {
  items: T[]
  selectedIds: Set<number>
  onSelect: (id: number, selected: boolean) => void
  onSelectAll: () => void
  columns: Column<T>[]
  renderCard: (item: T, isSelected: boolean, onSelect: (id: number, selected: boolean) => void, columns: Column<T>[]) => ReactNode
  getItemId: (item: T) => number
  loading?: boolean
  emptyText?: string
  showHeader?: boolean
}

export default function DataTable<T>({
  items,
  selectedIds,
  onSelect,
  onSelectAll,
  columns,
  renderCard,
  getItemId,
  loading = false,
  emptyText = 'Нет данных',
  showHeader = true
}: Props<T>) {
  
  const isAllSelected = items.length > 0 && items.every(item => selectedIds.has(getItemId(item)))

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Loader/>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        color: 'var(--text)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        marginTop: 20
      }}>
        {emptyText}
      </div>
    )
  }

  // Формируем стили для шапки таблицы на основе колонок
  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: 'var(--social-bg)',
    borderBottom: '2px solid var(--border)',
    fontWeight: 600,
    fontSize: 14,
    color: 'var(--text-h)'
  }

  return (
    <div>
      {/* Шапка таблицы */}
      {showHeader && (
        <div style={headerStyles}>
          <div style={{ 
            width: 40, 
            marginRight: 16,
            flexShrink: 0
          }}>
            <Checkbox
              checked={isAllSelected}
              onChange={onSelectAll}
              size="m"
            />
          </div>
          {columns.map((column, index) => (
            <div
              key={String(column.field)}
              style={{
                flex: column.flex,
                width: column.width,
                minWidth: column.minWidth || 'auto',
                marginRight: index < columns.length - 1 ? 16 : 0,
                textAlign: column.align || 'left'
              }}
            >
              {column.title}
            </div>
          ))}
          <div style={{ 
            width: 80,
            flexShrink: 0,
            textAlign: 'right'
          }}>
            Действия
          </div>
        </div>
      )}

      {/* Список карточек */}
      <div style={{ marginTop: 0 }}>
        {items.map(item => renderCard(item, selectedIds.has(getItemId(item)), onSelect, columns))}
      </div>
    </div>
  )
}