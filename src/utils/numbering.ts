import type { Node } from '../types/index.js'

/**
 * Given a nested tree of nodes (root nodes with children[] embedded),
 * returns a Map from nodeId → hierarchical number string e.g. "1.2.1".
 * Numbers are never stored — computed at render time only.
 */
export function assignNumbers(nodes: Node[]): Map<string, string> {
  const map = new Map<string, string>()

  function traverse(children: Node[], prefix: string): void {
    const sorted = [...children].sort((a, b) => a.position - b.position)
    sorted.forEach((node, index) => {
      const number = prefix ? `${prefix}.${index + 1}` : `${index + 1}`
      map.set(node.id, number)
      if ((node.children ?? []).length > 0) {
        traverse(node.children, number)
      }
    })
  }

  traverse(nodes, '')
  return map
}

/**
 * DFS flatten — takes nested node tree, returns flat array in DFS order.
 * Useful for resolving a display number like "1.2.1" to a node ID.
 */
export function flattenTree(nodes: Node[]): Node[] {
  const result: Node[] = []

  function dfs(children: Node[]): void {
    const sorted = [...children].sort((a, b) => a.position - b.position)
    for (const node of sorted) {
      result.push(node)
      if ((node.children ?? []).length > 0) {
        dfs(node.children)
      }
    }
  }

  dfs(nodes)
  return result
}
