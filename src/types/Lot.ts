export interface Lot {
  id: number
  name: string
  customerCode?: string
  price: number
  currencyCode: string
  ndsRate: string
  placeDelivery: string
  dateDelivery: string
}