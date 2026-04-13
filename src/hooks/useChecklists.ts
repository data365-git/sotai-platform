import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useChecklists() {
  return useQuery({
    queryKey: ['checklists'],
    queryFn: () => fetch('/api/checklists').then((r) => r.json()),
    staleTime: 300_000,
  })
}

export function useUpdateChecklist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/checklists/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update checklist')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklists'] }),
  })
}

export function useCreateChecklist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/checklists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create checklist')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklists'] }),
  })
}

export function useDeleteChecklist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/checklists/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklists'] }),
  })
}
