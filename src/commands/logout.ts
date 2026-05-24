import { clearToken, getToken } from '../utils/auth.js'
import { clearRecents } from '../utils/recents.js'
import chalk from 'chalk'

export function runLogout(): void {
  const token = getToken()
  if (!token) {
    console.log(chalk.yellow('You are not logged in.'))
    return
  }
  clearRecents() // must run before clearToken so userId can still be decoded
  clearToken()
  console.log(chalk.green('✓ Logged out.'))
}
