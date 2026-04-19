import { describe, it, expect } from 'vitest'
import { assignNumbers, flattenTree } from './numbering.js'
import type { Node } from '../types/index.js'

function makeNode(
  id: string,
  position: number,
  children: Node[] = [],
  parentId: string | null = null
): Node {
  return {
    id,
    title: `Node ${id}`,
    position,
    parentId,
    listId: 'list1',
    status: 'TODO',
    priority: null,
    notes: null,
    startAt: null,
    endAt: null,
    reminderAt: null,
    canvasX: null,
    canvasY: null,
    userId: 'user1',
    createdAt: '',
    updatedAt: '',
    tags: [],
    children,
  }
}

describe('assignNumbers', () => {
  it('assigns correct numbers to a flat list of root nodes', () => {
    const nodes = [makeNode('a', 0), makeNode('b', 1)]
    const map = assignNumbers(nodes)
    expect(map.get('a')).toBe('1')
    expect(map.get('b')).toBe('2')
  })

  it('assigns correct numbers to a 2-level nested tree', () => {
    const b = makeNode('b', 0, [], 'a')
    const c = makeNode('c', 1, [], 'a')
    const a = makeNode('a', 0, [b, c])
    const map = assignNumbers([a])
    expect(map.get('a')).toBe('1')
    expect(map.get('b')).toBe('1.1')
    expect(map.get('c')).toBe('1.2')
  })

  it('assigns correct numbers to a 3-level nested tree', () => {
    const c = makeNode('c', 0, [], 'b')
    const b = makeNode('b', 0, [c], 'a')
    const a = makeNode('a', 0, [b])
    const map = assignNumbers([a])
    expect(map.get('a')).toBe('1')
    expect(map.get('b')).toBe('1.1')
    expect(map.get('c')).toBe('1.1.1')
  })

  it('assigns correct numbers when multiple root nodes have children', () => {
    const b = makeNode('b', 0, [], 'a')
    const d = makeNode('d', 0, [], 'c')
    const a = makeNode('a', 0, [b])
    const c = makeNode('c', 1, [d])
    const map = assignNumbers([a, c])
    expect(map.get('a')).toBe('1')
    expect(map.get('b')).toBe('1.1')
    expect(map.get('c')).toBe('2')
    expect(map.get('d')).toBe('2.1')
  })

  it('handles empty array', () => {
    const map = assignNumbers([])
    expect(map.size).toBe(0)
  })
})

describe('flattenTree', () => {
  it('flattens a nested tree in DFS order', () => {
    const b = makeNode('b', 0, [], 'a')
    const c = makeNode('c', 1, [], 'a')
    const a = makeNode('a', 0, [b, c])
    const d = makeNode('d', 1)
    const flat = flattenTree([a, d])
    expect(flat.map((n) => n.id)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('handles empty array', () => {
    expect(flattenTree([])).toEqual([])
  })

  it('handles single root node with no children', () => {
    const a = makeNode('a', 0)
    expect(flattenTree([a])).toEqual([a])
  })
})
