import { Card } from '@consta/uikit/Card';
import { Checkbox } from '@consta/uikit/Checkbox';
import { Button } from '@consta/uikit/Button';
import { useState, useRef, useEffect } from 'react';

type Action = {
  label: string;
  onClick: () => void;
  icon?: string;
  danger?: boolean;
};

type Props<T> = {
  item: T;
  isSelected: boolean;
  onSelect: (id: number, selected: boolean) => void;
  onEdit?: (item: T) => void;
  actions?: Action[];
  children: React.ReactNode;
  getItemId: (item: T) => number;
  showActions?: boolean;
};

export function DataTableRow<T>({
  item,
  isSelected,
  onSelect,
  onEdit,
  actions = [],
  children,
  getItemId,
  showActions = true
}: Props<T>) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect(getItemId(item), e.target.checked);
  };
  
  const handleRowClick = () => {
    if (onEdit && !menuOpen) {
      onEdit(item);
    }
  };
  
  const allActions = [...actions];
  if (onEdit) {
    allActions.unshift({ label: '✎ Редактировать', onClick: () => onEdit(item) });
  }
  
  return (
    <Card
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        borderRadius: 0,
        backgroundColor: isSelected ? 'var(--accent-bg)' : 'transparent',
        cursor: onEdit ? 'pointer' : 'default',
        transition: 'background-color 0.2s'
      }}
      onClick={handleRowClick}
      onMouseEnter={(e: any) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'var(--social-bg)';
        }
      }}
      onMouseLeave={(e: any) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      {/* Чекбокс */}
      <div style={{ width: 40, marginRight: 16, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        <Checkbox checked={isSelected} onChange={handleCheckboxChange} size="m" />
      </div>
      
      {/* Контент (передаётся через children) */}
      {children}
      
      {/* Кнопка действий */}
      {showActions && allActions.length > 0 && (
        <div style={{ width: 80, flexShrink: 0, textAlign: 'right' }} onClick={e => e.stopPropagation()}>
          <div style={{ position: 'relative' }} ref={menuRef}>
            <Button
              view="clear"
              form="round"
              size="s"
              label="⋮"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              style={{ fontSize: '18px', lineHeight: 1, padding: '4px 8px' }}
            />
            {menuOpen && (
              <div style={{
                position: 'absolute',
                left: 'auto',
                top: '100%',
                zIndex: 1000,
                minWidth: 180,
                overflow: 'hidden'
              }}>
                {allActions.map((action, idx) => (
                  <Button
                    key={idx}
                    label={action.label}
                    view="ghost"
                    size="xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick();
                      setMenuOpen(false);
                    }}
                    style={{
                      justifyContent: 'flex-start',
                      width: '100%'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}