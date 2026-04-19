#!/usr/bin/env node

import { program } from 'commander'
import { createRequire } from 'module'
import { setRuntimeApiUrl } from './config.js'
import { runLogin } from './commands/login.js'
import { runLogout } from './commands/logout.js'
import { runConfig } from './commands/config.js'
import { runList } from './commands/list.js'
import { runAdd } from './commands/add.js'
import { runDone } from './commands/done.js'

const require = createRequire(import.meta.url)
const pkg = require('../package.json') as { version: string }

program
  .name('stratanodex')
  .description('CLI-first productivity and task management system')
  .version(pkg.version)

program.option('--api-url <url>', 'Override API base URL').hook('preAction', (thisCommand) => {
  const opts = thisCommand.opts() as { apiUrl?: string }
  if (opts.apiUrl) setRuntimeApiUrl(opts.apiUrl)
})

program
  .command('login')
  .description('Log in to your StrataNodex account')
  .action(async () => {
    await runLogin()
  })

program
  .command('logout')
  .description('Log out and clear stored credentials')
  .action(() => {
    runLogout()
  })

const configCmd = program.command('config').description('Manage CLI configuration')

configCmd
  .command('list')
  .description('Show all config values')
  .action(() => runConfig('list'))

configCmd
  .command('get <key>')
  .description('Get a config value')
  .action((key: string) => runConfig('get', key))

configCmd
  .command('set <key> <value>')
  .description('Set a config value')
  .action((key: string, value: string) => runConfig('set', key, value))

program
  .command('list')
  .description('List folders, lists, and tasks')
  .option('-d, --depth <number>', 'Depth of nodes to show (0=none, 1=top-level, 2=two levels)', '0')
  .action(async (options: { depth?: string }) => {
    await runList({ depth: parseInt(options.depth ?? '0', 10) })
  })

program
  .command('add <title>')
  .description('Add a new task')
  .option('--list <listId>', 'List ID to add the task to')
  .option('--parent <number>', 'Parent node number (e.g. 1.2) to add as sub-task')
  .action(async (title: string, options: { list?: string; parent?: string }) => {
    await runAdd(title, options)
  })

program
  .command('done <number>')
  .description('Mark a task as done by its number')
  .option('--list <listId>', 'List ID (optional, uses last active list if omitted)')
  .action(async (number: string, options: { list?: string }) => {
    await runDone(number, options)
  })

if (process.argv.length === 2) {
  console.log('TUI coming soon. Use --help to see available commands.')
  process.exit(0)
}

program.parse()
