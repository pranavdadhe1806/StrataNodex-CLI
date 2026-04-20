// Auth hook
import { useState, useEffect } from 'react'
import { getToken } from '../../utils/auth.js'
import { getMe } from '../../api/client.js'

interface AuthState {
  isLoggedIn: boolean
  user: { name: string | null; email: string } | null
  loading: boolean
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ isLoggedIn: false, user: null, loading: true })

  useEffect(() => {
    // GUEST MODE — for local testing only, remove before production
    if (process.env['STRATANODEX_GUEST'] === 'true') {
      setState({ isLoggedIn: true, user: { name: 'Guest', email: 'guest' }, loading: false })
      return
    }

    const token = getToken()
    if (!token) {
      setState({ isLoggedIn: false, user: null, loading: false })
      return
    }

    getMe()
      .then((u) =>
        setState({ isLoggedIn: true, user: { name: u.name, email: u.email }, loading: false })
      )
      .catch(() => setState({ isLoggedIn: false, user: null, loading: false }))
  }, [])

  return state
}
