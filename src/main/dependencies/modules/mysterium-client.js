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
import os from 'os'
import path from 'path'
import { Tail } from 'tail'
import type { BugReporter } from '../../../app/bug-reporting/interface'

import type { Container } from '../../../app/di'
import type { MysteriumVpnConfig } from '../../../app/mysterium-vpn-config'
import type { Installer, LogCallback, Process } from '../../../libraries/mysterium-client'
import type { TailFunction } from '../../../libraries/mysterium-client/client-log-publisher'
import type { ClientConfig } from '../../../libraries/mysterium-client/config'
import type { TequilapiClient } from 'mysterium-tequilapi/lib/client'

import ClientLogPublisher from '../../../libraries/mysterium-client/client-log-publisher'

import LaunchDaemonInstaller from '../../../libraries/mysterium-client/launch-daemon/launch-daemon-installer'
import LaunchDaemonProcess from '../../../libraries/mysterium-client/launch-daemon/launch-daemon-process'

import ServiceManagerInstaller, { SERVICE_MANAGER_BIN }
  from '../../../libraries/mysterium-client/service-manager/service-manager-installer'
import ServiceManagerProcess from '../../../libraries/mysterium-client/service-manager/service-manager-process'

import { LAUNCH_DAEMON_PORT } from '../../../libraries/mysterium-client/launch-daemon/config'
import OSSystem from '../../../libraries/mysterium-client/system'
import ServiceManager from '../../../libraries/mysterium-client/service-manager/service-manager'
import ProcessManager from '../../../app/mysterium-client/process-manager'
import Monitoring from '../../../libraries/mysterium-client/monitoring/monitoring'
import type { MainCommunication } from '../../../app/communication/main-communication'
import LogCache from '../../../app/logging/log-cache'
import VersionCheck from '../../../libraries/mysterium-client/version-check'
import FeatureToggle from '../../../app/features/feature-toggle'
import type { BugReporterMetrics } from '../../../app/bug-reporting/metrics/bug-reporter-metrics'
import { TequilapiStatusNotifier } from '../../../libraries/mysterium-client/monitoring/tequilapi-status-notifier'
import { TimeFormatter } from '../../../libraries/formatters/time-formatter'

declare var MYSTERIUM_CLIENT_VERSION: string

const WINDOWS = 'win32'
const OSX = 'darwin'

function bootstrap (container: Container) {
  container.constant('mysteriumClient.platform', os.platform())

  container.service(
    'mysteriumClient.config',
    ['mysteriumClient.platform', 'mysteriumVpnApplication.config'],
    (platform: string, mysteriumVpnConfig: MysteriumVpnConfig): ClientConfig => {
      let clientBin = path.join(mysteriumVpnConfig.contentsDirectory, 'bin', 'myst')
      let openvpnBin = path.join(mysteriumVpnConfig.contentsDirectory, 'bin', 'openvpn')
      let systemLogPath = '/var/log/system.log'

      if (platform === WINDOWS) {
        clientBin += '.exe'
        openvpnBin += '.exe'
        systemLogPath = null
      }

      return {
        clientBin: clientBin,
        configDir: path.join(mysteriumVpnConfig.contentsDirectory, 'bin', 'config'),
        openVPNBin: openvpnBin,
        dataDir: mysteriumVpnConfig.userDataDirectory,
        runtimeDir: mysteriumVpnConfig.runtimeDirectory,
        logDir: mysteriumVpnConfig.userDataDirectory,
        stdOutFileName: 'stdout.log',
        stdErrFileName: 'stderr.log',
        systemLogPath: systemLogPath,
        tequilapiPort: 4050
      }
    }
  )

  container.service(
    'serviceManager',
    ['mysteriumVpnApplication.config', 'mysteriumClient.platform', 'mysteriumClientMonitoring'],
    (mysteriumVpnConfig: MysteriumVpnConfig, platform: string, mysteriumClientMonitoring: Monitoring) => {
      switch (platform) {
        case WINDOWS:
          let serviceManagerPath = path.join(mysteriumVpnConfig.contentsDirectory, 'bin', SERVICE_MANAGER_BIN)
          return new ServiceManager(serviceManagerPath, new OSSystem(), mysteriumClientMonitoring)
        default:
          return null
      }
    }
  )

  container.service(
    'mysteriumClientInstaller',
    ['mysteriumClient.config', 'mysteriumClient.platform', 'serviceManager', 'bugReporter'],
    (config: ClientConfig, platform: string, serviceManager: ServiceManager, bugReporter: BugReporter) => {
      switch (platform) {
        case OSX:
          return new LaunchDaemonInstaller(config, new OSSystem())
        case WINDOWS:
          return new ServiceManagerInstaller(new OSSystem(), config, serviceManager)
        default:
          const message = `No installer implementation for platform: ${platform}`
          bugReporter.captureErrorMessage(message)
          throw new Error(message)
      }
    }
  )

  container.service(
    'mysteriumClient.tailFunction', [], () => {
      return (file: string, logCallback: LogCallback) => {
        const logTail = new Tail(file)
        logTail.on('line', logCallback)
        logTail.on('error', () => {
          // eslint-disable-next-line
          console.error(`log file watching failed. file probably doesn't exist: ${file}`)
        })
      }
    }
  )

  container.service(
    'mysteriumClient.logPublisher',
    ['bugReporter', 'mysteriumClient.config', 'mysteriumClient.tailFunction', 'timeFormatter'],
    (bugReporter: BugReporter, config: ClientConfig, tailFunction: TailFunction, timeFormatter: TimeFormatter) => {
      return new ClientLogPublisher(
        bugReporter,
        path.join(config.logDir, config.stdOutFileName),
        path.join(config.logDir, config.stdErrFileName),
        config.systemLogPath,
        () => new Date(),
        timeFormatter,
        tailFunction
      )
    }
  )

  container.service(
    'mysteriumClientProcess',
    ['tequilapiClient',
      'mysteriumClient.config',
      'mysteriumClient.logPublisher',
      'mysteriumClient.platform',
      'mysteriumClientMonitoring',
      'serviceManager',
      'bugReporter',
      'mysteriumClientVersionCheck'
    ],
    (
      tequilapiClient: TequilapiClient,
      config: ClientConfig,
      logPublisher: ClientLogPublisher,
      platform: string,
      monitoring: Monitoring,
      serviceManager: ServiceManager,
      bugReporter: BugReporter,
      versionCheck: VersionCheck
    ) => {
      switch (platform) {
        case OSX:
          return new LaunchDaemonProcess(tequilapiClient, logPublisher, LAUNCH_DAEMON_PORT, monitoring, versionCheck)
        case WINDOWS:
          return new ServiceManagerProcess(
            tequilapiClient,
            logPublisher,
            serviceManager,
            new OSSystem()
          )
        default:
          const message = `No process implementation for platform: ${platform}`
          bugReporter.captureErrorMessage(message)
          throw new Error(message)
      }
    }
  )

  container.service(
    'mysteriumClientMonitoring',
    ['tequilapiClient'],
    (tequilapiClient) => {
      const notifier = new TequilapiStatusNotifier(tequilapiClient)
      return new Monitoring(notifier)
    }
  )

  container.service(
    'mysteriumClientVersionCheck',
    ['tequilapiClient'],
    (tequilapiClient) => new VersionCheck(tequilapiClient, MYSTERIUM_CLIENT_VERSION)
  )

  container.service(
    'mysteriumClientProcessManager',
    [
      'mysteriumClientInstaller',
      'mysteriumClientProcess',
      'mysteriumClientMonitoring',
      'mainCommunication',
      'mysteriumProcessLogCache',
      'mysteriumClientVersionCheck',
      'featureToggle',
      'bugReporter',
      'bugReporterMetrics'
    ],
    (
      installer: Installer,
      process: Process,
      monitoring: Monitoring,
      communication: MainCommunication,
      logCache: LogCache,
      versionCheck: VersionCheck,
      featureToggle: FeatureToggle,
      bugReporter: BugReporter,
      bugReporterMetrics: BugReporterMetrics
    ) => {
      return new ProcessManager(
        installer,
        process,
        monitoring,
        communication,
        logCache,
        versionCheck,
        featureToggle,
        bugReporter,
        bugReporterMetrics
      )
    }
  )
}

export default bootstrap
