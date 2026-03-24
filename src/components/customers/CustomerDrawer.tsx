import { Modal } from '@consta/uikit/Modal'
import { Button } from '@consta/uikit/Button'
import { Text } from '@consta/uikit/Text'
import { TextField } from '@consta/uikit/TextField'
import { RadioGroup } from '@consta/uikit/RadioGroup';
import { Select } from '@consta/uikit/Select'
import { Badge } from '@consta/uikit/Badge'
import { useState, useEffect } from 'react'
import type { Customer, CustomerType } from '../../types/Customer'
import { customerApi } from '../../api/CustomerApi'
import { useNotifications } from '../../context/NotificationContext'
import { Loader } from '@consta/uikit/Loader';
import { useNavigate } from 'react-router-dom';

type Props = {
  open: boolean
  customerId: number | null
  onClose: () => void
  reload: () => void
}

type SelectOption = {
  label: string
  value: string | null
}

export default function CustomerDrawer({
  open,
  customerId,
  onClose,
  reload
}: Props) {
  const navigate = useNavigate();
  
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [customerType, setCustomerType] = useState<CustomerType>('ORGANIZATION')
  const [inn, setInn] = useState('')
  const [kpp, setKpp] = useState('')
  const [legalAddress, setLegalAddress] = useState('')
  const [postalAddress, setPostalAddress] = useState('')
  const [email, setEmail] = useState('')
  const [codeMainCustomer, setCodeMainCustomer] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)

  const [allCustomers, setAllCustomers] = useState<Customer[]>([])
  const [parentOptions, setParentOptions] = useState<SelectOption[]>([])

  const { showSuccess, showError } = useNotifications()

  useEffect(() => {
    if (open) {
      loadAllCustomers()
    }
  }, [open])

  useEffect(() => {
    if (open && customerId) {
      loadCustomerById()
    } else if (open && !customerId) {
      resetForm()
    }
  }, [open, customerId])

  const handleGoToLots = () => {
    navigate(`/customers/${customerId}/lots`);
  };

  const loadCustomerById = async () => {
    if (!customerId) return

    setLoading(true)
    try {
      const response = await customerApi.getById(customerId)
      const customer = response.data

      setCode(customer.code || '')
      setName(customer.name || '')
      setCustomerType(customer.customerType)
      setInn(customer.inn || '')
      setKpp(customer.kpp || '')
      setLegalAddress(customer.legalAddress || '')
      setPostalAddress(customer.postalAddress || '')
      setEmail(customer.email || '')
      setCodeMainCustomer(customer.codeMainCustomer || undefined)
    } catch (error) {
      console.error('Load customer error:', error)
      showError('Ошибка загрузки контрагента')
    } finally {
      setLoading(false)
    }
  }

  const loadAllCustomers = async () => {
    try {
      const res = await customerApi.getAll()
      setAllCustomers(res.data)

      const options: SelectOption[] = [{ label: 'Не выбран', value: null },
      ...res.data
        .filter(c => customerId ? c.id !== customerId : true)
        .map(c => ({
          label: `${c.name} (${c.code})`,
          value: c.code
        }))
      ]
      console.log('parentOptions:', options)
      setParentOptions(options)
    } catch (error) {
      console.error('Load customers error:', error)
      showError('Ошибка загрузки контрагентов')
    }
  }

  const resetForm = () => {
    setCode('')
    setName('')
    setCustomerType('ORGANIZATION')
    setInn('')
    setKpp('')
    setLegalAddress('')
    setPostalAddress('')
    setEmail('')
    setCodeMainCustomer(undefined)
  }

  const isFormValid = () => {
    if (code.trim() === '') { showError('Введите код контрагента'); return false }
    if (name.trim() === '') { showError('Введите наименование контрагента'); return false }
    if (inn.trim().length !== 10 && inn.trim().length !== 12) { showError('Введите корректный ИНН'); return false }
    if (customerType === 'ORGANIZATION' && kpp.trim() === '' && kpp.trim().length !== 9) { showError('Введите корректный КПП'); return false }

    if (email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('Введите корректный email');
      return false;
    }

    return true
  }

  const handleSave = async () => {
    try {
      if (!isFormValid()) return

      const data: Partial<Customer> = {
        code,
        name,
        customerType,
        inn,
        kpp: customerType === 'ORGANIZATION' ? kpp : undefined,
        legalAddress: legalAddress ? legalAddress : undefined,
        postalAddress: postalAddress ? postalAddress : undefined,
        email: email ? email : undefined,
        codeMainCustomer: codeMainCustomer || undefined
      }

      if (customerId) {
        await customerApi.update(customerId, data)
      } else {
        await customerApi.create(data)
      }

      showSuccess('Данные успешно сохранены')

      reload()
      onClose()
    } catch (error) {
      console.error('Save customer error:', error)
      showError('Ошибка сохранения контрагента')
    }
  }

  const handleDelete = async () => {
    if (!customerId) return

    try {
      await customerApi.delete(customerId)
      reload()
      onClose()
      showSuccess('Контрагент успешно удалён')
    } catch (error) {
      console.error('Delete customer error:', error)
      showError('Ошибка при удалении контрагента')
    }
  }

  const selectedParent = codeMainCustomer
    ? allCustomers.find(c => c.code === codeMainCustomer)
    : null

  const selectValue = codeMainCustomer && selectedParent
    ? {
      label: `${selectedParent.name} (${selectedParent.code})`,
      value: codeMainCustomer
    }
    : null

  if (loading) {
    return (
      <Modal isOpen={open} onClose={onClose}>
        <Loader />
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Text as="h2" size="l" weight="bold">
              {customerId
                ? '✎ Редактирование контрагента'
                : '✎ Создание контрагента'}
            </Text>
            {customerId && code && (
              <Badge
                label={code}
                size="m"
                status="system"
              />
            )}
            <Button
              view="secondary"
              size="m"
              form="round"
              label="📦 Перейти к лотам →"
              onClick={handleGoToLots}
            />
          </div>
          <Button
            view="clear"
            size="l"
            label="✕"
            onClick={onClose}
          />
        </div>

        <div style={{ marginBottom: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Text as="h3" size="m" weight="bold">📌 Основные реквизиты</Text>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <TextField
                label="Код контрагента"
                value={code}
                onChange={(value) => setCode(value || '')}
                required
                placeholder="Введите код контрагента"
              />
            </div>
            <div>
              <TextField
                label="Наименование"
                value={name}
                onChange={(value) => setName(value || '')}
                required
                placeholder="Введите наименование контрагента"
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Text weight="extralight" style={{ marginBottom: 8, }}>Тип контрагента</Text>
            <RadioGroup
              items={[
                { key: 'ORGANIZATION', label: '🏢 Юридическое лицо' },
                { key: 'PERSON', label: '👤 Физическое лицо' }
              ]}
              value={{ key: customerType, label: customerType === 'ORGANIZATION' ? '🏢 Юридическое лицо' : '👤 Физическое лицо' }}
              onChange={(value) => setCustomerType(value.key as 'ORGANIZATION' | 'PERSON')}
              getItemLabel={(item) => item.label}
              getItemKey={(item) => item.key}
              direction="row"
              size="m"
              view="primary"
              style={{ marginLeft: 32 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <TextField
                label="ИНН"
                value={inn}
                type="number"
                onChange={(value) => setInn(value || '')}
                required
                min="0"
                placeholder="Введите ИНН"
              />
            </div>
            {customerType === 'ORGANIZATION' && (
              <div>
                <TextField
                  label="КПП"
                  value={kpp}
                  type="number"
                  onChange={(value) => setKpp(value || '')}
                  required
                  min="0"
                  placeholder="Введите КПП"
                />
              </div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <Select
                label="Вышестоящий контрагент"
                placeholder="Выберите вышестоящего контрагента"
                items={parentOptions}
                value={selectValue}
                onChange={(value) => {
                  if (value) {
                    setCodeMainCustomer(value.value || undefined)
                  }
                }}
                getItemKey={(item) => String(item.value)}
                getItemLabel={(item) => item.label}
              />
            </div>
            <Text
              size="xs"
              style={{
                marginTop: 4,
                color: '#9ca3af',
                fontSize: '12px'
              }}>🔍 Связанная запись из таблицы customer</Text>
          </div>
        </div>

        <div style={{ marginBottom: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Text as="h3" size="m" weight="bold">📍 Адреса и контакты</Text>
          </div>

          <div style={{ marginBottom: 16 }}>
            <TextField
              label="Юридический адрес"
              value={legalAddress}
              onChange={(value) => setLegalAddress(value || '')}
              type="textarea"
              rows={3}
              placeholder="Введите юридический адрес"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <TextField
              label="Почтовый адрес"
              value={postalAddress}
              onChange={(value) => setPostalAddress(value || '')}
              type="textarea"
              rows={3}
              placeholder='Введите почтовый адрес'
            />
            <Text
              size="xs"
              style={{
                marginTop: 4,
                color: '#9ca3af',
                fontSize: '12px'
              }}>📋 Можно скопировать из юридического</Text>
          </div>

          <div>
            <TextField
              label="Электронная почта"
              value={email}
              onChange={(value) => setEmail(value || '')}
              type="email"
              placeholder="Введите email"
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

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12
        }}>
          {customerId && (
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
              label={customerId ? '💾 Сохранить изменения' : '💾 Создать'}
              onClick={handleSave}
              className="button-rounded"
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}