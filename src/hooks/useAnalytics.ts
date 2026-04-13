import { useQuery } from '@tanstack/react-query'

export function useAnalytics(days = 30) {
  return useQuery({
    queryKey: ['analytics', days],
    queryFn: () => fetch(`/api/analytics?days=${days}`).then((r) => r.json()),
    staleTime: 5 * 60_000,
  })
}
