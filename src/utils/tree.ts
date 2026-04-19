import type { Node } from '../types/index.js'

export function flattenTree(nodes: Node[]): Node[] {
  const result: Node[] = []
  function dfs(children: Node[]): void {
    for (const node of children) {
      result.push(node)
      if ((node.children ?? []).length > 0) dfs(node.children ?? [])
    }
  }
  dfs(nodes)
  return result
}

export function findNode(nodes: Node[], id: string): Node | undefined {
  for (const node of nodes) {
    if (node.id === id) return node
    const found = findNode(node.children ?? [], id)
    if (found) return found
  }
  return undefined
}

function removeFromTree(nodes: Node[], id: string): [Node[], Node | undefined] {
  let removed: Node | undefined
  const result = nodes.reduce<Node[]>((acc, node) => {
    if (node.id === id) {
      removed = node
      return acc
    }
    const [newChildren, removedChild] = removeFromTree(node.children ?? [], id)
    if (removedChild) removed = removedChild
    return [...acc, { ...node, children: newChildren }]
  }, [])
  return [result, removed]
}

function insertIntoTree(nodes: Node[], parentId: string | null, node: Node): Node[] {
  if (parentId === null) {
    return [...nodes, { ...node, parentId: null }]
  }
  return nodes.map((n) => {
    if (n.id === parentId) {
      return { ...n, children: [...(n.children ?? []), { ...node, parentId }] }
    }
    return { ...n, children: insertIntoTree(n.children ?? [], parentId, node) }
  })
}

/**
 * Move a node to a new parent (or to root if newParentId is null).
 * Returns a new tree — does not mutate input.
 * Caller must also call moveNode() API to persist.
 */
export function moveNode(nodes: Node[], nodeId: string, newParentId: string | null): Node[] {
  const [treeWithout, removed] = removeFromTree(nodes, nodeId)
  if (!removed) return nodes
  return insertIntoTree(treeWithout, newParentId, removed)
}

/**
 * Make a node the last child of its previous sibling.
 * Does nothing if no previous sibling exists.
 */
export function indentNode(nodes: Node[], nodeId: string): Node[] {
  const flat = flattenTree(nodes)
  const node = flat.find((n) => n.id === nodeId)
  if (!node) return nodes

  const siblings = flat
    .filter((n) => n.parentId === node.parentId)
    .sort((a, b) => a.position - b.position)
  const idx = siblings.findIndex((n) => n.id === nodeId)
  if (idx <= 0) return nodes

  return moveNode(nodes, nodeId, siblings[idx - 1].id)
}

/**
 * Promote a node to its grandparent level (one level up).
 * Does nothing if node is already at root.
 */
export function outdentNode(nodes: Node[], nodeId: string): Node[] {
  const flat = flattenTree(nodes)
  const node = flat.find((n) => n.id === nodeId)
  if (!node || node.parentId === null) return nodes

  const parent = flat.find((n) => n.id === node.parentId)
  if (!parent) return nodes

  return moveNode(nodes, nodeId, parent.parentId)
}

/**
 * Swap a node with its previous or next sibling by position.
 * Returns new tree — does not mutate input.
 * Caller must also call moveNode() API to persist.
 */
export function reorderSiblings(nodes: Node[], nodeId: string, direction: 'up' | 'down'): Node[] {
  const flat = flattenTree(nodes)
  const node = flat.find((n) => n.id === nodeId)
  if (!node) return nodes

  const siblings = flat
    .filter((n) => n.parentId === node.parentId)
    .sort((a, b) => a.position - b.position)
  const idx = siblings.findIndex((n) => n.id === nodeId)

  if (direction === 'up' && idx <= 0) return nodes
  if (direction === 'down' && idx >= siblings.length - 1) return nodes

  const swapIdx = direction === 'up' ? idx - 1 : idx + 1
  const swap = siblings[swapIdx]

  const nodePos = node.position
  const swapPos = swap.position

  function updatePositions(children: Node[]): Node[] {
    return children.map((n) => {
      const updated =
        n.id === nodeId
          ? { ...n, position: swapPos }
          : n.id === swap.id
            ? { ...n, position: nodePos }
            : n
      return (updated.children ?? []).length > 0
        ? { ...updated, children: updatePositions(updated.children ?? []) }
        : updated
    })
  }

  return updatePositions(nodes)
}
