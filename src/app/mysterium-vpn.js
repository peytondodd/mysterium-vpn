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
import type { MysteriumVpnParams } from './mysterium-vpn-params'
import type { Installer, Process } from '../libraries/mysterium-client'
import { logLevels as processLogLevels } from '../libraries/mysterium-client'
import trayFactory from '../main/tray/factory'
import { SUDO_PROMT_PERMISSION_DENIED } from '../libraries/mysterium-client/launch-daemon/launch-daemon-installer'
import FeatureToggle from './features/feature-toggle'
import translations from './messages'
import { onFirstEvent, onFirstEventOrTimeout } from './communication/utils'
import path from 'path'
import type { Size } from './window'
import type { MysteriumVpnConfig } from './mysterium-vpn-config'
import Window from './window'
import Terms from './terms'
import ProcessMonitoring from '../libraries/mysterium-client/monitoring'
import TequilapiProposalFetcher from './data-fetchers/tequilapi-proposal-fetcher'
import CountryList from './data-fetchers/country-list'
import type { BugReporter } from './bug-reporting/interface'
import { UserSettingsStorage } from './user-settings/user-settings-storage'
import Notification from './notification'
import type { EnvironmentCollector } from './bug-reporting/environment/environment-collector'
import LogCache from './logging/log-cache'
import SyncCallbacksInitializer from './sync-callbacks-initializer'
import type { StringLogger } from './logging/string-logger'
import logger from './logger'
import StartupEventTracker from './statistics/startup-event-tracker'
import TequilapiRegistrationFetcher from './data-fetchers/tequilapi-registration-fetcher'
import MainBufferedIpc from './communication/ipc/main-buffered-ipc'
import CommunicationBindings from './communication-bindings'
import { METRICS, TAGS } from './bug-reporting/metrics/metrics'
import type { BugReporterMetrics } from './bug-reporting/metrics/bug-reporter-metrics'
import type { MainCommunication } from './communication/main-communication'

const LOG_PREFIX = '[MysteriumVpn] '
const MYSTERIUM_CLIENT_STARTUP_THRESHOLD = 10000

class MysteriumVpn {
  _browserWindowFactory: () => BrowserWindow
  _windowFactory: Function
  _config: MysteriumVpnConfig
  _terms: Terms
  _installer: Installer
  _monitoring: ProcessMonitoring
  _process: Process
  _proposalFetcher: TequilapiProposalFetcher
  _registrationFetcher: TequilapiRegistrationFetcher
  _countryList: CountryList
  _bugReporter: BugReporter
  _environmentCollector: EnvironmentCollector
  _bugReporterMetrics: BugReporterMetrics
  _logger: StringLogger
  _frontendLogCache: LogCache
  _mysteriumProcessLogCache: LogCache
  _userSettingsStore: UserSettingsStorage
  _disconnectNotification: Notification
  _startupEventTracker: StartupEventTracker
  _featureToggle: FeatureToggle

  _window: Window
  _communication: MainCommunication
  _ipc: MainBufferedIpc
  _syncCallbacksInitializer: SyncCallbacksInitializer
  _communicationBindings: CommunicationBindings

  constructor (params: MysteriumVpnParams) {
    this._browserWindowFactory = params.browserWindowFactory
    this._windowFactory = params.windowFactory
    this._config = params.config
    this._terms = params.terms
    this._installer = params.installer
    this._monitoring = params.monitoring
    this._process = params.process
    this._proposalFetcher = params.proposalFetcher
    this._registrationFetcher = params.registrationFetcher
    this._countryList = params.countryList
    this._bugReporter = params.bugReporter
    this._environmentCollector = params.environmentCollector
    this._bugReporterMetrics = params.bugReporterMetrics
    this._logger = params.logger
    this._frontendLogCache = params.frontendLogCache
    this._mysteriumProcessLogCache = params.mysteriumProcessLogCache
    this._userSettingsStore = params.userSettingsStore
    this._disconnectNotification = params.disconnectNotification
    this._startupEventTracker = params.startupEventTracker
    this._featureToggle = params.featureToggle

    this._ipc = params.mainIpc
    this._communication = params.mainCommunication
    this._syncCallbacksInitializer = params.syncCallbacksInitializer
    this._communicationBindings = params.communicationBindings
  }

  run () {
    this._startupEventTracker.sendAppStartEvent()
    this._makeSureOnlySingleInstanceIsRunning()

    logger.setLogger(this._logger)
    this._bugReporterMetrics.set(TAGS.SESSION_ID, generateSessionId())
    this._syncCallbacksInitializer.initialize()
    this.logUnhandledRejections()

    // fired when app has been launched
    app.on('ready', async () => {
      try {
        logInfo('Application launch')
        await this.bootstrap()
      } catch (e) {
        logException('Application launch failed', e)
        this._bugReporter.captureErrorException(e)
      }
    })
    // fired when all windows are closed
    app.on('window-all-closed', () => this.onWindowsClosed())
    // fired just before quitting, this should quit
    app.on('will-quit', () => this.onWillQuit())
    // fired when app activated
    app.on('activate', () => {
      try {
        logInfo('Application activation')
        this._window.show()
      } catch (e) {
        logException('Application activation failed', e)
        this._bugReporter.captureErrorException(e)
      }
    })
    app.on('before-quit', () => {
      this._window.willQuitApp = true
    })
  }

  logUnhandledRejections () {
    process.on('unhandledRejection', error => {
      logException('Received unhandled rejection:', error)
    })
  }

  async bootstrap () {
    const showTerms = !this._areTermsAccepted()
    const browserWindow = this._createBrowserWindow()
    const windowSize = this._getWindowSize(showTerms)
    this._window = this._createWindow(windowSize)
    const send = this._getSendFunction(browserWindow)
    this._ipc.setSenderAndSendBuffered(send)

    this._communicationBindings.setCurrentIdentityForEventTracker(this._startupEventTracker)
    this._communicationBindings.syncCurrentIdentityForBugReporter(this._bugReporter)

    this._communicationBindings.startRegistrationFetcherOnCurrentIdentity(
      this._featureToggle,
      this._registrationFetcher
    )

    this._bugReporterMetrics.setWithCurrentDateTime(METRICS.START_TIME)

    await this._onRendererLoaded()

    if (showTerms) {
      const accepted = await this._acceptTermsOrQuit()
      if (!accepted) {
        return
      }
      this._window.resize(this._getWindowSize(false))
    }

    this._buildTray()

    await this._ensureDaemonInstallation()
    await this._startProcess()
    this._startProcessMonitoring()
    this._onProcessReady(() => {
      logInfo(`Notify that 'mysterium_client' process is ready`)
      this._communication.mysteriumClientReady.send()
    })

    this._subscribeProposals()

    if (this._featureToggle.paymentsAreEnabled()) {
      this._communicationBindings.syncRegistrationStatus(this._registrationFetcher, this._bugReporter)
    }

    this._communicationBindings.syncFavorites(this._userSettingsStore)
    this._communicationBindings.syncShowDisconnectNotifications(this._userSettingsStore)
    this._communicationBindings.showNotificationOnDisconnect(this._userSettingsStore, this._disconnectNotification)
    // TODO: load in DI?
    await this._loadUserSettings()
    this._disconnectNotification.onReconnect(() => this._communication.reconnectRequest.send())
  }

  _getWindowSize (showTerms: boolean) {
    if (showTerms) {
      return this._config.windows.terms
    } else {
      return this._config.windows.app
    }
  }

  _areTermsAccepted (): boolean {
    logInfo('Checking terms cache')
    try {
      this._terms.load()
      return this._terms.isAccepted()
    } catch (e) {
      this._bugReporter.captureErrorException(e)
      return false
    }
  }

  _getSendFunction (browserWindow: BrowserWindow) {
    return browserWindow.webContents.send.bind(browserWindow.webContents)
  }

  _createBrowserWindow () {
    try {
      return this._browserWindowFactory()
    } catch (e) {
      // TODO: add an error wrapper method
      throw new Error('Failed to open browser window. ' + e)
    }
  }

  _createWindow (size: Size) {
    logInfo('Opening window')
    try {
      const window = this._windowFactory()
      window.resize(size)
      window.open()
      return window
    } catch (e) {
      // TODO: add an error wrapper method
      throw new Error('Failed to open window. ' + e)
    }
  }

  async _onRendererLoaded () {
    logInfo('Waiting for window to be rendered')
    try {
      await onFirstEvent(this._communication.rendererBooted.on.bind(this._communication.rendererBooted))
    } catch (e) {
      // TODO: add an error wrapper method
      throw new Error('Failed to load app. ' + e)
    }
  }

  // checks if daemon is installed or daemon file is expired
  // if the installation fails, it sends a message to the renderer window
  async _ensureDaemonInstallation () {
    if (await this._installer.needsInstallation()) {
      logInfo("Installing 'mysterium_client' process")
      try {
        await this._installer.install()
      } catch (e) {
        let messageForUser = translations.processInstallationError
        if (e.message === SUDO_PROMT_PERMISSION_DENIED) {
          messageForUser = translations.processInstallationPermissionsError
        }
        this._communication.rendererShowError.send(messageForUser)
        throw new Error("Failed to install 'mysterium_client' process. " + e)
      }
    }
  }

  async _loadUserSettings () {
    try {
      await this._userSettingsStore.load()
    } catch (e) {
      this._bugReporter.captureInfoException(e)
    }
  }

  _makeSureOnlySingleInstanceIsRunning () {
    const instanceLockObtained = app.requestSingleInstanceLock()

    // quit if this isn't the first instance of the app
    if (!instanceLockObtained) {
      app.quit()
      return
    }

    // when a second app instance is launched, the new process will quit
    // but the first one will trigger this callback
    app.on('second-instance', () => {
      if (this._window.exists()) {
        this._window.show()
      }
    })
  }

  onWindowsClosed () {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  }

  async onWillQuit () {
    this._monitoring.stop()
    // TODO: fix - proposalFetcher can still be undefined at this point
    try {
      await this._proposalFetcher.stop()
    } catch (e) {
      logException('Failed to stop proposal fetcher', e)
      this._bugReporter.captureErrorException(e)
    }

    try {
      await this._process.stop()
    } catch (e) {
      logException("Failed to stop 'mysterium_client' process", e)
      this._bugReporter.captureErrorException(e)
    }
  }

  // make sure terms are up to date and accepted
  // declining terms will quit the app
  async _acceptTermsOrQuit () {
    logInfo('Accepting terms')
    try {
      const accepted = await this._acceptTerms()
      if (!accepted) {
        logInfo('Terms were refused. Quitting.')
        app.quit()
        return false
      }
    } catch (e) {
      this._communication.rendererShowError.send(e.message)
      throw new Error('Failed to accept terms. ' + e)
    }
    return true
  }

  async _acceptTerms () {
    this._communication.termsRequested.send({
      htmlContent: this._terms.getContent()
    })

    const termsAnsweredDTO = await onFirstEvent((callback) => {
      this._communication.termsAnswered.on(callback)
    })
    const termsAnswer = termsAnsweredDTO.isAccepted
    if (!termsAnswer) {
      return false
    }

    this._communication.termsAccepted.send()

    try {
      this._terms.accept()
    } catch (e) {
      const error = new Error(translations.termsAcceptError)
      const errorObj = (error: Object)
      errorObj.original = e
      throw error
    }
    return true
  }

  async _startProcess () {
    const cacheLogs = (level, data) => {
      this._mysteriumProcessLogCache.pushToLevel(level, data)
    }

    logInfo("Starting 'mysterium_client' process")
    try {
      await this._process.start()
      logInfo('mysterium_client start successful')
    } catch (e) {
      logException('mysterium_client start failed', e)
    }

    try {
      this._process.setupLogging()
      this._process.onLog(processLogLevels.INFO, (data) => cacheLogs(processLogLevels.INFO, data))
      this._process.onLog(processLogLevels.ERROR, (data) => cacheLogs(processLogLevels.ERROR, data))
    } catch (e) {
      logException('Failing to process logs. ', e)
      this._bugReporter.captureErrorException(e)
    }
  }

  _startProcessMonitoring () {
    this._monitoring.onStatusUp(() => {
      logInfo("'mysterium_client' is up")
      this._communication.healthcheckUp.send()
      this._bugReporterMetrics.set(METRICS.CLIENT_RUNNING, true)
    })
    this._monitoring.onStatusDown(() => {
      logInfo("'mysterium_client' is down")
      this._communication.healthcheckDown.send()
      this._bugReporterMetrics.set(METRICS.CLIENT_RUNNING, false)
    })
    this._monitoring.onStatus(status => {
      if (status === false) {
        logInfo("Starting 'mysterium_client' process, because it's currently down")
        this._repairProcess()
      }
    })

    logInfo("Starting 'mysterium_client' monitoring")
    this._monitoring.start()
  }

  async _repairProcess () {
    try {
      await this._process.repair()
    } catch (e) {
      this._monitoring.stop()
      this._bugReporter.captureErrorException(e)
      this._communication.rendererShowError.send({
        message: e.toString(),
        hint: 'Try to restart application',
        fatal: true
      })
    }
  }

  _onProcessReady (callback: () => void) {
    onFirstEventOrTimeout(this._monitoring.onStatusUp.bind(this._monitoring), MYSTERIUM_CLIENT_STARTUP_THRESHOLD)
      .then(callback)
      .catch(err => {
        if (this._monitoring.isStarted) {
          this._communication.rendererShowError.send(translations.processStartError)
        }
        logException("Failed to start 'mysterium_client' process", err)
      })
  }

  _subscribeProposals () {
    this._countryList.onUpdate((countries) => this._communication.countryUpdate.send(countries))

    const handleProposalFetchError = (error: Error) => {
      logException('Proposal fetching failed', error)
    }
    this._communication.proposalsUpdate.on(() => {
      this._proposalFetcher.fetch().catch((err: Error) => {
        handleProposalFetchError(err)
      })
    })
    this._proposalFetcher.onFetchingError(handleProposalFetchError)

    this._monitoring.onStatusUp(() => {
      logInfo('Starting proposal fetcher')
      this._proposalFetcher.start()
    })
    this._monitoring.onStatusDown(() => {
      this._proposalFetcher.stop()
    })
  }

  _buildTray () {
    logInfo('Building tray')
    trayFactory(
      this._communication,
      this._countryList,
      this._window,
      path.join(this._config.staticDirectory, 'icons')
    )
  }
}

function logInfo (message: string) {
  logger.info(LOG_PREFIX + message)
}

function logException (message: string, err: Error) {
  logger.error(LOG_PREFIX + message, err)
}

function generateSessionId () {
  return Math.floor(Math.random() * 10 ** 9).toString()
}

export default MysteriumVpn
