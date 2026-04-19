import 'dotenv/config'
import Conf from 'conf'

export interface Config {
  apiUrl: string
  verbose: boolean
}

interface ConfigStore {
  apiUrl?: string
}

const store = new Conf<ConfigStore>({ projectName: 'stratanodex' })

const DEFAULT_API_URL = 'https://stratanodex-backend.onrender.com'

let runtimeApiUrl: string | undefined

export function getConfig(): Config {
  const apiUrl =
    runtimeApiUrl ?? process.env['STRATANODEX_API_URL'] ?? store.get('apiUrl') ?? DEFAULT_API_URL

  const verbose = process.env['STRATANODEX_VERBOSE'] === 'true'

  return { apiUrl, verbose }
}

export function setRuntimeApiUrl(url: string): void {
  runtimeApiUrl = url
}

export function saveApiUrl(url: string): void {
  store.set('apiUrl', url)
}
