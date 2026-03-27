export type CustomerType = 'ORGANIZATION' | 'PERSON'

export interface Customer {
  id: number
  customerCode: string
  customerName: string
  customerInn: string
  customerKpp?: string
  customerLegalAddress?: string
  customerPostalAddress?: string
  customerEmail?: string
  customerCodeMain?: string
  customerType: CustomerType
}