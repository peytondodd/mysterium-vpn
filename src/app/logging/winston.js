/*
 * Copyright (C) 2018 The "mysteriumnetwork/mysterium-vpn" Authors.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

// @flow

import winston from 'winston'
import type { LogLevel } from './mysterium-vpn-log-levels'
import LogCache from './log-cache'
import WinstonTransportCaching from './winston-transport-caching'
import type { StringLogger } from './string-logger'
import WinstonTransportSyncCom from './winston-transport-sync-com'
import type { SyncRendererCommunication } from '../communication/sync/sync-communication'

type WinstonLevel = 'error' | 'info' | 'warn' | 'debug'

type WinstonLogEntry = {
  level: WinstonLevel,
  message: string,
  timestamp?: string
}

const winstonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(log => `${log.timestamp} ${log.level}: ${log.message}`)
)

function createWinstonBaseLogger () {
  return winston.createLogger({
    format: winstonFormat,
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'logs.txt' })
    ]
  })
}

function createWinstonCachingLogger (logCache: LogCache): StringLogger {
  const winstonLogger = createWinstonBaseLogger()
  winstonLogger.add(new WinstonTransportCaching(logCache))
  return winstonLogger
}

function createWinstonSyncComLogger (communication: SyncRendererCommunication) {
  const winstonLogger = createWinstonBaseLogger()
  winstonLogger.add(new WinstonTransportSyncCom(communication))
  return winstonLogger
}

function mapWinstonLogLevelToApplicationLevel (level: WinstonLevel): LogLevel {
  return level === 'error' ? 'error' : 'info'
}

export type { WinstonLogEntry }
export {
  createWinstonCachingLogger,
  createWinstonSyncComLogger,
  mapWinstonLogLevelToApplicationLevel
}
