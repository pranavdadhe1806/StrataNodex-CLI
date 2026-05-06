// Auth hook
import { useState, useEffect, useRef } from 'react'
import { getToken } from '../../utils/auth.js'
import { getMe } from '../../api/client.js'

interface AuthState {
  isLoggedIn: boolean
  user: { name: string | null; email: string } | null
  loading: boolean
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ isLoggedIn: false, user: null, loading: true })
  const fetchedRef = useRef(false)

  useEffect(() => {
    // GUEST MODE — for local testing only
    if (process.env['STRATANODEX_GUEST'] === 'true') {
      setState({ isLoggedIn: true, user: { name: 'Guest', email: 'guest' }, loading: false })
      return
    }

    const tryAuth = () => {
      if (fetchedRef.current) return // already resolved, stop polling
      const token = getToken()
      if (!token) {
        setState({ isLoggedIn: false, user: null, loading: false })
        return
      }
      // Token just appeared — fetch user and stop polling
      fetchedRef.current = true
      getMe()
        .then((u) =>
          setState({ isLoggedIn: true, user: { name: u.name, email: u.email }, loading: false })
        )
        .catch(() => {
          fetchedRef.current = false // allow retry
          setState({ isLoggedIn: false, user: null, loading: false })
        })
    }

    // Run immediately, then poll every 500ms until token is found
    tryAuth()
    const interval = setInterval(tryAuth, 500)
    return () => clearInterval(interval)
  }, [])

  return state
}
