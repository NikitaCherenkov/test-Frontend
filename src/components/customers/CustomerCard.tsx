import { Badge } from '@consta/uikit/Badge';
import { Text } from '@consta/uikit/Text';
import { useNavigate } from 'react-router-dom';
import type { Customer } from '../../types/Customer';
import { DataTableRow } from '../DataTableRow';
import type { Column } from '../DataTable';

type Props = {
  customer: Customer;
  isSelected: boolean;
  onSelect: (id: number, selected: boolean) => void;
  onEdit: (customer: Customer) => void;
  allCustomers: Customer[];
  columns?: Column<Customer>[];
};

export default function CustomerCard({
  customer,
  isSelected,
  onSelect,
  onEdit,
  allCustomers,
  columns
}: Props) {
  const navigate = useNavigate();

  const parentCustomer = customer.codeMainCustomer
    ? allCustomers.find(c => c.code === customer.codeMainCustomer)
    : undefined;

  const handleGoToLots = () => {
    navigate(`/customers/${customer.id}/lots`);
  };

  const getCellValue = (field: keyof Customer): React.ReactNode => {
    switch (field) {
      case 'code':
        return <Text size="s" weight="bold">{customer.code}</Text>;
      case 'name':
        return <Text size="s" view="primary" weight="medium">{customer.name}</Text>;
      case 'inn':
        return <Text size="s">{customer.inn || '—'}</Text>;
      case 'customerType':
        return (
          <Badge
            label={customer.customerType === 'ORGANIZATION' ? '🏢 Юр. лицо' : '👤 Физ. лицо'}
            size="s"
            status={customer.customerType === 'ORGANIZATION' ? 'system' : 'success'}
          />
        );
      case 'codeMainCustomer':
        return <Text size="s">{parentCustomer ? parentCustomer.name : '—'}</Text>;
      default:
        return <Text size="s">—</Text>;
    }
  };

  const actions = [
    { label: '📦 Перейти к лотам', onClick: handleGoToLots }
  ];

  return (
    <DataTableRow
      item={customer}
      isSelected={isSelected}
      onSelect={onSelect}
      onEdit={onEdit}
      actions={actions}
      getItemId={(c) => c.id}
    >
      {/* Содержимое строки - колонки */}
      {columns && columns.map((column, index) => (
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
          {column.render ? column.render(customer) : getCellValue(column.field)}
        </div>
      ))}
    </DataTableRow>
  );
}