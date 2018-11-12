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

import type { TequilapiClient } from 'mysterium-tequilapi/lib/client'
import type { LogCallback, Process } from '../index'
import axios from 'axios'
import ClientLogSubscriber from '../client-log-subscriber'
import Monitoring from '../monitoring/monitoring'
import logger from '../../../app/logger'
import VersionCheck from '../version-check'
import sleep from '../../sleep'
import config from '../../../renderer/config'

/**
 * Spawns and stops 'mysterium_client' daemon on OSX
 */
class LaunchDaemonProcess implements Process {
  _tequilapi: TequilapiClient
  _daemonPort: number
  _logs: ClientLogSubscriber
  _monitoring: Monitoring
  _versionCheck: VersionCheck

  /**
   * @constructor
   * @param {TequilapiClient} tequilapi - api to be used
   * @param {ClientLogSubscriber} logs
   * @param {string} daemonPort - port at which the daemon is spawned
   */
  constructor (
    tequilapi: TequilapiClient,
    logs: ClientLogSubscriber,
    daemonPort: number,
    monitoring: Monitoring,
    versionCheck: VersionCheck) {
    this._tequilapi = tequilapi
    this._logs = logs
    this._daemonPort = daemonPort
    this._monitoring = monitoring
    this._versionCheck = versionCheck
  }

  async start (): Promise<void> {
    await this._spawnOsXLaunchDaemon()
  }

  async repair (): Promise<void> {
    await this.start()
  }

  async upgrade (): Promise<void> {
    logger.info('Upgrading: killing process')
    await this.kill()

    const unsubscribe = this._monitoring.onStatusDown(() => { this.start() })
    try {
      logger.info('Upgrading: waiting for upgraded client')
      await this._waitForUpgrade(config.upgradeWaitingTimeout)
    } finally {
      unsubscribe()
    }

    logger.info('Upgrading: upgraded process is up')
  }

  async _waitForUpgrade (timeout: number) {
    let timeFinished = false
    setTimeout(() => {
      timeFinished = true
    }, timeout)

    // eslint-disable-next-line no-unmodified-loop-condition
    while (!timeFinished) {
      if (await this._isUpgradeFinished()) {
        await this._monitoring.waitForStatusUpWithTimeout()
        return
      }
      await sleep(config.upgradeDelay)
    }
    throw new Error('Waiting for upgrade timed out')
  }

  async _isUpgradeFinished (): Promise<boolean> {
    try {
      logger.info('Checking if upgrade finished')
      let matches = await this._versionCheck.runningVersionMatchesPackageVersion()
      if (matches) {
        logger.info('Upgrade finished - versions matched')
      } else {
        logger.info('Upgrade not finished yet - versions mismatch')
      }
      return matches
    } catch (err) {
      logger.info('Upgrade not finished yet - client is down, probably still restarting')
      return false
    }
  }

  async stop (): Promise<void> {
    await this._tequilapi.stop()
  }

  async kill (): Promise<void> {
    await this.stop()
  }

  async setupLogging (): Promise<void> {
    await this._logs.setup()
  }

  onLog (level: string, cb: LogCallback): void {
    this._logs.onLog(level, cb)
  }

  async _spawnOsXLaunchDaemon (): Promise<void> {
    try {
      await axios.get('http://127.0.0.1:' + this._daemonPort, { timeout: 100 })
    } catch (e) {
      // no http server is running on `_daemonPort`, so request results in a failure
      // if some service is responding on daemonPort then additional healthcheck ensures tequilapi is accessible
    }
  }
}

export default LaunchDaemonProcess
