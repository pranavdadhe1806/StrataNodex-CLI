import path from 'path'
import fs from 'fs'
import Conf from 'conf'
import { getConfig } from '../config.js'

const confInstance = new Conf({ projectName: 'stratanodex' })
const confDir = path.dirname(confInstance.path)
const logFilePath = path.join(confDir, 'log.txt')

fs.mkdirSync(confDir, { recursive: true })

if (fs.existsSync(logFilePath)) {
  const stats = fs.statSync(logFilePath)
  if (stats.size > 10 * 1024 * 1024) {
    fs.renameSync(logFilePath, path.join(confDir, 'log.old.txt'))
  }
}

function writeLog(level: string, msg: string, data?: object): void {
  const entry = JSON.stringify({
    time: new Date().toISOString(),
    level,
    msg,
    ...(data ?? {}),
  })
  fs.appendFileSync(logFilePath, entry + '\n')
  if (getConfig().verbose) {
    process.stderr.write(entry + '\n')
  }
}

export const logger = {
  info: (msg: string, data?: object): void => writeLog('info', msg, data),
  error: (msg: string, data?: object): void => writeLog('error', msg, data),
  debug: (msg: string, data?: object): void => writeLog('debug', msg, data),
  warn: (msg: string, data?: object): void => writeLog('warn', msg, data),
}
