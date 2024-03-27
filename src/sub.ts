import { Buffer } from 'buffer'
import { EncodeConfig } from './config'
import { Config } from './interfaces'

export function ToRawSubscription(configList: Array<Config>): string {
  return configList.map(EncodeConfig).join("\n")
}

export function ToBase64Subscription(configList: Array<Config>): string {
  return Buffer.from(configList.map(EncodeConfig).join("\n"), "utf-8").toString("base64")
}
