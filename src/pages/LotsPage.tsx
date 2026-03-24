import { useEffect, useState } from 'react'
import { Button } from '@consta/uikit/Button'
import { Badge } from '@consta/uikit/Badge'
import type { Lot } from '../types/Lot'
import { lotApi } from '../api/LotApi'
import LotDrawer from '../components/lots/LotDrawer'
import LotCard from '../components/lots/LotCard'
import Pagination from '../components/Pagination'
import LotFilters from '../components/lots/LotFilters'
import type { CurrencyOption, NdsOption } from '../components/lots/LotFilters'
import SelectedActionsPanel from '../components/SelectedActionsPanel'
import DataTable from '../components/DataTable'
import type { Column } from '../components/DataTable'
import { useNotifications } from '../context/NotificationContext'

export default function LotsPage() {
  const [allLots, setAllLots] = useState<Lot[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedLotId, setSelectedLotId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())

  const { showInfo, showSuccess, showError } = useNotifications()

  const [selectedCurrencies, setSelectedCurrencies] = useState<CurrencyOption[]>([])
  const [selectedNdsRates, setSelectedNdsRates] = useState<NdsOption[]>([])

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const loadLots = async () => {
    setLoading(true)
    try {
      const res = await lotApi.getAll()
      const sortedLots = [...res.data].sort((a, b) => a.id - b.id)
      setAllLots(sortedLots)
      setCurrentPage(1)
      setSelectedRows(new Set())
    } catch (error) {
      console.error('Load lots error:', error)
      showError('Ошибка загрузки лотов')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLots()
  }, [])

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
      showSuccess('Лот успешно обновлен')
    } catch (error) {
      console.error('Ошибка обновления лота:', error)
      throw error
    }
  }

  const normalizeNdsRate = (ndsRate: string | undefined): string => {
    if (!ndsRate) return ''

    const normalized = ndsRate.trim().toUpperCase()

    if (normalized === 'NDS_0' || normalized === 'NDS_18' || normalized === 'NDS_20') {
      return normalized
    }

    if (normalized === 'БЕЗ НДС' || normalized === 'БЕЗНДС') return 'NDS_0'
    if (normalized === '18%' || normalized === '18') return 'NDS_18'
    if (normalized === '20%' || normalized === '20') return 'NDS_20'

    return normalized
  }

  const filteredLots = allLots.filter((lot) => {
    const bySearch = !search ||
      lot.name.toLowerCase().includes(search.toLowerCase())

    const byCurrency = selectedCurrencies.length === 0 ||
      selectedCurrencies.some(curr => curr.value === lot.currencyCode)

    const normalizedLotNds = normalizeNdsRate(lot.ndsRate)
    const byNds = selectedNdsRates.length === 0 ||
      selectedNdsRates.some(nds => nds.value === normalizedLotNds)

    return bySearch && byCurrency && byNds
  })

  const indexOfLastItem = currentPage * pageSize
  const indexOfFirstItem = indexOfLastItem - pageSize
  const currentLots = filteredLots.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredLots.length / pageSize)

  const openCreate = () => {
    setSelectedLotId(null)
    setDrawerOpen(true)
  }

  const openEdit = (lot: Lot) => {
    setSelectedLotId(lot.id)
    setDrawerOpen(true)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
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
      console.error('Ошибка удаления:', error)
      alert('Ошибка при удалении. Проверьте консоль.')
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
    link.setAttribute('download', `лоты_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    showInfo(`Экспортировано ${selectedRows.size} лот(ов)`)
  }

  const resetFilters = () => {
    setSearch('')
    setSelectedCurrencies([])
    setSelectedNdsRates([])
    setCurrentPage(1)
  }

  const activeFiltersCount = selectedCurrencies.length + selectedNdsRates.length + (search ? 1 : 0)

  const columns: Column<Lot>[] = [
    { title: 'Наименование лота', field: 'name', flex: 2 },
    { title: 'Стоимость', field: 'price', minWidth: '120', flex: 1, align: 'right' },
    { title: 'Валюта', field: 'currencyCode', minWidth: '80', flex: 0.5 },
    { title: 'НДС', field: 'ndsRate', minWidth: '100', flex: 0.8 },
    { title: 'Грузополучатель', field: 'placeDelivery', flex: 1.5 },
    { title: 'Дата поставки', field: 'dateDelivery', minWidth: '120', flex: 1 }
  ]

  return (
    <div style={{
      padding: '40px',
      maxWidth: 1280,
      margin: '0 auto',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Заголовок с кнопками */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{ margin: 0 }}>Лоты</h2>
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
          label="+ Добавить лот"
          onClick={openCreate}
          className="button-rounded"
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
          setSelectedCurrencies(currencies)
          setCurrentPage(1)
        }}
        selectedNdsRates={selectedNdsRates}
        onNdsRatesChange={(ndsRates) => {
          setSelectedNdsRates(ndsRates)
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
        emptyText={search || activeFiltersCount > 0 ? 'Ничего не найдено' : 'Нет созданных лотов'}
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
        onClose={() => setDrawerOpen(false)}
        reload={loadLots}
      />
    </div>
  )
}