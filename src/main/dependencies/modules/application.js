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
import { app, BrowserWindow } from 'electron'
import type { Container } from '../../../app/di'
import MysteriumVpn from '../../../app/mysterium-vpn'
import type { MysteriumVpnConfig } from '../../../app/mysterium-vpn-config'
import path from 'path'
import Window from '../../../app/window'
import Terms from '../../../app/terms'
import { getReleaseId } from '../../../libraries/version'
import ProcessManager from '../../../app/mysterium-client/process-manager'

function bootstrap (container: Container) {
  const version = process.env.MYSTERIUM_VPN_VERSION
  const build = process.env.BUILD_NUMBER
  const mysteriumVpnReleaseID = getReleaseId(version, build)
  global.__mysteriumVpnReleaseID = mysteriumVpnReleaseID

  container.constant('mysteriumVpnReleaseID', mysteriumVpnReleaseID)
  container.service(
    'mysteriumVpnApplication.config',
    [],
    () => {
      const inDevMode = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'testing'

      let contentsDirectory = path.resolve(app.getAppPath(), '../../')
      if (inDevMode) {
        // path from this file
        contentsDirectory = path.resolve(__dirname, '../../../../')
      }

      let staticDirectory = path.join(app.getAppPath(), '../', 'static')
      if (inDevMode) {
        // path from this file
        staticDirectory = path.resolve(__dirname, '../../../../static')
      }

      return {
        // Application root directory
        contentsDirectory: contentsDirectory,
        // User data directory. This should store logs, terms and conditions file, etc.
        userDataDirectory: app.getPath('userData'),
        // Runtime/working directory, used for storing temp files
        runtimeDirectory: app.getPath('temp'),
        // Static file directory
        staticDirectory: staticDirectory.replace(/\\/g, '\\\\'),
        // Window configuration
        windows: {
          terms: { width: 800, height: 650 },
          app: { width: 650, height: 650 }
        }
      }
    }
  )

  container.service(
    'mysteriumVpnApplication',
    [
      'mysteriumVpnApplication.config',
      'proposalFetcher',
      'registrationFetcher',
      'countryList',
      'mysteriumClientProcessManager',
      'bugReporter',
      'environmentCollector',
      'logger',
      'frontendLogCache',
      'mysteriumProcessLogCache',
      'bugReporterMetrics',
      'userSettingsStore',
      'disconnectNotification',
      'featureToggle',
      'startupEventTracker',
      'mainIpc',
      'mainCommunication',
      'syncCallbacksInitializer',
      'communicationBindings'
    ],
    (
      mysteriumVpnConfig: MysteriumVpnConfig,
      proposalFetcher,
      registrationFetcher,
      countryList,
      processManager: ProcessManager,
      bugReporter,
      environmentCollector,
      logger,
      frontendLogCache,
      mysteriumProcessLogCache,
      bugReporterMetrics,
      userSettingsStore,
      disconnectNotification,
      featureToggle,
      startupEventTracker,
      mainIpc,
      mainCommunication,
      syncCallbacksInitializer,
      communicationBindings
    ) => {
      return new MysteriumVpn({
        config: mysteriumVpnConfig,
        browserWindowFactory: () => container.get('mysteriumVpnBrowserWindow'),
        windowFactory: () => container.get('mysteriumVpnWindow'),
        terms: new Terms(path.join(mysteriumVpnConfig.staticDirectory, 'terms'), mysteriumVpnConfig.userDataDirectory),
        processManager: processManager,
        proposalFetcher: proposalFetcher,
        registrationFetcher: registrationFetcher,
        countryList: countryList,
        bugReporter: bugReporter,
        environmentCollector,
        bugReporterMetrics,
        logger,
        frontendLogCache,
        mysteriumProcessLogCache,
        userSettingsStore,
        disconnectNotification,
        featureToggle,
        startupEventTracker,
        mainIpc,
        mainCommunication,
        syncCallbacksInitializer,
        communicationBindings
      })
    }
  )

  container.factory(
    'mysteriumVpnBrowserWindow',
    [],
    () => {
      return new BrowserWindow({
        resizable: false,
        show: false
      })
    })

  container.service(
    'mysteriumVpnWindow',
    ['mysteriumVpnBrowserWindow', 'feedbackForm.headerRule'],
    (browserWindow, rule) => {
      const url = process.env.NODE_ENV === 'development' ? `http://localhost:9080/` : `file://${__dirname}/index.html`

      const window = new Window(browserWindow, url)
      window.registerRequestHeadersRule(rule)
      return window
    }
  )
}

export default bootstrap
