import { describe, it, expect } from 'vitest'
import {
  flattenTree,
  findNode,
  moveNode,
  indentNode,
  outdentNode,
  reorderSiblings,
} from './tree.js'
import type { Node } from '../types/index.js'

function makeTree(): Node[] {
  return [
    {
      id: 'root1',
      title: 'Root 1',
      position: 0,
      parentId: null,
      listId: 'list1',
      status: 'TODO',
      priority: 'MEDIUM',
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
      children: [
        {
          id: 'child1',
          title: 'Child 1.1',
          position: 0,
          parentId: 'root1',
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
          children: [],
        },
        {
          id: 'child2',
          title: 'Child 1.2',
          position: 1,
          parentId: 'root1',
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
          children: [],
        },
      ],
    },
    {
      id: 'root2',
      title: 'Root 2',
      position: 1,
      parentId: null,
      listId: 'list1',
      status: 'DONE',
      priority: 'HIGH',
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
      children: [],
    },
  ]
}

describe('flattenTree', () => {
  it('returns all nodes in DFS order', () => {
    const flat = flattenTree(makeTree())
    expect(flat.map((n) => n.id)).toEqual(['root1', 'child1', 'child2', 'root2'])
  })

  it('returns empty array for empty input', () => {
    expect(flattenTree([])).toEqual([])
  })
})

describe('findNode', () => {
  it('finds a root node by id', () => {
    expect(findNode(makeTree(), 'root1')?.id).toBe('root1')
  })

  it('finds a nested child node by id', () => {
    expect(findNode(makeTree(), 'child2')?.id).toBe('child2')
  })

  it('returns undefined for unknown id', () => {
    expect(findNode(makeTree(), 'unknown')).toBeUndefined()
  })
})

describe('moveNode', () => {
  it('moves a root node to become a child of another root node', () => {
    const result = moveNode(makeTree(), 'root2', 'root1')
    const root1 = findNode(result, 'root1')
    expect(root1?.children.some((c) => c.id === 'root2')).toBe(true)
    expect(findNode(result, 'root2')?.parentId).toBe('root1')
  })

  it('moves a child node to root level', () => {
    const result = moveNode(makeTree(), 'child1', null)
    expect(result.some((n) => n.id === 'child1')).toBe(true)
    expect(findNode(result, 'child1')?.parentId).toBeNull()
  })

  it('does not mutate the original tree', () => {
    const tree = makeTree()
    const original = JSON.parse(JSON.stringify(tree)) as Node[]
    moveNode(tree, 'root2', 'root1')
    expect(tree).toEqual(original)
  })
})

describe('indentNode', () => {
  it('makes a node the child of its previous sibling', () => {
    const result = indentNode(makeTree(), 'child2')
    const child1 = findNode(result, 'child1')
    expect(child1?.children.some((c) => c.id === 'child2')).toBe(true)
  })

  it('does nothing if node has no previous sibling', () => {
    const tree = makeTree()
    const result = indentNode(tree, 'child1')
    expect(flattenTree(result).map((n) => n.id)).toEqual(flattenTree(tree).map((n) => n.id))
  })

  it('does not mutate the original tree', () => {
    const tree = makeTree()
    const original = JSON.parse(JSON.stringify(tree)) as Node[]
    indentNode(tree, 'child2')
    expect(tree).toEqual(original)
  })
})

describe('outdentNode', () => {
  it('promotes a child node to root level', () => {
    const result = outdentNode(makeTree(), 'child1')
    expect(result.some((n) => n.id === 'child1')).toBe(true)
    expect(findNode(result, 'child1')?.parentId).toBeNull()
  })

  it('does nothing if node is already at root level', () => {
    const tree = makeTree()
    const result = outdentNode(tree, 'root1')
    expect(flattenTree(result).map((n) => n.id)).toEqual(flattenTree(tree).map((n) => n.id))
  })

  it('does not mutate the original tree', () => {
    const tree = makeTree()
    const original = JSON.parse(JSON.stringify(tree)) as Node[]
    outdentNode(tree, 'child1')
    expect(tree).toEqual(original)
  })
})

describe('reorderSiblings', () => {
  it('moves a node up among siblings', () => {
    const result = reorderSiblings(makeTree(), 'child2', 'up')
    const root1 = findNode(result, 'root1')
    const sorted = [...(root1?.children ?? [])].sort((a, b) => a.position - b.position)
    expect(sorted[0].id).toBe('child2')
    expect(sorted[1].id).toBe('child1')
  })

  it('moves a node down among siblings', () => {
    const result = reorderSiblings(makeTree(), 'child1', 'down')
    const root1 = findNode(result, 'root1')
    const sorted = [...(root1?.children ?? [])].sort((a, b) => a.position - b.position)
    expect(sorted[0].id).toBe('child2')
    expect(sorted[1].id).toBe('child1')
  })

  it('does nothing if moving up from first position', () => {
    const tree = makeTree()
    const result = reorderSiblings(tree, 'child1', 'up')
    const before = findNode(tree, 'root1')?.children[0].id
    const after = findNode(result, 'root1')?.children[0].id
    expect(before).toBe(after)
  })

  it('does nothing if moving down from last position', () => {
    const tree = makeTree()
    const result = reorderSiblings(tree, 'child2', 'down')
    const before = findNode(tree, 'root1')?.children[1].id
    const after = findNode(result, 'root1')?.children[1].id
    expect(before).toBe(after)
  })

  it('does not mutate the original tree', () => {
    const tree = makeTree()
    const original = JSON.parse(JSON.stringify(tree)) as Node[]
    reorderSiblings(tree, 'child2', 'up')
    expect(tree).toEqual(original)
  })
})
