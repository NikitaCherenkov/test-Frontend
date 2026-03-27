import { useEffect, useState } from 'react'
import { Button } from '@consta/uikit/Button'
import { Text } from '@consta/uikit/Text'
import type { Customer } from '../types/Customer'
import { customerApi } from '../api/CustomerApi'
import CustomerCard from '../components/customers/CustomerCard'
import CustomerDrawer from '../components/customers/CustomerDrawer'
import Pagination from '../components/Pagination'
import SelectedActionsPanel from '../components/SelectedActionsPanel'
import DataTable from '../components/DataTable'
import type { Column } from '../components/DataTable'
import CustomerFilters from '../components/customers/CustomerFilters'
import { useNotifications } from '../context/NotificationContext'
import { useParams, useNavigate } from 'react-router-dom'

export default function CustomersPage() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [allCustomers, setAllCustomers] = useState<Customer[]>([])
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
    const [selectedCustomerType, setSelectedCustomerType] = useState<'ALL' | 'ORGANIZATION' | 'PERSON'>('ALL')
    const [isDataLoaded, setIsDataLoaded] = useState(false)

    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const { showSuccess, showError, showInfo } = useNotifications()

    const filteredCustomers = allCustomers.filter(customer => {
        const matchesSearch =
            customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.customerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.customerInn.includes(searchTerm)

        const matchesType =
            selectedCustomerType === 'ALL' ||
            customer.customerType === selectedCustomerType

        return matchesSearch && matchesType
    })

    const resetFilters = () => {
        setSearchTerm('')
        setSelectedCustomerType('ALL')
        setCurrentPage(1)
    }

    const activeFiltersCount = (searchTerm ? 1 : 0) + (selectedCustomerType !== 'ALL' ? 1 : 0)

    const indexOfLastItem = currentPage * pageSize
    const indexOfFirstItem = indexOfLastItem - pageSize
    const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem)
    const totalPages = Math.ceil(filteredCustomers.length / pageSize)

    const loadCustomers = async () => {
        setLoading(true)
        try {
            const res = await customerApi.getAll()
            const sortedCustomers = [...res.data].sort((a, b) => a.id - b.id)
            setAllCustomers(sortedCustomers)
            setCurrentPage(1)
            setSelectedRows(new Set())
            setIsDataLoaded(true)
        } catch (error) {
            console.error('Load customers error:', error)
            showError('Ошибка загрузки контрагентов')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadCustomers()
    }, [])

    useEffect(() => {
        if (!isDataLoaded) return

        if (id) {
            const customerId = parseInt(id, 10)
            const customerExists = allCustomers.some(c => c.id === customerId)

            if (!isNaN(customerId) && customerExists) {
                setSelectedCustomerId(customerId)
                setDrawerOpen(true)
            } else if (customerId && !customerExists) {
                navigate('/customers', { replace: true })
                showError('Контрагент не найден')
            }
        } else {
            if (drawerOpen) {
                setDrawerOpen(false)
                setSelectedCustomerId(null)
            }
        }
    }, [id, allCustomers, isDataLoaded, navigate, showError])

    const openCreate = () => {
        setSelectedCustomerId(null)
        setDrawerOpen(true)
    }

    const openEdit = (customer: Customer) => {
        setSelectedCustomerId(customer.id)
        setDrawerOpen(true)
    }

    const handleCloseDrawer = () => {
        setDrawerOpen(false)
        setSelectedCustomerId(null)
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
        if (selectedRows.size === currentCustomers.length && currentCustomers.every(c => selectedRows.has(c.id))) {
            setSelectedRows(new Set())
        } else {
            const newSet = new Set(selectedRows)
            currentCustomers.forEach(c => newSet.add(c.id))
            setSelectedRows(newSet)
        }
    }

    const handleDeleteSelected = async () => {
        if (!confirm(`Удалить ${selectedRows.size} контрагента(ов)?`)) return

        try {
            const deletePromises = Array.from(selectedRows).map(id =>
                customerApi.delete(id)
            )
            await Promise.all(deletePromises)
            await loadCustomers()
            showSuccess(`Удалено ${selectedRows.size} контрагента(ов)...`)
            setSelectedRows(new Set())

            if (selectedCustomerId && selectedRows.has(selectedCustomerId)) {
                handleCloseDrawer()
            }
        } catch (error) {
            console.error('Delete customers error:', error)
            showError('Ошибка при удалении.')
        }
    }

    const handleExportSelected = () => {
        const selectedCustomers = allCustomers.filter(c => selectedRows.has(c.id))

        const headers = ['Код', 'Наименование', 'ИНН', 'КПП', 'Тип', 'Юр. адрес', 'Почт. адрес', 'Email', 'Вышестоящий']
        const rows = selectedCustomers.map(c => [
            c.customerCode,
            c.customerName,
            c.customerInn,
            c.customerKpp || '',
            c.customerType === 'ORGANIZATION' ? 'Юр. лицо' : 'Физ. лицо',
            c.customerLegalAddress || '',
            c.customerPostalAddress || '',
            c.customerEmail || '',
            allCustomers.find(p => p.customerCode === c.customerCodeMain)?.customerName || ''
        ])

        const csvContent = [
            headers.join(';'),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
        ].join('\n')

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `контрагенты_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        showInfo(`Экспортировано ${selectedCustomers.length} контрагентов`)
    }

    const columns: Column<Customer>[] = [
        { title: 'Код', field: 'customerCode', minWidth: '100', flex: 1 },
        { title: 'Наименование', field: 'customerName', flex: 2 },
        { title: 'ИНН', field: 'customerInn', minWidth: '120', flex: 1 },
        { title: 'Тип лица', field: 'customerType', minWidth: '100', flex: 1 },
        { title: 'Вышестоящий', field: 'customerCodeMain', flex: 1.5 }
    ]

    return (
        <div style={{
            padding: '40px',
            maxWidth: 1126,
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
                <h2 style={{ margin: 0 }}>📋 Контрагенты</h2>
            </div>

            {/* Заголовок с кнопками */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
                flexWrap: 'wrap',
                gap: 12
            }}>
                <Text weight='bold'>
                    📌 Всего записей: {filteredCustomers.length}
                </Text>
                <Button
                    label="+ Добавить контрагента"
                    onClick={openCreate}
                    className="button-rounded"
                />
            </div>

            {/* Фильтры */}
            <CustomerFilters
                search={searchTerm}
                onSearchChange={(value) => {
                    setSearchTerm(value)
                    setCurrentPage(1)
                }}
                selectedType={selectedCustomerType}
                onTypeChange={(type) => {
                    setSelectedCustomerType(type)
                    setCurrentPage(1)
                }}
                onReset={resetFilters}
                activeFiltersCount={activeFiltersCount}
            />

            {/* Таблица данных */}
            <DataTable
                items={currentCustomers}
                selectedIds={selectedRows}
                onSelect={handleSelectRow}
                onSelectAll={handleSelectAll}
                columns={columns}
                getItemId={(customer) => customer.id}
                loading={loading}
                emptyText={searchTerm ? 'Ничего не найдено' : 'Нет созданных контрагентов'}
                renderCard={(customer, isSelected, onSelect, cols) => (
                    <CustomerCard
                        key={customer.id}
                        customer={customer}
                        isSelected={isSelected}
                        onSelect={onSelect}
                        onEdit={openEdit}
                        allCustomers={allCustomers}
                        columns={cols}
                    />
                )}
            />

            {/* Пагинация */}
            {filteredCustomers.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    totalItems={filteredCustomers.length}
                />
            )}

            {/* Панель с выбранными элементами */}
            <SelectedActionsPanel
                selectedCount={selectedRows.size}
                onDelete={handleDeleteSelected}
                onExport={handleExportSelected}
            />

            {/* Подсказка внизу страницы */}
            <div style={{
                marginTop: 24,
                padding: '12px 16px',
                backgroundColor: 'var(--social-bg)',
                borderRadius: 8,
                border: '1px solid var(--border)',
                textAlign: 'center'
            }}>
                <Text size="xs">
                    ⚡ Поля КПП, Юр. адрес, Почтовый адрес, Email доступны в карточке контрагента (кликните по строке)
                </Text>
            </div>

            <CustomerDrawer
                open={drawerOpen}
                customerId={selectedCustomerId}
                onClose={handleCloseDrawer}
                reload={loadCustomers}
            />
        </div>
    )
}