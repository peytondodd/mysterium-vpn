/*
 * Copyright (C) 2017 The "MysteriumNetwork/mysterium-vpn" Authors.
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
import { getMysteriumVpnReleaseId } from '../../../libraries/version'

function bootstrap (container: Container) {
  const version = process.env.MYSTERION_VERSION
  const build = process.env.BUILD_NUMBER
  const mysterionReleaseID = getMysteriumVpnReleaseId(version, build)
  global.__mysterionReleaseID = mysterionReleaseID

  container.constant('mysterionReleaseID', mysterionReleaseID)
  container.service(
    'mysterionApplication.config',
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
    'mysterionApplication',
    [
      'mysterionApplication.config',
      'mysteriumClientInstaller',
      'mysteriumClientProcess',
      'mysteriumClientMonitoring',
      'proposalFetcher',
      'registrationFetcher',
      'countryList',
      'bugReporter',
      'environmentCollector',
      'logger',
      'frontendLogCache',
      'mysteriumProcessLogCache',
      'bugReporterMetrics',
      'userSettingsStore',
      'disconnectNotification',
      'featureToggle',
      'startupEventTracker'
    ],
    (
      mysterionConfig: MysteriumVpnConfig,
      mysteriumClientInstaller,
      mysteriumClientProcess,
      mysteriumClientMonitoring,
      proposalFetcher,
      registrationFetcher,
      countryList,
      bugReporter,
      environmentCollector,
      logger,
      frontendLogCache,
      mysteriumProcessLogCache,
      bugReporterMetrics,
      userSettingsStore,
      disconnectNotification,
      featureToggle,
      startupEventTracker
    ) => {
      return new MysteriumVpn({
        config: mysterionConfig,
        browserWindowFactory: () => container.get('mysterionBrowserWindow'),
        windowFactory: () => container.get('mysterionWindow'),
        terms: new Terms(path.join(mysterionConfig.staticDirectory, 'terms'), mysterionConfig.userDataDirectory),
        installer: mysteriumClientInstaller,
        process: mysteriumClientProcess,
        monitoring: mysteriumClientMonitoring,
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
        startupEventTracker
      })
    }
  )

  container.factory(
    'mysterionBrowserWindow',
    [],
    () => {
      return new BrowserWindow({
        resizable: false,
        show: false
      })
    })

  container.service(
    'mysterionWindow',
    ['mysterionBrowserWindow', 'feedbackForm.headerRule'],
    (browserWindow, rule) => {
      const url = process.env.NODE_ENV === 'development' ? `http://localhost:9080/` : `file://${__dirname}/index.html`

      const window = new Window(browserWindow, url)
      window.registerRequestHeadersRule(rule)
      return window
    }
  )
}

export default bootstrap
