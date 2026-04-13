import { useQuery } from '@tanstack/react-query'

export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: () => fetch('/api/analytics').then((r) => r.json()),
    staleTime: 5 * 60_000,
  })
}
