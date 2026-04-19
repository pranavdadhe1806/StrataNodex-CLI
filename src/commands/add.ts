import Conf from 'conf'
import chalk from 'chalk'
import { getNodes, createRootNode, createChildNode } from '../api/client.js'
import { assignNumbers, flattenTree } from '../utils/numbering.js'
import { ApiError } from '../api/ApiError.js'

const store = new Conf({ projectName: 'stratanodex' })

export async function runAdd(
  title: string,
  options: { list?: string; parent?: string }
): Promise<void> {
  if (!options.list) {
    console.log(chalk.red('✗ --list <listId> is required. Use: stratanodex list to see list IDs.'))
    return
  }

  const listId = options.list

  try {
    if (!options.parent) {
      const node = await createRootNode(listId, { title })
      store.set('lastListId', listId)
      console.log(chalk.green(`✓ Added: ${node.title}`))
      return
    }

    const nodes = await getNodes(listId)
    const flat = flattenTree(nodes)
    const numberMap = assignNumbers(nodes)

    const byNumber = new Map<string, string>()
    for (const [id, num] of numberMap) {
      byNumber.set(num, id)
    }

    const parentId = byNumber.get(options.parent)
    if (!parentId) {
      console.log(chalk.red(`✗ Node "${options.parent}" not found in list.`))
      return
    }

    const parentNode = flat.find((n) => n.id === parentId)
    const child = await createChildNode(parentId, { title })
    store.set('lastListId', listId)
    console.log(chalk.green(`✓ Added: ${child.title}  (under: ${parentNode?.title ?? parentId})`))
  } catch (err) {
    if (err instanceof ApiError) {
      console.log(chalk.red(`✗ ${err.message}`))
    } else {
      console.log(chalk.red('✗ Unexpected error.'))
    }
  }
}
