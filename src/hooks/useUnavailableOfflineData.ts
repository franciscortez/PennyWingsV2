import { useConnectionFeedback } from '@/hooks/useConnectionFeedback'

export function useUnavailableOfflineData(hasLoadedData: boolean) {
  const feedback = useConnectionFeedback()
  return !hasLoadedData && Boolean(feedback && feedback.state !== 'online')
}
