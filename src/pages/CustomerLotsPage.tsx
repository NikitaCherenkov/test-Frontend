import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@consta/uikit/Button'
import { Text } from '@consta/uikit/Text'
import { Badge } from '@consta/uikit/Badge'
import { Card } from '@consta/uikit/Card'
import type { Customer } from '../types/Customer'
import type { Lot } from '../types/Lot'
import { lotApi } from '../api/LotApi'
import { customerApi } from '../api/CustomerApi'
import LotCard from '../components/lots/LotCard'
import LotDrawer from '../components/lots/LotDrawer'
import Pagination from '../components/Pagination'
import LotFilters from '../components/lots/LotFilters'
import type { CurrencyOption, NdsOption } from '../components/lots/LotFilters'
import SelectedActionsPanel from '../components/SelectedActionsPanel'
import DataTable from '../components/DataTable'
import type { Column } from '../components/DataTable'
import { useNotifications } from '../context/NotificationContext'

type Params = { id: string }

export default function CustomerLotsPage() {
  const { id } = useParams<Params>()
  const customerId = Number(id)
  const navigate = useNavigate()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [allLots, setAllLots] = useState<Lot[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())

  const { showSuccess, showError, showInfo } = useNotifications()

  const [selectedCurrencies, setSelectedCurrencies] = useState<CurrencyOption[]>([])
  const [selectedNdsRates, setSelectedNdsRates] = useState<NdsOption[]>([])

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedLotId, setSelectedLotId] = useState<number | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const loadCustomer = async () => {
    if (!customerId) return
    try {
      const response = await customerApi.getById(customerId)
      setCustomer(response.data)
    } catch (e) {
      console.error(e)
      navigate('/customers')
    }
  }

  const loadLots = async () => {
    if (!customerId) return
    setLoading(true)
    try {
      const response = await lotApi.getAllByCustomerId(customerId)
      const sortedLots = [...response.data].sort((a, b) => a.id - b.id)
      setAllLots(sortedLots)
      setCurrentPage(1)
      setSelectedRows(new Set())
    } catch (error: any) {
      console.error('Load lots error:', error)
      showError('Ошибка загрузки лотов.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomer()
  }, [customerId])

  useEffect(() => {
    if (customer) loadLots()
  }, [customer])

  const isLotDataValid = (lot: Lot): boolean => {
    if (!lot.name || lot.name.trim() === '') { showError('Введите наименование лота'); return false }
    if (!lot.placeDelivery || lot.placeDelivery.trim() === '') { showError('Введите место доставки'); return false }
    if (lot.price == null || isNaN(lot.price) || lot.price < 0) { showError('Введите корректную цену'); return false }
    if (!lot.currencyCode) { showError('Выберите валюту'); return false }
    if (!lot.ndsRate) { showError('Выберите ставку НДС'); return false }

    return true
  }

  const handleUpdateLot = async (id: number, updatedData: Partial<Lot>) => {
    try {
      if (!isLotDataValid({ ...updatedData } as Lot)) return

      await lotApi.update(id, updatedData)
      setAllLots(prevLots =>
        prevLots.map(lot =>
          lot.id === id ? { ...lot, ...updatedData } : lot
        )
      )
      showSuccess('Лот успешно обновлен.')
    } catch (error) {
      console.error('Update lot error:', error)
      showError('Ошибка обновления лота.')
      throw error
    }
  }

  const normalizeNdsRate = (ndsRate: string | undefined): string => {
    if (!ndsRate) return ''

    const normalized = ndsRate.trim().toUpperCase()

    if (normalized === 'NDS_0' || normalized === 'NDS_18' || normalized === 'NDS_20') {
      return normalized
    }

    if (normalized === 'БЕЗ НДС') return 'NDS_0'
    if (normalized === '18%') return 'NDS_18'
    if (normalized === '20%') return 'NDS_20'

    return normalized
  }

  const filteredLots = useMemo(() => {
    return allLots.filter((lot) => {
      const bySearch =
        !search || lot.name.toLowerCase().includes(search.toLowerCase())

      const byCurrency = selectedCurrencies.length === 0 ||
        selectedCurrencies.some(curr => curr.value === lot.currencyCode)

      const normalizedLotNds = normalizeNdsRate(lot.ndsRate)
      const byNds = selectedNdsRates.length === 0 ||
        selectedNdsRates.some(nds => nds.value === normalizedLotNds)

      return bySearch && byCurrency && byNds
    })
  }, [allLots, search, selectedCurrencies, selectedNdsRates])

  const indexOfLastItem = currentPage * pageSize
  const indexOfFirstItem = indexOfLastItem - pageSize
  const currentLots = filteredLots.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredLots.length / pageSize)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  const openNew = () => {
    setSelectedLotId(null)
    setDrawerOpen(true)
  }

  const openEdit = (lot: Lot) => {
    setSelectedLotId(lot.id)
    setDrawerOpen(true)
  }

  const handleSelectRow = (id: number, selected: boolean) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedRows.size === currentLots.length && currentLots.every(l => selectedRows.has(l.id))) {
      setSelectedRows(new Set())
    } else {
      const newSet = new Set(selectedRows)
      currentLots.forEach(l => newSet.add(l.id))
      setSelectedRows(newSet)
    }
  }

  const handleDeleteSelected = async () => {
    if (!confirm(`Удалить ${selectedRows.size} лот(ов)?`)) return

    try {
      const deletePromises = Array.from(selectedRows).map(id =>
        lotApi.delete(id)
      )
      await Promise.all(deletePromises)
      await loadLots()
      setSelectedRows(new Set())
    } catch (error) {
      console.error('Delete lots error:', error)
      showError('Ошибка при удалении.')
    }
  }

  const handleExportSelected = () => {
    const selectedLots = allLots.filter(l => selectedRows.has(l.id))

    const headers = ['Наименование', 'Код контрагента', 'Стоимость', 'Валюта', 'НДС', 'Грузополучатель', 'Дата поставки']
    const rows = selectedLots.map(l => [
      l.name,
      l.customerCode,
      l.price,
      l.currencyCode,
      l.ndsRate,
      l.placeDelivery,
      new Date(l.dateDelivery).toLocaleDateString('ru-RU')
    ])

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `лоты_контрагента_${customer?.code}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    showInfo(`Экспортировано ${selectedRows.size} лот(ов).`)
  }

  const resetFilters = () => {
    setSearch('')
    setSelectedCurrencies([])
    setSelectedNdsRates([])
    setCurrentPage(1)
  }

  const activeFiltersCount = (selectedCurrencies?.length || 0) + (selectedNdsRates?.length || 0) + (search ? 1 : 0)

  const columns: Column<Lot>[] = [
    { title: 'Наименование лота', field: 'name', flex: 2 },
    { title: 'Стоимость', field: 'price', minWidth: '120', flex: 1, align: 'right' },
    { title: 'Валюта', field: 'currencyCode', minWidth: '80', flex: 0.5 },
    { title: 'НДС', field: 'ndsRate', minWidth: '100', flex: 0.8 },
    { title: 'Грузополучатель', field: 'placeDelivery', flex: 1.5 },
    { title: 'Дата поставки', field: 'dateDelivery', minWidth: '120', flex: 1 }
  ]

  return (
    <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
      {/* Верхний блок - информация о контрагенте */}
      <Card shadow={false} style={{ marginBottom: 24 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 24
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <Text as="h2" size="xl" weight="bold" style={{ margin: 0 }}>
                {customer ? customer.name : 'Контрагент не найден'}
              </Text>
              {customer && (
                <Badge label={`${customer.code}`} size="m" status="normal" />
              )}
              {customer && (
                <Button
                  label="← Редактировать"
                  view="secondary"
                  form="round"
                  onClick={() => navigate(`/customers/${customerId}`)}
                />
              )}
            </div>
            {customer && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                <div>
                  <Text size="s" weight="light">🏢 ИНН {customer.inn || '—'}</Text>
                </div>
                {customer.customerType === 'ORGANIZATION' && (
                  <div>
                    <Text size="s" weight="light">📍 КПП {customer.kpp || '—'}</Text>
                  </div>
                )}
                <div>
                  <Text size="s" weight="light">📧 {customer.email || '—'}</Text>
                </div>
              </div>
            )}
          </div>
          <Button
            label="← К списку контрагентов"
            view="secondary"
            form="round"
            onClick={() => navigate('/customers')}
          />
        </div>
      </Card>

      {/* Второй блок - заголовок лотов */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Text as="h3" size="l" weight="bold" style={{ margin: 0 }}>
            Лоты контрагента
          </Text>
          <Badge
            label={`${filteredLots.length} записей`}
            size="m"
            status="system"
          />
          {activeFiltersCount > 0 && (
            <Badge
              label={`Фильтры: ${activeFiltersCount}`}
              size="m"
              status="alert"
            />
          )}
        </div>
        <Button
          label="+ Создать лот"
          onClick={openNew}
          form="round"
        />
      </div>

      {/* Фильтры */}
      <LotFilters
        search={search}
        onSearchChange={(value) => {
          setSearch(value)
          setCurrentPage(1)
        }}
        selectedCurrencies={selectedCurrencies}
        onCurrenciesChange={(currencies) => {
          setSelectedCurrencies(currencies || [])
          setCurrentPage(1)
        }}
        selectedNdsRates={selectedNdsRates}
        onNdsRatesChange={(ndsRates) => {
          setSelectedNdsRates(ndsRates || [])
          setCurrentPage(1)
        }}
        onReset={resetFilters}
        activeFiltersCount={activeFiltersCount}
      />

      {/* Таблица данных */}
      <DataTable
        items={currentLots}
        selectedIds={selectedRows}
        onSelect={handleSelectRow}
        onSelectAll={handleSelectAll}
        columns={columns}
        getItemId={(lot) => lot.id}
        loading={loading}
        emptyText={search || activeFiltersCount > 0 ? 'Ничего не найдено' : 'Нет лотов для данного контрагента'}
        renderCard={(lot, isSelected, onSelect, cols) => (
          <LotCard
            key={lot.id}
            lot={lot}
            isSelected={isSelected}
            onSelect={onSelect}
            onEdit={openEdit}
            onUpdate={handleUpdateLot}
            columns={cols}
          />
        )}
      />

      {/* Пагинация */}
      {filteredLots.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          totalItems={filteredLots.length}
        />
      )}

      {/* Панель с выбранными элементами */}
      <SelectedActionsPanel
        selectedCount={selectedRows.size}
        onDelete={handleDeleteSelected}
        onExport={handleExportSelected}
      />

      <LotDrawer
        open={drawerOpen}
        lotId={selectedLotId}
        customerId={customerId}
        onClose={() => setDrawerOpen(false)}
        reload={loadLots}
      />
    </div>
  )
}