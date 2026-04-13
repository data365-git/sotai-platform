import { useQuery } from '@tanstack/react-query'

export type LeadsFilter = {
  search?: string
  repId?: string
  status?: string
  scoreMin?: number | null
  scoreMax?: number | null
  from?: string
  to?: string
}

export function useLeads(filters: LeadsFilter = {}) {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.search) params.set('search', filters.search)
      if (filters.repId) params.set('repId', filters.repId)
      if (filters.status) params.set('status', filters.status)
      if (filters.scoreMin != null) params.set('scoreMin', String(filters.scoreMin))
      if (filters.scoreMax != null) params.set('scoreMax', String(filters.scoreMax))
      if (filters.from) params.set('dateFrom', filters.from)
      if (filters.to) params.set('dateTo', filters.to)
      const res = await fetch(`/api/leads?${params}`)
      if (!res.ok) throw new Error('Failed to fetch leads')
      return res.json() as Promise<any[]>
    },
  })
}

export function useReps() {
  return useQuery({
    queryKey: ['reps'],
    queryFn: async () => {
      const res = await fetch('/api/leads')
      const data = await res.json()
      const reps = new Map<string, any>()
      for (const lead of data || []) {
        if (lead.rep && !reps.has(lead.rep.id)) reps.set(lead.rep.id, lead.rep)
      }
      return Array.from(reps.values())
    },
    staleTime: 300_000,
  })
}
