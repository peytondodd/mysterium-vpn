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

import { beforeEach, describe, expect, it } from '../../../helpers/dependencies'
import ProcessManager from '../../../../src/app/mysterium-client/process-manager'
import type { Installer, Process } from '../../../../src/libraries/mysterium-client'
import type {
  Monitoring,
  StatusCallback,
  EmptyCallback
} from '../../../../src/libraries/mysterium-client/monitoring'
import VersionCheck from '../../../../src/libraries/mysterium-client/version-check'
import { buildMainCommunication } from '../../../../src/app/communication/main-communication'
import LogCache from '../../../../src/app/logging/log-cache'
import FeatureToggle from '../../../../src/app/features/feature-toggle'
import { buildRendererCommunication } from '../../../../src/app/communication/renderer-communication'
import { CallbackRecorder, captureAsyncError, nextTick } from '../../../helpers/utils'
import DirectMessageBus from '../../../helpers/direct-message-bus'
import { SUDO_PROMT_PERMISSION_DENIED }
  from '../../../../src/libraries/mysterium-client/launch-daemon/launch-daemon-installer'
import Subscriber from '../../../../src/libraries/subscriber'
import BugReporterMock from '../../../helpers/bug-reporter-mock'
import BugReporterMetricsStore from '../../../../src/app/bug-reporting/metrics/bug-reporter-metrics-store'
import TequilapiVersionMock from '../../../helpers/mysterium-tequilapi/tequilapi-version-check.spec'

class InstallerMock implements Installer {
  needsInstallationMock: boolean = false
  installed: boolean = false
  installErrorMock: ?Error = null

  async needsInstallation (): Promise<boolean> {
    return this.needsInstallationMock
  }

  async install (): Promise<void> {
    this.installed = true
    if (this.installErrorMock) {
      throw this.installErrorMock
    }
  }
}

class ProcessMock implements Process {
  setupLoggingErrorMock: ?Error = null
  started: boolean = false
  repaired: boolean = false
  killed: boolean = false

  async start (): Promise<void> {
    this.started = true
  }

  async repair (): Promise<void> {
    this.repaired = true
  }

  async stop (): Promise<void> {
  }

  async kill (): Promise<void> {
    this.killed = true
  }

  onLog (level: string, callback: Function): void {
  }

  async setupLogging (): Promise<void> {
    if (this.setupLoggingErrorMock) {
      throw this.setupLoggingErrorMock
    }
  }
}

class MonitoringMock implements Monitoring {
  _started: boolean = false

  _statusSubscriber: Subscriber<boolean> = new Subscriber()
  _upSubscriber: Subscriber<void> = new Subscriber()
  _downSubscriber: Subscriber<void> = new Subscriber()
  _changeUpSubscriber: Subscriber<void> = new Subscriber()
  _changeDownSubscriber: Subscriber<void> = new Subscriber()

  start (): void {
    this._started = true
  }

  stop (): void {
  }

  onStatus (callback: StatusCallback): void {
    this._statusSubscriber.subscribe(callback)
  }

  onStatusUp (callback: EmptyCallback): void {
    this._upSubscriber.subscribe(callback)
  }

  onStatusDown (callback: EmptyCallback): void {
    this._downSubscriber.subscribe(callback)
  }

  onStatusChangeUp (callback: EmptyCallback): void {
    this._changeUpSubscriber.subscribe(callback)
  }

  onStatusChangeDown (callback: EmptyCallback): void {
    this._changeDownSubscriber.subscribe(callback)
  }

  isStarted (): boolean {
    return this._started
  }

  triggerStatus (status: boolean) {
    this._statusSubscriber.notify(status)
  }

  triggerStatusChangeUp () {
    this._changeUpSubscriber.notify()
  }

  triggerStatusChangeDown () {
    this._changeDownSubscriber.notify()
  }

  triggerStatusUp () {
    this._upSubscriber.notify()
  }

  triggerStatusDown () {
    this._downSubscriber.notify()
  }
}

describe('ProcessManager', () => {
  let monitoring
  let installer
  let process

  let processManager
  let tequilapi

  let remoteCommunication

  beforeEach(() => {
    monitoring = new MonitoringMock()
    installer = new InstallerMock()
    process = new ProcessMock()
    const logCache = new LogCache()
    tequilapi = new TequilapiVersionMock('1.0.0')
    const versionCheck = new VersionCheck(tequilapi, '1.0.0')

    const messageBus = new DirectMessageBus()
    const communication = buildMainCommunication(messageBus)
    remoteCommunication = buildRendererCommunication(messageBus)

    const featureToggle = new FeatureToggle({})
    const bugReporter = new BugReporterMock()
    const bugReporterMetrics = new BugReporterMetricsStore()

    processManager = new ProcessManager(
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
  })

  describe('.ensureInstallation', () => {
    it('installs when process needs it', async () => {
      installer.needsInstallationMock = true
      await processManager.ensureInstallation()
      expect(installer.installed).to.be.true
    })

    it('does not install when process does not need it', async () => {
      installer.needsInstallationMock = false
      await processManager.ensureInstallation()
      expect(installer.installed).to.be.false
    })

    describe('when installation fails', () => {
      beforeEach(() => {
        installer.needsInstallationMock = true
        installer.installErrorMock = new Error('Mock error')
      })

      it('throws error', async () => {
        const err = await captureAsyncError(() => processManager.ensureInstallation())
        if (!(err instanceof Error)) {
          throw new Error('Expected error')
        }
        expect(err.message).to.eql('Failed to install \'mysterium_client\' process. Mock error')
      })

      it('sends error message to renderer', async () => {
        const recorder = new CallbackRecorder()
        remoteCommunication.rendererShowError.on(recorder.getCallback())

        await captureAsyncError(() => processManager.ensureInstallation())

        expect(recorder.invoked).to.be.true
        expect(recorder.firstArgument).to.eql({ message: 'Failed to install MysteriumVPN.' })
      })

      it('sends permission message to renderer when permissions were denied', async () => {
        installer.installErrorMock = new Error(SUDO_PROMT_PERMISSION_DENIED)
        const recorder = new CallbackRecorder()
        remoteCommunication.rendererShowError.on(recorder.getCallback())

        await captureAsyncError(() => processManager.ensureInstallation())

        expect(recorder.invoked).to.be.true
        expect(recorder.firstArgument).to.eql({
          message: 'Failed to install MysteriumVPN. Please restart the app and grant permissions.'
        })
      })
    })
  })

  describe('.start', () => {
    it('starts process', async () => {
      await processManager.start()
      expect(process.started).to.be.true
    })

    it('starts process even when logging setup fails', async () => {
      process.setupLoggingErrorMock = new Error('mock error')
      await processManager.start()
      expect(process.started).to.be.true
    })

    it('starts monitoring', async () => {
      expect(monitoring.isStarted()).to.be.false
      await processManager.start()
      expect(monitoring.isStarted()).to.be.true
    })

    it('sends message when process goes up', async () => {
      await processManager.start()

      const recorder = new CallbackRecorder()
      remoteCommunication.healthcheckUp.on(recorder.getCallback())

      monitoring.triggerStatusChangeUp()

      expect(recorder.invoked).to.be.true
    })

    it('sends message when process goes down', async () => {
      await processManager.start()

      const recorder = new CallbackRecorder()
      remoteCommunication.healthcheckDown.on(recorder.getCallback())

      monitoring.triggerStatusChangeDown()

      expect(recorder.invoked).to.be.true
    })

    it('repairs process each time the process is down', async () => {
      await processManager.start()

      monitoring.triggerStatusDown()

      expect(process.repaired).to.be.true
    })

    it('does not kill process if client version matches', async () => {
      await processManager.start()

      expect(process.killed).to.be.false
    })

    it('kills process if client version does not match', async () => {
      tequilapi.versionMock = '0.0.1'
      await processManager.start()
      monitoring.triggerStatusChangeUp()
      await nextTick()

      expect(process.killed).to.be.true
    })
  })

  describe('.stop', () => {
    it('does not raise error', async () => {
      await processManager.stop()
    })
  })
})
