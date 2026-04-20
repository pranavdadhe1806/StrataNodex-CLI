// Lists hook
import { useState, useEffect, useCallback } from 'react'
import { getLists } from '../../api/client.js'
import type { List } from '../../types/index.js'

interface ListsState {
  lists: List[]
  loading: boolean
  error: string | null
}

export function useLists(folderId: string) {
  const [state, setState] = useState<ListsState>({ lists: [], loading: true, error: null })

  const fetch = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }))
    getLists(folderId)
      .then((lists) => setState({ lists, loading: false, error: null }))
      .catch((err: Error) => setState({ lists: [], loading: false, error: err.message }))
  }, [folderId])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { ...state, refetch: fetch }
}
