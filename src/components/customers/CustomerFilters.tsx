import { useState, useEffect } from 'react'
import { Button } from '@consta/uikit/Button'
import { TextField } from '@consta/uikit/TextField'
import { Combobox } from '@consta/uikit/Combobox'
import { Card } from '@consta/uikit/Card'
import { Tag } from '@consta/uikit/Tag'
import { Text } from '@consta/uikit/Text'

export type CustomerTypeOption = {
    label: string
    value: 'ALL' | 'ORGANIZATION' | 'PERSON'
}

const customerTypeOptions: CustomerTypeOption[] = [
    { label: 'Все типы', value: 'ALL' },
    { label: 'Юридические лица', value: 'ORGANIZATION' },
    { label: 'Физические лица', value: 'PERSON' }
]

type Props = {
    search: string
    onSearchChange: (value: string) => void
    selectedType: 'ALL' | 'ORGANIZATION' | 'PERSON'
    onTypeChange: (type: 'ALL' | 'ORGANIZATION' | 'PERSON') => void
    onReset: () => void
    activeFiltersCount: number
}

export default function CustomerFilters({
    search = '',
    onSearchChange,
    selectedType = 'ALL',
    onTypeChange,
    onReset,
    activeFiltersCount = 0
}: Props) {
    const [searchValue, setSearchValue] = useState(search)
    const [typeSearchValue, setTypeSearchValue] = useState<string>('')

    const selectedTypeOption = customerTypeOptions.find(
        option => option.value === selectedType
    )

    const handleSearchChange = (value: string | null) => {
        const newValue = value || ''
        setSearchValue(newValue)
        onSearchChange(newValue)
    }

    const handleTypeChange = (value: CustomerTypeOption | null) => {
        if (value) {
            onTypeChange(value.value)
        } else {
            onTypeChange('ALL')
        }
    }

    const getTypeLabel = (type: 'ALL' | 'ORGANIZATION' | 'PERSON') => {
        switch (type) {
            case 'ORGANIZATION':
                return 'Юридическое лицо'
            case 'PERSON':
                return 'Физическое лицо'
            default:
                return 'Все'
        }
    }

    useEffect(() => {
        setSearchValue(search)
    }, [search])

    const handleReset = () => {
        setSearchValue('')
        setTypeSearchValue('')
        onReset()
    }

    const hasActiveFilters = selectedType !== 'ALL' || search

    return (
        <Card shadow={false} style={{ marginBottom: 20 }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: '0.5fr 1.5fr auto',
                gap: 16,
                alignItems: 'end'
            }}>
                {/* Тип контрагента */}
                <div style={{ minWidth: 0 }}>
                    <Combobox
                        items={customerTypeOptions}
                        value={selectedTypeOption}
                        onChange={handleTypeChange}
                        searchValue={typeSearchValue}
                        onSearchValueChange={setTypeSearchValue}
                        getItemLabel={(item) => item.label}
                        getItemKey={(item) => item.value}
                        placeholder="Выберите тип"
                        size="m"
                        form="round"
                        style={{ width: '100%' }}
                    />
                </div>

                {/* Поиск по названию или ИНН */}
                <div style={{ minWidth: 0 }}>
                    <TextField
                        value={searchValue}
                        onChange={handleSearchChange}
                        placeholder="🔎 Поиск по названию или ИНН..."
                        size="m"
                        form="round"
                    />
                </div>

                {/* Кнопка очистки */}
                <div style={{ minWidth: 0 }}>
                    <Button
                        label="✕ Очистить"
                        view="secondary"
                        size="m"
                        onClick={handleReset}
                        className="button-rounded"
                        disabled={activeFiltersCount === 0}
                        style={{
                            opacity: activeFiltersCount === 0 ? 0.5 : 1,
                            cursor: activeFiltersCount === 0 ? 'not-allowed' : 'pointer'
                        }}
                    />
                </div>
            </div>

            {/* Отображение выбранных фильтров в виде тегов */}
            {hasActiveFilters && (
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: '1px solid var(--border)'
                }}>
                    <Text size="s" view="ghost" style={{ marginRight: 8 }}>
                        Фильтры:
                    </Text>
                    {selectedType !== 'ALL' && (
                        <Tag
                            label={`Тип: ${getTypeLabel(selectedType)}`}
                            size="s"
                            mode="cancel"
                            onCancel={() => onTypeChange('ALL')}
                        />
                    )}
                    {search && (
                        <Tag
                            label={`Поиск: ${search}`}
                            size="s"
                            mode="cancel"
                            onCancel={() => {
                                setSearchValue('')
                                onSearchChange('')
                            }}
                        />
                    )}
                </div>
            )}
        </Card>
    )
}