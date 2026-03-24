import { useState, useEffect } from 'react'
import { Button } from '@consta/uikit/Button'
import { TextField } from '@consta/uikit/TextField'
import { Combobox } from '@consta/uikit/Combobox'
import { Card } from '@consta/uikit/Card'
import { Tag } from '@consta/uikit/Tag'
import { Text } from '@consta/uikit/Text'

export type CurrencyOption = {
    label: string
    value: string
}

export type NdsOption = {
    label: string
    value: string
}

const currencyOptions: CurrencyOption[] = [
    { label: 'RUB', value: 'RUB' },
    { label: 'USD', value: 'USD' },
    { label: 'EUR', value: 'EUR' }
]

const ndsOptions: NdsOption[] = [
    { label: 'Без НДС', value: 'NDS_0' },
    { label: '18%', value: 'NDS_18' },
    { label: '20%', value: 'NDS_20' }
]

type Props = {
    search: string
    onSearchChange: (value: string) => void
    selectedCurrencies: CurrencyOption[]
    onCurrenciesChange: (currencies: CurrencyOption[]) => void
    selectedNdsRates: NdsOption[]
    onNdsRatesChange: (ndsRates: NdsOption[]) => void
    onReset: () => void
    activeFiltersCount: number
    showResetButton?: boolean
}

export default function LotFilters({
    search = '',
    onSearchChange,
    selectedCurrencies = [],
    onCurrenciesChange,
    selectedNdsRates = [],
    onNdsRatesChange,
    onReset,
    activeFiltersCount = 0
}: Props) {
    const [currencySearchValue, setCurrencySearchValue] = useState<string>('')
    const [ndsSearchValue, setNdsSearchValue] = useState<string>('')
    const [searchValue, setSearchValue] = useState(search)

    useEffect(() => {
        setSearchValue(search)
    }, [search])

    return (
        <Card shadow={false} style={{ marginBottom: 20 }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: '0.5fr 0.5fr 1.5fr',
                gap: 16,
                alignItems: 'end'
            }}>
                <div style={{ minWidth: 0 }}>
                    <Combobox
                        items={currencyOptions}
                        value={selectedCurrencies}
                        onChange={(newValue) => {
                            onCurrenciesChange(newValue || [])
                        }}
                        searchValue={currencySearchValue}
                        onSearchValueChange={setCurrencySearchValue}
                        getItemLabel={(item) => item.label}
                        getItemKey={(item) => item.value}
                        placeholder="Все валюты"
                        size="m"
                        form="round"
                        multiple={true}
                        selectAll={true}
                        allSelectedAllLabel="Все валюты"
                        style={{ width: '100%' }}
                    />
                </div>
                <div style={{ minWidth: 0 }}>
                    <Combobox
                        items={ndsOptions}
                        value={selectedNdsRates}
                        onChange={(newValue) => {
                            onNdsRatesChange(newValue || [])
                        }}
                        searchValue={ndsSearchValue}
                        onSearchValueChange={setNdsSearchValue}
                        getItemLabel={(item) => item.label}
                        getItemKey={(item) => item.value}
                        placeholder="Все ставки НДС"
                        size="m"
                        form="round"
                        multiple={true}
                        selectAll={true}
                        allSelectedAllLabel="Все ставки НДС"
                        style={{ width: '100%' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', minWidth: 0 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <TextField
                            value={searchValue}
                            onChange={(value) => {
                                onSearchChange(value || '')
                            }}
                            placeholder="🔎 Поиск по наименованию лота..."
                            size="m"
                            form="round"
                        />
                    </div>
                    <Button
                        label="✕ Сбросить"
                        view="secondary"
                        size="m"
                        form="round"
                        onClick={onReset}
                        disabled={activeFiltersCount === 0}
                    />
                </div>
            </div>

            {/* Отображение выбранных фильтров в виде тегов */}
            {((selectedCurrencies && selectedCurrencies.length > 0) || (selectedNdsRates && selectedNdsRates.length > 0)) || search && (
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: '1px solid var(--border)'
                }}>
                    <Text size="xs" view="ghost" style={{ marginRight: 8 }}>
                        Фильтры:
                    </Text>
                    {selectedCurrencies && selectedCurrencies.map(currency => (
                        <Tag
                            key={currency.value}
                            label={`Валюта: ${currency.label}`}
                            size="s"
                            mode="cancel"
                            onCancel={() => {
                                onCurrenciesChange(selectedCurrencies.filter(c => c.value !== currency.value))
                            }}
                        />
                    ))}
                    {selectedNdsRates && selectedNdsRates.map(nds => (
                        <Tag
                            key={nds.value}
                            label={`НДС: ${nds.label}`}
                            size="s"
                            mode="cancel"
                            onCancel={() => {
                                onNdsRatesChange(selectedNdsRates.filter(n => n.value !== nds.value))
                            }}
                        />
                    ))}
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