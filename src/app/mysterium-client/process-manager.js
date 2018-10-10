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

import type { Installer, Process } from '../../libraries/mysterium-client'
import type { Monitoring, EmptyCallback } from '../../libraries/mysterium-client/monitoring'
import type { MainCommunication } from '../communication/main-communication'
import LogCache from '../logging/log-cache'
import VersionCheck from '../../libraries/mysterium-client/version-check'
import translations from '../messages'
import { SUDO_PROMT_PERMISSION_DENIED } from '../../libraries/mysterium-client/launch-daemon/launch-daemon-installer'
import logger from '../logger'
import { logLevels as processLogLevels } from '../../libraries/mysterium-client'
import { onFirstEventOrTimeout } from '../communication/utils'
import { bugReporter, bugReporterMetrics } from '../../main/helpers/bug-reporter'
import { METRICS } from '../bug-reporting/metrics/metrics'
import FeatureToggle from '../features/feature-toggle'

const LOG_PREFIX = '[ProcessManager]'
const MYSTERIUM_CLIENT_STARTUP_THRESHOLD = 10000

class ProcessManager {
  _installer: Installer
  _process: Process
  _monitoring: Monitoring
  _communication: MainCommunication
  _logCache: LogCache
  _versionCheck: VersionCheck
  _featureToggle: FeatureToggle

  constructor (
    installer: Installer,
    process: Process,
    monitoring: Monitoring,
    communication: MainCommunication,
    logCache: LogCache,
    versionCheck: VersionCheck,
    featureToggle: FeatureToggle
  ) {
    this._installer = installer
    this._process = process
    this._monitoring = monitoring
    this._communication = communication
    this._logCache = logCache
    this._versionCheck = versionCheck
    this._featureToggle = featureToggle
  }

  async ensureInstallation () {
    const needsInstallation = await this._installer.needsInstallation()
    if (!needsInstallation) {
      return
    }
    await this._installProcess()
  }

  async start () {
    this._startLogging().catch(error => {
      this._logError(`Starting process logging failed.`, error.message)
      bugReporter().captureErrorException(error)
    })
    this._startMonitoring()
    this._onProcessReady()

    await this._startProcess()
  }

  async stop () {
    this._monitoring.stop()

    try {
      await this._process.stop()
    } catch (error) {
      this._logError(`Failed to stop 'mysterium_client' process`, error)

      bugReporter().captureErrorException(error)
    }
  }

  onStatusUp (callback: EmptyCallback) {
    this._monitoring.onStatusUp(callback)
  }

  onStatusDown (callback: EmptyCallback) {
    this._monitoring.onStatusDown(callback)
  }

  async _startLogging () {
    await this._process.setupLogging()
    this._process.onLog(processLogLevels.INFO, (data) => this._logCache.pushToLevel(processLogLevels.INFO, data))
    this._process.onLog(processLogLevels.ERROR, (data) => this._logCache.pushToLevel(processLogLevels.ERROR, data))
  }

  _startMonitoring () {
    this._monitoring.onStatusUp(() => {
      this._logInfo(`'mysterium_client' is up`)

      this._communication.healthcheckUp.send()

      bugReporterMetrics().set(METRICS.CLIENT_RUNNING, true)
    })

    this._monitoring.onStatusDown(() => {
      this._logInfo(`'mysterium_client' is down`)

      this._communication.healthcheckDown.send()

      bugReporterMetrics().set(METRICS.CLIENT_RUNNING, false)
    })

    this._monitoring.onStatus((status) => {
      if (status === true) {
        return
      }

      this._repairProcess()
    })

    this._logInfo(`Starting 'mysterium_client' monitoring`)

    this._monitoring.start()
  }

  async _startProcess () {
    this._logInfo(`Starting 'mysterium_client' process`)

    try {
      await this._process.start()
      this._logInfo(`mysterium_client started successful`)
    } catch (error) {
      this._logError(`mysterium_client start failed`, error)
    }
  }

  async _installProcess () {
    this._logInfo(`Installing 'mysterium_client' process`)

    try {
      await this._installer.install()
    } catch (error) {
      let messageForUser = translations.processInstallationError

      if (error.message === SUDO_PROMT_PERMISSION_DENIED) {
        messageForUser = translations.processInstallationPermissionsError
      }

      this._communication.rendererShowError.send({ message: messageForUser })

      throw new Error(`Failed to install 'mysterium_client' process. ` + error.message)
    }
  }

  _onProcessReady () {
    onFirstEventOrTimeout(this._monitoring.onStatusUp.bind(this._monitoring), MYSTERIUM_CLIENT_STARTUP_THRESHOLD)
      .then(async () => {
        if (!this._featureToggle.clientVersionCheckEnabled()) {
          this._logInfo(`Client version check disabled`)

          return
        }

        const versionMatch: boolean = await this._versionCheck.runningVersionMatchesPackageVersion()
        if (!versionMatch) {
          this._logInfo(`'mysterium_client' outdated. Killing it.`)

          this._process.kill()
        }
      })
      .catch(error => {
        if (this._monitoring.isStarted()) {
          this._communication.rendererShowError.send({ message: translations.processStartError })
        }

        this._logError(`Failed to start 'mysterium_client' process`, error)
      })
  }

  async _repairProcess () {
    this._logInfo(`Repairing 'mysterium_client' process`)

    try {
      await this._process.repair()
    } catch (error) {
      this._monitoring.stop()

      bugReporter().captureErrorException(error)

      this._communication.rendererShowError.send({ message: translations.processStartError })
    }
  }

  _logInfo (...data: Array<any>) {
    logger.info(this._formatLog(data))
  }

  _logError (...data: Array<any>) {
    logger.error(this._formatLog(data))
  }

  _formatLog (data: Array<any>) {
    return `${LOG_PREFIX} ${data.join(' ')}`
  }
}

export default ProcessManager
