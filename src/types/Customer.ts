export type CustomerType = 'ORGANIZATION' | 'PERSON'

export interface Customer {
  id: number
  code: string
  name: string
  inn: string
  kpp?: string
  legalAddress?: string
  postalAddress?: string
  email?: string
  codeMainCustomer?: string
  customerType: CustomerType
}