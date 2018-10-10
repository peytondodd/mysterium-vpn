/*
 * Copyright (C) 2017 The "mysteriumnetwork/mysterium-vpn" Authors.
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

import logger from '../../../app/logger'
import type { LogCallback, Process } from '../index'
import type { TequilapiClient } from 'mysterium-tequilapi/lib/client'
import type { System } from '../system'
import ClientLogSubscriber from '../client-log-subscriber'
import { HEALTH_CHECK_INTERVAL, waitForStatusUp } from '../monitoring'
import ServiceManager, { SERVICE_STATE } from './service-manager'
import type { ServiceState } from './service-manager'

/***
 * Time in milliseconds required to fully activate Mysterium client after restart
 * @type {number}
 */
const SERVICE_INIT_TIME = HEALTH_CHECK_INTERVAL * 4

/***
 * Time in milliseconds required to wait for healthcheck
 * @type {number}
 */
const SERVICE_CHECK_TIME = HEALTH_CHECK_INTERVAL

class ServiceManagerProcess implements Process {
  _tequilapi: TequilapiClient
  _logs: ClientLogSubscriber
  _serviceManager: ServiceManager
  _system: System
  _repairIsRunning: boolean = false

  constructor (
    tequilapi: TequilapiClient,
    logs: ClientLogSubscriber,
    serviceManager: ServiceManager,
    system: System) {
    this._tequilapi = tequilapi
    this._logs = logs
    this._serviceManager = serviceManager
    this._system = system
  }

  async start (): Promise<void> {
    const state = await this._serviceManager.getServiceState()
    try {
      await waitForStatusUp(this._tequilapi, SERVICE_CHECK_TIME)
      return
    } catch (e) {
      logger.error('Unable to healthcheck while starting process', e)
    }
    await this._repair(state)
  }

  async repair (): Promise<void> {
    await this._repair()
  }

  async stop (): Promise<void> {
    // we shouldn't kill the process, just make sure it's disconnected
    // since this is service managed process
    await this._tequilapi.connectionCancel()
  }

  async kill (): Promise<void> {
    await this._tequilapi.stop()
  }

  async setupLogging (): Promise<void> {
    await this._logs.setup()
  }

  onLog (level: string, cb: LogCallback): void {
    this._logs.onLog(level, cb)
  }

  async _repair (state: ?ServiceState = null): Promise<void> {
    if (this._repairIsRunning) {
      return
    }
    this._repairIsRunning = true
    try {
      state = state || await this._serviceManager.getServiceState()

      logger.info(`Service state: [${state}]`)

      switch (state) {
        case SERVICE_STATE.START_PENDING:
          return
        case SERVICE_STATE.UNKNOWN:
          throw new Error('Cannot start non-installed or broken service')
        case SERVICE_STATE.RUNNING:
          await this._serviceManager.restart()
          break
        default:
          await this._serviceManager.start()
      }

      await waitForStatusUp(this._tequilapi, SERVICE_INIT_TIME)
    } finally {
      this._repairIsRunning = false
    }
  }
}

export default ServiceManagerProcess
