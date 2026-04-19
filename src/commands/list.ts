import Conf from 'conf'
import chalk from 'chalk'
import { getFolders, getLists, getNodes } from '../api/client.js'
import { getToken } from '../utils/auth.js'
import { assignNumbers } from '../utils/numbering.js'
import { ApiError } from '../api/ApiError.js'
import type { Node } from '../types/index.js'

const store = new Conf({ projectName: 'stratanodex' })

function statusBadge(status: Node['status']): string {
  if (status === 'DONE') return chalk.green('[DONE]')
  if (status === 'IN_PROGRESS') return chalk.blue('[IN PROGRESS]')
  return chalk.gray('[TODO]')
}

function priorityBadge(priority: Node['priority']): string {
  if (priority === 'HIGH') return chalk.red('[HIGH]')
  if (priority === 'MEDIUM') return chalk.yellow('[MED]')
  if (priority === 'LOW') return chalk.dim('[LOW]')
  return ''
}

function printNode(
  node: Node,
  numberMap: Map<string, string>,
  indentLevel: number,
  currentDepth: number,
  maxDepth: number
): void {
  const num = chalk.dim(numberMap.get(node.id) ?? '')
  const indent = '  '.repeat(indentLevel)
  const connector = indentLevel > 0 ? chalk.dim('└─ ') : ''
  const status = statusBadge(node.status)
  const priority = priorityBadge(node.priority)
  const title = chalk.white(node.title)
  console.log(
    `${indent}${connector}${num.padEnd(6)} ${title.padEnd(40)} ${status} ${priority}`.trimEnd()
  )

  const children = node.children ?? []
  if (currentDepth < maxDepth && children.length > 0) {
    const sorted = [...children].sort((a, b) => a.position - b.position)
    for (const child of sorted) {
      printNode(child, numberMap, indentLevel + 1, currentDepth + 1, maxDepth)
    }
  }
}

export async function runList(options: { depth?: number }): Promise<void> {
  if (!getToken()) {
    console.log(chalk.red('✗ Not logged in. Run: stratanodex login'))
    return
  }

  const maxDepth = options.depth ?? 0

  try {
    const folders = await getFolders()

    const listsPerFolder = await Promise.all(
      folders.map((f) => getLists(f.id).then((lists) => ({ folder: f, lists })))
    )

    let nodesPerList: Map<string, Node[]> = new Map()
    if (maxDepth >= 1) {
      const allLists = listsPerFolder.flatMap(({ lists }) => lists)
      const results = await Promise.all(
        allLists.map((l) => getNodes(l.id).then((nodes) => ({ listId: l.id, nodes })))
      )
      nodesPerList = new Map(results.map((r) => [r.listId, r.nodes]))

      if (allLists.length > 0) {
        store.set('lastListId', allLists[0].id)
      }
    }

    if (listsPerFolder.length === 0) {
      console.log(chalk.dim('No folders found. Create one first.'))
      return
    }

    for (const { folder, lists } of listsPerFolder) {
      console.log(chalk.bold.blue(`\u2601 ${folder.name}`))

      for (const list of lists) {
        console.log(`  ${chalk.bold.cyan(`📋 ${list.name}`)}`)

        if (maxDepth >= 1) {
          const nodes = nodesPerList.get(list.id) ?? []
          const numberMap = assignNumbers(nodes)
          const sorted = [...nodes].sort((a, b) => a.position - b.position)
          for (const node of sorted) {
            printNode(node, numberMap, 2, 1, maxDepth)
          }
        }
      }

      console.log('')
    }
  } catch (err) {
    if (err instanceof ApiError) {
      console.log(chalk.red(`✗ ${err.message}`))
    } else {
      console.log(chalk.red('✗ Unexpected error.'))
    }
  }
}
