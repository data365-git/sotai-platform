import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      leadId: string
      checklistId: string
      verdicts: Record<string, any>
      summary?: string
      isLocked?: boolean
    }) => {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to save review')
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}
