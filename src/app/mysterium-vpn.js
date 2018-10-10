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
import trayFactory from '../main/tray/factory'
import translations from './messages'
import { onFirstEvent } from './communication/utils'
import path from 'path'
import type { Size } from './window'
import type { MysteriumVpnConfig } from './mysterium-vpn-config'
import Window from './window'
import Terms from './terms'
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
import ProcessManager from './mysterium-client/process-manager'
import type { MainCommunication } from './communication/main-communication'
import { reportUnknownProposalCountries } from './countries/reporting'
import FeatureToggle from './features/feature-toggle'

const LOG_PREFIX = '[MysteriumVpn] '

class MysteriumVpn {
  _browserWindowFactory: () => BrowserWindow
  _windowFactory: Function
  _config: MysteriumVpnConfig
  _terms: Terms
  _processManager: ProcessManager
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
  _featureToggle: FeatureToggle
  _startupEventTracker: StartupEventTracker
  _ipc: MainBufferedIpc
  _communication: MainCommunication
  _syncCallbacksInitializer: SyncCallbacksInitializer
  _communicationBindings: CommunicationBindings

  _window: Window // TODO: convert to maybe type

  constructor (params: MysteriumVpnParams) {
    this._browserWindowFactory = params.browserWindowFactory
    this._windowFactory = params.windowFactory
    this._config = params.config
    this._terms = params.terms
    this._processManager = params.processManager
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
    this._featureToggle = params.featureToggle
    this._startupEventTracker = params.startupEventTracker

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

    if (this._featureToggle.paymentsAreEnabled()) {
      this._communicationBindings.startRegistrationFetcherOnCurrentIdentity(this._registrationFetcher)
      this._communicationBindings.syncRegistrationStatus(this._registrationFetcher, this._bugReporter)
    }

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

    await this._processManager.ensureInstallation()
    await this._processManager.start()

    this._subscribeProposals()

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
    // TODO: fix - proposalFetcher can still be undefined at this point
    try {
      await this._proposalFetcher.stop()
    } catch (e) {
      logException('Failed to stop proposal fetcher', e)
      this._bugReporter.captureErrorException(e)
    }

    await this._processManager.stop()
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

    reportUnknownProposalCountries(this._proposalFetcher, this._bugReporter)

    this._processManager.onStatusUp(() => {
      logInfo('Starting proposal fetcher')
      this._proposalFetcher.start()
    })

    this._processManager.onStatusDown(() => {
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
