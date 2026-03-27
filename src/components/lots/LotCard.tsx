import { Badge } from '@consta/uikit/Badge';
import { Text } from '@consta/uikit/Text';
import { TextField } from '@consta/uikit/TextField';
import { Select } from '@consta/uikit/Select';
import { DatePicker } from '@consta/uikit/DatePicker';
import { Button } from '@consta/uikit/Button';
import { useState } from 'react';
import type { Lot } from '../../types/Lot';
import { DataTableRow } from '../DataTableRow';
import type { Column } from '../DataTable';
import { useNotifications } from '../../context/NotificationContext'
import { format } from 'date-fns'

type Props = {
    lot: Lot;
    isSelected: boolean;
    onSelect: (id: number, selected: boolean) => void;
    onEdit: (lot: Lot) => void;
    onUpdate: (id: number, updatedLot: Partial<Lot>) => Promise<void>;
    columns?: Column<Lot>[];
};

const currencyOptions = [
    { label: 'RUB', value: 'RUB' },
    { label: 'USD', value: 'USD' },
    { label: 'EUR', value: 'EUR' }
];

const ndsOptions = [
    { label: 'Без НДС', value: 'NDS_0' },
    { label: '18%', value: 'NDS_18' },
    { label: '20%', value: 'NDS_20' }
];

const normalizeNdsRate = (ndsRate: string | undefined): string => {
    if (!ndsRate) return 'NDS_20';
    const normalized = ndsRate.trim().toUpperCase();
    if (normalized === 'NDS_0' || normalized === 'NDS_18' || normalized === 'NDS_20') {
        return normalized;
    }
    if (normalized === 'БЕЗ НДС') return 'NDS_0';
    if (normalized === '18%') return 'NDS_18';
    if (normalized === '20%') return 'NDS_20';
    return 'NDS_20';
};

const formatNdsDisplay = (ndsRate?: string): string => {
    if (!ndsRate) return '—';
    if (ndsRate === 'NDS_0') return 'Без НДС';
    if (ndsRate === 'NDS_18') return '18%';
    if (ndsRate === 'NDS_20') return '20%';
    return ndsRate;
};

export default function LotCard({
    lot,
    isSelected,
    onSelect,
    onEdit,
    onUpdate,
    columns
}: Props) {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    const { showSuccess, showError } = useNotifications()

    const [editData, setEditData] = useState({
        name: lot.lotName,
        price: lot.price,
        currencyCode: lot.currencyCode,
        ndsRate: normalizeNdsRate(lot.ndsRate),
        placeDelivery: lot.placeDelivery,
        dateDelivery: lot.dateDelivery ? new Date(lot.dateDelivery) : null
    });

    const formatPrice = (price?: number) => {
        if (price === null || price === undefined) return '—';
        return new Intl.NumberFormat('ru-RU', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(price);
    };

    const formatDate = (date?: string | null) => {
        if (!date) return '—';
        const d = new Date(date);
        return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('ru-RU');
    };

    const handleFieldChange = (field: string, value: any) => {
        setEditData(prev => ({ ...prev, [field]: value }));
    };

    const formatDateForApi = (date: Date | null): string => {
        if (!date) return ''
        return format(date, 'yyyy-MM-dd')
    }

    const saveChanges = async () => {
        setLoading(true);
        try {
            await onUpdate(lot.id, {
                lotName: editData.name,
                price: editData.price,
                currencyCode: editData.currencyCode,
                ndsRate: editData.ndsRate,
                placeDelivery: editData.placeDelivery,
                dateDelivery: editData.dateDelivery ? formatDateForApi(editData.dateDelivery) : ''
            });
            setIsEditing(false);
            showSuccess('Изменения успешно сохранены');
        } catch (error) {
            console.error("Error saving changes:", error);
            showError('Ошибка при сохранении изменений');
        } finally {
            setLoading(false);
        }
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setEditData({
            name: lot.lotName,
            price: lot.price,
            currencyCode: lot.currencyCode,
            ndsRate: normalizeNdsRate(lot.ndsRate),
            placeDelivery: lot.placeDelivery,
            dateDelivery: lot.dateDelivery ? new Date(lot.dateDelivery) : null
        });
    };

    const renderEditField = (field: keyof Lot) => {
        const selectedCurrency = currencyOptions.find(c => c.value === editData.currencyCode);
        const selectedNds = ndsOptions.find(n => n.value === editData.ndsRate);

        switch (field) {
            case 'lotName':
                return (
                    <TextField
                        size="s"
                        value={editData.name}
                        onChange={(v: string | null) => handleFieldChange('name', v || '')}
                        style={{ width: '100%' }}
                    />
                );
            case 'price':
                return (
                    <TextField
                        size="s"
                        type="number"
                        value={String(editData.price ?? '')}
                        onChange={(v: string | null) => handleFieldChange('price', Number(v) || 0)}
                        style={{ width: '100%' }}
                    />
                );
            case 'currencyCode':
                return (
                    <Select
                        size="s"
                        items={currencyOptions}
                        value={selectedCurrency}
                        onChange={(v: typeof currencyOptions[0] | null) =>
                            handleFieldChange('currencyCode', v?.value || 'RUB')
                        }
                        getItemLabel={(item) => item.label}
                        getItemKey={(item) => item.value}
                        style={{ width: '100%' }}
                    />
                );
            case 'ndsRate':
                return (
                    <Select
                        size="s"
                        items={ndsOptions}
                        value={selectedNds}
                        onChange={(v: typeof ndsOptions[0] | null) =>
                            handleFieldChange('ndsRate', v?.value || 'NDS_20')
                        }
                        getItemLabel={(item) => item.label}
                        getItemKey={(item) => item.value}
                        style={{ width: '100%' }}
                    />
                );
            case 'placeDelivery':
                return (
                    <TextField
                        size="s"
                        value={editData.placeDelivery || ''}
                        onChange={(v: string | null) => handleFieldChange('placeDelivery', v || '')}
                        style={{ width: '100%' }}
                    />
                );
            case 'dateDelivery':
                return (
                    <DatePicker
                        size="s"
                        value={editData.dateDelivery}
                        onChange={(date: Date | null) => handleFieldChange('dateDelivery', date)}
                        format="dd.MM.yyyy"
                        placeholder="Выберите дату"
                        style={{ width: '100%' }}
                    />
                );
            default:
                return <Text size="s">—</Text>;
        }
    };

    const renderCell = (field: keyof Lot) => {
        switch (field) {
            case 'lotName':
                return <Text size="s" weight="medium">{lot.lotName || '—'}</Text>;
            case 'price':
                return <Text size="s">{formatPrice(lot.price)}</Text>;
            case 'currencyCode':
                return <Text size="s">{lot.currencyCode || '—'}</Text>;
            case 'ndsRate':
                return (
                    <Badge
                        label={formatNdsDisplay(lot.ndsRate)}
                        size="s"
                        status={lot.ndsRate === 'Без НДС' ? 'success' : 'system'}
                    />
                );
            case 'placeDelivery':
                return <Text size="s">{lot.placeDelivery || '—'}</Text>;
            case 'dateDelivery':
                return <Text size="s">{formatDate(lot.dateDelivery)}</Text>;
            default:
                return <Text size="s">—</Text>;
        }
    };

    if (isEditing) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                backgroundColor: isSelected ? 'var(--accent-bg)' : 'transparent'
            }}>
                {columns ? (
                    columns.map((column, index) => (
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
                            {renderEditField(column.field)}
                        </div>
                    ))
                ) : (
                    <>
                        <div style={{ flex: 2, marginRight: 16 }}>{renderEditField('lotName')}</div>
                        <div style={{ minWidth: 120, marginRight: 16 }}>{renderEditField('price')}</div>
                        <div style={{ minWidth: 80, marginRight: 16 }}>{renderEditField('currencyCode')}</div>
                        <div style={{ minWidth: 100, marginRight: 16 }}>{renderEditField('ndsRate')}</div>
                        <div style={{ flex: 1.5, marginRight: 16 }}>{renderEditField('placeDelivery')}</div>
                        <div style={{ minWidth: 120, marginRight: 16 }}>{renderEditField('dateDelivery')}</div>
                    </>
                )}

                <div style={{ width: 80, textAlign: 'right', marginLeft: 10 }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <Button
                            size="s"
                            form="round"
                            view="primary"
                            label="✓"
                            loading={loading}
                            onClick={saveChanges}
                        />
                        <Button
                            size="s"
                            form="round"
                            view="secondary"
                            label="✕"
                            onClick={cancelEditing}
                        />
                    </div>
                </div>
            </div>
        );
    }

    const actions = [
        { label: '✎ Редактировать (inline)', onClick: () => setIsEditing(true) }
    ];

    return (
        <DataTableRow
            item={lot}
            isSelected={isSelected}
            onSelect={onSelect}
            onEdit={onEdit}
            actions={actions}
            getItemId={(l) => l.id}
        >
            {columns ? (
                columns.map((column, index) => (
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
                        {column.render ? column.render(lot) : renderCell(column.field)}
                    </div>
                ))
            ) : (
                <>
                    <div style={{ flex: 2, marginRight: 16 }}>{renderCell('lotName')}</div>
                    <div style={{ minWidth: 120, marginRight: 16 }}>{renderCell('price')}</div>
                    <div style={{ minWidth: 80, marginRight: 16 }}>{renderCell('currencyCode')}</div>
                    <div style={{ minWidth: 100, marginRight: 16 }}>{renderCell('ndsRate')}</div>
                    <div style={{ flex: 1.5, marginRight: 16 }}>{renderCell('placeDelivery')}</div>
                    <div style={{ minWidth: 120, marginRight: 16 }}>{renderCell('dateDelivery')}</div>
                </>
            )}
        </DataTableRow>
    );
}