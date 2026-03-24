import { Modal } from '@consta/uikit/Modal'
import { Button } from '@consta/uikit/Button'
import { Text } from '@consta/uikit/Text'
import { TextField } from '@consta/uikit/TextField'
import { Select } from '@consta/uikit/Select'
import { Badge } from '@consta/uikit/Badge'
import { DatePicker } from '@consta/uikit/DatePicker'
import { useState, useEffect } from 'react'
import type { Customer } from '../../types/Customer'
import { lotApi } from '../../api/LotApi'
import { customerApi } from '../../api/CustomerApi'
import { useNotifications } from '../../context/NotificationContext'

type Props = {
  open: boolean
  lotId: number | null
  customerId?: number | null
  onClose: () => void
  reload: () => void
}

type CurrencyOption = {
  label: string
  value: string
}

type NdsOption = {
  label: string
  value: string
}

const currencyOptions: CurrencyOption[] = [
  { label: 'RUB - Российский рубль', value: 'RUB' },
  { label: 'USD - Доллар США', value: 'USD' },
  { label: 'EUR - Евро', value: 'EUR' }
]

const ndsOptions: NdsOption[] = [
  { label: 'Без НДС', value: 'NDS_0' },
  { label: '18%', value: 'NDS_18' },
  { label: '20%', value: 'NDS_20' }
]

const convertBackendNdsToFrontend = (backendNds: string): string => {
  if (!backendNds) return 'NDS_20'

  if (backendNds === 'NDS_0' || backendNds === 'NDS_18' || backendNds === 'NDS_20') {
    return backendNds
  }

  const normalized = backendNds.trim()
  if (normalized === 'Без НДС') return 'NDS_0'
  if (normalized === '18%') return 'NDS_18'
  if (normalized === '20%') return 'NDS_20'

  return 'NDS_20'
}

export default function LotDrawer({
  open,
  lotId,
  customerId,
  onClose,
  reload
}: Props) {
  const [name, setName] = useState('')
  const [customerCode, setCustomerCode] = useState('')
  const [price, setPrice] = useState('')
  const [currencyCode, setCurrency] = useState('RUB')
  const [ndsRate, setNds] = useState('NDS_20')
  const [placeDelivery, setPlaceDelivery] = useState('')
  const [dateDelivery, setDateDelivery] = useState<Date | null>(null)
  const [loading, setLoading] = useState(false)

  const [allCustomers, setAllCustomers] = useState<Customer[]>([])
  const [customerOptions, setCustomerOptions] = useState<Array<{ label: string; value: string }>>([])

  const { showSuccess, showError } = useNotifications()

  const isCustomerSpecific = !!customerId

  useEffect(() => {
    if (open && !isCustomerSpecific) {
      loadAllCustomers()
    }
  }, [open, isCustomerSpecific])

  useEffect(() => {
    if (open && lotId) {
      loadLotById()
    } else if (open && !lotId && isCustomerSpecific) {
      resetForm()
      if (customerId) {
        loadCustomerForSpecificPage()
      }
    } else if (open && !lotId && !isCustomerSpecific) {
      resetForm()
    }
  }, [open, lotId, customerId])

  const loadCustomerForSpecificPage = async () => {
    if (!customerId) return
    try {
      const response = await customerApi.getById(customerId)
      setCustomerCode(response.data.code)
    } catch (error) {
      console.error('Load customer error:', error)
      showError('Ошибка загрузки контрагента')
    }
  }

  const loadLotById = async () => {
    if (!lotId) return

    setLoading(true)
    try {
      const response = await lotApi.getById(lotId)
      const lot = response.data

      setName(lot.name || '')
      setCustomerCode(lot.customerCode || '')
      setPrice(String(lot.price || ''))
      setCurrency(lot.currencyCode || 'RUB')
      setNds(convertBackendNdsToFrontend(lot.ndsRate))
      setPlaceDelivery(lot.placeDelivery || '')

      if (lot.dateDelivery) {
        const date = new Date(lot.dateDelivery)
        if (!isNaN(date.getTime())) {
          setDateDelivery(date)
        }
      }
    } catch (error) {
      console.error('Load lot error:', error)
      showError('Ошибка загрузки лота')
    } finally {
      setLoading(false)
    }
  }

  const loadAllCustomers = async () => {
    try {
      const res = await customerApi.getAll()
      setAllCustomers(res.data)

      const options = res.data.map(c => ({
        label: `${c.code} - ${c.name}`,
        value: c.code
      }))
      setCustomerOptions(options)
    } catch (error) {
      console.error('Load customers error:', error)
      showError('Ошибка загрузки контрагентов')
    }
  }

  const resetForm = () => {
    setName('')
    if (!isCustomerSpecific) {
      setCustomerCode('')
    }
    setPrice('')
    setCurrency('')
    setNds('')
    setPlaceDelivery('')
    setDateDelivery(null)
  }

  const handleDateChange = (date: Date | null) => {
    setDateDelivery(date)
  }

  const isFormValid = () => {
    if (!name.trim()) { showError('Введите наименование лота'); return false }
    if (!isCustomerSpecific && !customerCode) { showError('Выберите контрагента'); return false }
    if (!placeDelivery.trim()) { showError('Введите место доставки'); return false }
    if (!price || isNaN(Number(price)) || Number(price) < 0) { showError('Введите корректную цену'); return false }
    if (!currencyCode) { showError('Выберите валюту'); return false }
    if (!ndsRate) { showError('Выберите ставку НДС'); return false }

    return true
  }

  const handleSave = async () => {
    if (!isFormValid()) return

    try {
      const data = {
        name,
        customerCode: customerCode || undefined,
        price: Number(price),
        currencyCode,
        ndsRate,
        placeDelivery,
        dateDelivery: dateDelivery ? dateDelivery.toISOString().split('T')[0] : ''
      }

      if (lotId) {
        await lotApi.update(lotId, data)
      } else if (isCustomerSpecific && customerId) {
        await lotApi.createForCustomer(customerId, data)
      } else {
        await lotApi.create(data)
      }

      showSuccess('Данные успешно сохранены')

      reload()
      onClose()
    } catch (error) {
      console.error('Save lot error:', error)
      showError('Ошибка при сохранении')
    }
  }

  const handleDelete = async () => {
    if (!lotId) return

    try {
      await lotApi.delete(lotId)
      reload()
      onClose()
      showSuccess('Лот успешно удалён')
    } catch (error) {
      console.error('Delete lot error:', error)
      showError('Ошибка при удалении')
    }
  }

  const selectedCurrency = currencyOptions.find(c => c.value === currencyCode)
  const selectedNds = ndsOptions.find(n => n.value === ndsRate)

  const selectedCustomer = allCustomers.find(c => c.code === customerCode)
  const selectValue = customerCode && selectedCustomer
    ? {
      label: `${selectedCustomer.code} - ${selectedCustomer.name}`,
      value: customerCode
    }
    : null

  if (loading) {
    return (
      <Modal isOpen={open} onClose={onClose}>
        <div style={{ padding: 30, textAlign: 'center' }}>
          <Text>Загрузка данных...</Text>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      isOpen={open}
      onClickOutside={onClose}
      onClose={onClose}
      className="modal-window"
      style={{
        maxWidth: 800,
        width: '90%',
        borderRadius: 30
      }}
    >
      <div style={{ padding: 30, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24
        }}>
          <Text as="h2" size="l" weight="bold">
            {lotId
              ? 'Редактирование лота'
              : 'Создание лота'}
          </Text>
          <Button
            view="clear"
            size="s"
            label="✕"
            onClick={onClose}
          />
        </div>

        {/* Основная информация */}
        <div style={{ marginBottom: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Text as="h3" size="m" weight="bold">📦 Основная информация</Text>
          </div>

          <div style={{ marginBottom: 16 }}>
            <TextField
              label="Наименование"
              value={name}
              onChange={(value) => setName(value || '')}
              required
              placeholder="Введите наименование лота"
            />
          </div>

          {!isCustomerSpecific && (
            <div style={{ marginBottom: 16 }}>
              <Select
                label="Контрагент"
                placeholder="Выберите контрагента"
                items={customerOptions}
                value={selectValue}
                onChange={(value) => {
                  if (value) {
                    setCustomerCode(value.value)
                  } else {
                    setCustomerCode('')
                  }
                }}
                required
                getItemKey={(item) => String(item.value)}
              />
            </div>
          )}

          {isCustomerSpecific && customerCode && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: 30,
              marginBottom: 30,
              backgroundColor: 'var(--accent-bg)',
              border: '1px solid var(--accent-border)'
            }}>
              <Text size="m" view="secondary">
                Контрагент:
              </Text>
              <Badge
                label={customerCode}
                size="m"
                view="filled"
                color="var(--accent-bg)"
                style={{ marginLeft: 8 }}
              >
              </Badge>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <TextField
                label="Место поставки"
                value={placeDelivery}
                onChange={(value) => setPlaceDelivery(value || '')}
                required
                placeholder="Введите место поставки"
              />
            </div>
            <div>
              <DatePicker
                label="Дата поставки"
                value={dateDelivery}
                onChange={handleDateChange}
                format="dd.MM.yyyy"
                size="m"
                required
                placeholder="Выберите дату"
              />
            </div>
          </div>
        </div>

        {/* Стоимость и налоги */}
        <div style={{ marginBottom: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Text as="h3" size="m" weight="bold">💰 Стоимость и налоги</Text>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <TextField
                label="Цена"
                type="number"
                value={price}
                onChange={(value) => setPrice(value || '')}
                required
                step="0.01"
                min="0"
                placeholder="Введите цену"
              />
            </div>
            <div>
              <Select
                label="Валюта"
                items={currencyOptions}
                value={selectedCurrency}
                onChange={(value) => setCurrency(value?.value || 'RUB')}
                required
                getItemKey={(item) => item.value}
                placeholder='Выберите валюту'
              />
            </div>
          </div>

          <div>
            <Select
              label="Ставка НДС"
              items={ndsOptions}
              value={selectedNds}
              onChange={(value) => setNds(value?.value || 'NDS_20')}
              required
              getItemKey={(item) => item.value}
              placeholder='Выберите ставку НДС'
            />
          </div>
        </div>

        <div style={{
          marginTop: 20,
          marginBottom: 20,
          borderTop: '2px solid #e5e4e7',
          width: '100%'
        }} />

        <div style={{
          marginBottom: 20,
          fontSize: '12px',
          color: '#9ca3af',
          textAlign: 'center'
        }}>
          🔷 Поля, отмеченные <span style={{ color: '#f44336', fontWeight: 'bold' }}>*</span> , обязательны для заполнения
        </div>

        {/* Действия */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12
        }}>
          {lotId && (
            <Button
              label="🗑️ Удалить"
              view="ghost"
              onClick={handleDelete}
              className="button-rounded"
            />
          )}
          <div style={{ display: 'flex', gap: 12, marginLeft: 'auto' }}>
            <Button
              label="Отмена"
              view="secondary"
              onClick={onClose}
              className="button-rounded"
            />
            <Button
              label={lotId ? 'Сохранить изменения' : 'Создать лот'}
              onClick={handleSave}
              className="button-rounded"
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}