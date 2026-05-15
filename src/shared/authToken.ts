export const hasAuthToken = () => (
  typeof window !== 'undefined' && Boolean(window.localStorage.getItem('token'))
)
