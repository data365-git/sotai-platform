import { useQuery } from '@tanstack/react-query'

export function useLeadDetail(id: string) {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const res = await fetch(`/api/leads/${id}`)
      if (!res.ok) throw new Error('Failed to fetch lead')
      return res.json()
    },
    enabled: !!id,
  })
}
