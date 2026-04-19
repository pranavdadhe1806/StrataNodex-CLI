import { clearToken, getToken } from '../utils/auth.js'
import chalk from 'chalk'

export function runLogout(): void {
  const token = getToken()
  if (!token) {
    console.log(chalk.yellow('You are not logged in.'))
    return
  }
  clearToken()
  console.log(chalk.green('✓ Logged out.'))
}
