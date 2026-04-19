import Conf from 'conf'
import chalk from 'chalk'
import { getConfig, saveApiUrl } from '../config.js'

const ALLOWED_KEYS = ['apiUrl', 'verbose'] as const
type ConfigKey = (typeof ALLOWED_KEYS)[number]

const store = new Conf({ projectName: 'stratanodex' })

export function runConfig(subcommand: string, key?: string, value?: string): void {
  if (subcommand === 'list') {
    const cfg = getConfig()
    console.log(`apiUrl    ${cfg.apiUrl}`)
    console.log(`verbose   ${cfg.verbose}`)
    return
  }

  if (subcommand === 'get') {
    if (!key || !(ALLOWED_KEYS as readonly string[]).includes(key)) {
      console.log(chalk.red(`✗ Unknown config key: ${key}`))
      return
    }
    const cfg = getConfig()
    console.log(cfg[key as ConfigKey])
    return
  }

  if (subcommand === 'set') {
    if (!key || !(ALLOWED_KEYS as readonly string[]).includes(key)) {
      console.log(chalk.red(`✗ Unknown config key: ${key}`))
      return
    }
    if (value === undefined) {
      console.log(chalk.red('✗ A value is required.'))
      return
    }
    if (key === 'apiUrl') {
      saveApiUrl(value)
    } else {
      store.set(key, value)
    }
    console.log(chalk.green(`✓ Set ${key} = ${value}`))
    return
  }

  console.log(chalk.red(`✗ Unknown subcommand: ${subcommand}`))
}
