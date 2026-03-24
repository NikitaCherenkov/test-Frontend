import axios from 'axios'
import type { Lot } from '../types/Lot'

const api = axios.create({
  baseURL: 'http://192.168.0.35:8080/api'
})

export const lotApi = {
  getAll: async () => {
    return api.get<Lot[]>('/lots')
  },

  getById: async (id: number) => {
    return api.get<Lot>(`/lots/${id}`)
  },

  create: async (data: Partial<Lot>) => {
    return api.post<Lot>('/lots', data)
  },

  createForCustomer: async (customerId: number, data: Partial<Lot>) => {
    return api.post<Lot>(`/customers/${customerId}/lots`, data)
  },

  getAllByCustomerId: async (customerId: number) => {
    return api.get<Lot[]>(`/customers/${customerId}/lots`)
  },

  update: async (id: number, data: Partial<Lot>) => {
    return api.put<Lot>(`/lots/${id}`, data)
  },

  delete: async (id: number) => {
    return api.delete(`/lots/${id}`)
  }
}