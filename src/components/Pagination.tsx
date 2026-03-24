import { Pagination as ConstaPagination } from '@consta/uikit/Pagination'
import { Select } from '@consta/uikit/Select'

type Props = {
    currentPage: number
    totalPages: number
    pageSize: number
    onPageChange: (page: number) => void
    onPageSizeChange: (pageSize: number) => void
    totalItems: number
}

const pageSizeOptions = [
    { label: '10', value: 10 },
    { label: '20', value: 20 },
    { label: '50', value: 50 },
    { label: '100', value: 100 }
]

export default function Pagination({
    currentPage,
    totalPages,
    pageSize,
    onPageChange,
    onPageSizeChange,
    totalItems
}: Props) {
    const selectedPageSize = pageSizeOptions.find(opt => opt.value === pageSize)

    const startItem = (currentPage - 1) * pageSize + 1
    const endItem = Math.min(currentPage * pageSize, totalItems)

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 20,
            padding: '16px 0',
            flexWrap: 'wrap',
            gap: 16
        }}>
            {/* Информация о количестве записей */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: 14,
                color: 'var(--text)'
            }}>
                <Select
                    items={pageSizeOptions}
                    value={selectedPageSize}
                    onChange={(value) => onPageSizeChange(value ? value.value : 10)}
                    getItemLabel={(item) => item.label}
                    getItemKey={(item) => String(item.value)}
                    size="s"
                    style={{ minWidth: 70 }}
                />
                <span style={{ whiteSpace: 'nowrap' }}>
                    {startItem}–{endItem} из {totalItems} записей
                </span>
            </div>

            {/* Пагинация */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <ConstaPagination
                    items={totalPages}
                    value={currentPage}
                    onChange={(value) => onPageChange(value)}
                    visibleCount={7}
                    showFirstPage
                    showLastPage
                    size="m"
                    form="round"
                    type="default"
                />
            </div>
        </div>
    )
}