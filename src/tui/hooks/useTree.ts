// Tree hook
import { useState, useEffect, useCallback, useMemo } from 'react'
import { getNodes } from '../../api/client.js'
import { assignNumbers } from '../../utils/numbering.js'
import type { Node } from '../../types/index.js'

interface TreeState {
  nodes: Node[]
  loading: boolean
  error: string | null
}

/**
 * Reconstruct a nested tree from the flat node array the backend returns.
 * Each node has a `parentId`; we group children under their parent.
 */
function buildTree(flat: Node[]): Node[] {
  const map = new Map<string, Node>()
  const roots: Node[] = []
  for (const node of flat) {
    map.set(node.id, { ...node, children: [] })
  }
  for (const node of flat) {
    const mapped = map.get(node.id)!
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(mapped)
    } else {
      roots.push(mapped)
    }
  }
  return roots
}

/** Collect ALL node IDs (at every depth) so we can auto-expand the entire tree. */
function collectAllIds(nodes: Node[]): Set<string> {
  const ids = new Set<string>()
  function walk(list: Node[]): void {
    for (const n of list) {
      ids.add(n.id)
      if (n.children?.length) walk(n.children)
    }
  }
  walk(nodes)
  return ids
}

function computeVisible(nodes: Node[], expandedIds: Set<string>): Node[] {
  const result: Node[] = []
  function walk(children: Node[]): void {
    const sorted = [...children].sort((a, b) => a.position - b.position)
    for (const node of sorted) {
      result.push(node)
      if (expandedIds.has(node.id) && (node.children ?? []).length > 0) {
        walk(node.children ?? [])
      }
    }
  }
  walk(nodes)
  return result
}

export function useTree(listId: string) {
  const [state, setState] = useState<TreeState>({ nodes: [], loading: true, error: null })
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const fetch = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }))
    getNodes(listId)
      .then((flatNodes) => {
        // Backend returns a flat list — rebuild nested tree
        const tree = buildTree(flatNodes)
        // Auto-expand ALL nodes so the full tree is visible by default
        setExpandedIds(collectAllIds(tree))
        setState({ nodes: tree, loading: false, error: null })
      })
      .catch((err: Error) => setState({ nodes: [], loading: false, error: err.message }))
  }, [listId])

  useEffect(() => {
    fetch()
  }, [fetch])

  const toggleExpand = useCallback((nodeId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }, [])

  const numberMap = useMemo(() => assignNumbers(state.nodes), [state.nodes])
  const flatNodes = useMemo(
    () => computeVisible(state.nodes, expandedIds),
    [state.nodes, expandedIds]
  )

  return {
    nodes: state.nodes,
    flatNodes,
    expandedIds,
    toggleExpand,
    numberMap,
    loading: state.loading,
    error: state.error,
    refetch: fetch,
  }
}
