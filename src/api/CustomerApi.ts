import axios from 'axios'
import type { Customer } from '../types/Customer'

const api = axios.create({
  baseURL: 'http://192.168.0.35:8080/api'
})

export const customerApi = {

  getAll: async () => {
    return api.get<Customer[]>('/customers')
  },

  getById: async (id: number) => {
    return api.get<Customer>(`/customers/${id}`)
  },

  create: async (data: Partial<Customer>) => {
    return api.post<Customer>('/customers', data)
  },

  update: async (id: number, data: Partial<Customer>) => {
    return api.put<Customer>(`/customers/${id}`, data)
  },

  delete: async (id: number) => {
    return api.delete(`/customers/${id}`)
  }

}