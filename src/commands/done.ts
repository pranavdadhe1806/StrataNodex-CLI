import Conf from 'conf'
import chalk from 'chalk'
import { getNodes, updateNode } from '../api/client.js'
import { assignNumbers } from '../utils/numbering.js'
import { flattenTree } from '../utils/tree.js'
import { ApiError } from '../api/ApiError.js'

const store = new Conf({ projectName: 'stratanodex' })

export async function runDone(number: string, options: { list?: string }): Promise<void> {
  const listId = options.list ?? (store.get('lastListId') as string | undefined)

  if (!listId) {
    console.log(
      chalk.red(
        '✗ No active list. Run: stratanodex list -d 1 first, or use: stratanodex done <number> --list <listId>'
      )
    )
    return
  }

  try {
    const nodes = await getNodes(listId)
    const numberMap = assignNumbers(nodes)
    const flat = flattenTree(nodes)

    const byNumber = new Map<string, string>()
    for (const [id, num] of numberMap) {
      byNumber.set(num, id)
    }

    const nodeId = byNumber.get(number)
    if (!nodeId) {
      console.log(chalk.red(`✗ Node "${number}" not found.`))
      return
    }

    const updated = await updateNode(nodeId, { status: 'DONE' })
    const found = flat.find((n) => n.id === nodeId)
    console.log(chalk.green(`✓ Done: ${updated.title ?? found?.title}`))
  } catch (err) {
    if (err instanceof ApiError) {
      console.log(chalk.red(`✗ ${err.message}`))
    } else {
      console.log(chalk.red('✗ Unexpected error.'))
    }
  }
}
