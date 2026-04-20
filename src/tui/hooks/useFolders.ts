// Folders hook
import { useState, useEffect, useCallback } from 'react'
import { getFolders } from '../../api/client.js'
import type { Folder } from '../../types/index.js'

interface FoldersState {
  folders: Folder[]
  loading: boolean
  error: string | null
}

export function useFolders() {
  const [state, setState] = useState<FoldersState>({ folders: [], loading: true, error: null })

  const fetch = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }))
    getFolders()
      .then((folders) => setState({ folders, loading: false, error: null }))
      .catch((err: Error) => setState({ folders: [], loading: false, error: err.message }))
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { ...state, refetch: fetch }
}
