import dotenv from 'dotenv'
import { logger } from './logger'
import secrets from './secrets.json'

// Load environment variables from .env file
dotenv.config()

function getSecrets(deployEnv: string) {
  const envSecrets = (secrets as any)[deployEnv]
  if (!envSecrets) {
    logger.warn(`No secrets found for deploy env ${deployEnv}`)
    return {}
  }

  return envSecrets
}

export function getFirebaseAdminCreds(admin: any) {
  if (DEPLOY_ENV === 'local') {
    try {
      const serviceAccount = require('../serviceAccountKey.json')
      return admin.credential.cert(serviceAccount)
    } catch (error) {
      logger.error(
        'Error: Could not initialize admin credentials. Is serviceAccountKey.json missing?',
        error
      )
    }
  } else {
    try {
      return admin.credential.applicationDefault()
    } catch (error) {
      logger.error('Error: Could not retrieve default app creds', error)
    }
  }
}

export const DEPLOY_ENV = (process.env.DEPLOY_ENV as string).toLowerCase()
export const EXCHANGE_RATES_API = (process.env.EXCHANGE_RATES_API as string).toLowerCase()
export const { EXCHANGE_RATES_API_ACCESS_KEY } = getSecrets(DEPLOY_ENV)
export const BLOCKSCOUT_API = (process.env.BLOCKSCOUT_API as string).toLowerCase()
export const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID
export const FIREBASE_DB = `https://${FIREBASE_PROJECT_ID}.firebaseio.com`
export const FAUCET_ADDRESS = (process.env.FAUCET_ADDRESS as string).toLowerCase()
export const WEB3_PROVIDER_URL = process.env.WEB3_PROVIDER_URL
