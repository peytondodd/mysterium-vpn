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
import VersionCheck from '../../../../src/libraries/mysterium-client/version-check'
import { buildMainCommunication } from '../../../../src/app/communication/main-communication'
import LogCache from '../../../../src/app/logging/log-cache'
import FeatureToggle from '../../../../src/app/features/feature-toggle'
import { buildRendererCommunication } from '../../../../src/app/communication/renderer-communication'
import { CallbackRecorder, captureAsyncError, nextTick } from '../../../helpers/utils'
import DirectMessageBus from '../../../helpers/direct-message-bus'
import { SUDO_PROMT_PERMISSION_DENIED }
  from '../../../../src/libraries/mysterium-client/launch-daemon/launch-daemon-installer'
import BugReporterMock from '../../../helpers/bug-reporter-mock'
import BugReporterMetricsStore from '../../../../src/app/bug-reporting/metrics/bug-reporter-metrics-store'
import TequilapiVersionMock from '../../../helpers/mysterium-tequilapi/tequilapi-version-check.spec'
import MonitoringMock from '../../../helpers/mysterium-client/monitoring-mock'

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
  startedCount: number = 0
  repaired: boolean = false
  killed: boolean = false
  upgraded: boolean = false

  async start (): Promise<void> {
    this.startedCount++
  }

  get started (): boolean {
    return this.startedCount > 0
  }

  async repair (): Promise<void> {
    this.repaired = true
  }

  async upgrade (): Promise<void> {
    this.upgraded = true
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
      processManager.start()
      expect(process.started).to.be.true
    })

    it('starts process even when logging setup fails', async () => {
      process.setupLoggingErrorMock = new Error('mock error')
      processManager.start()
      expect(process.started).to.be.true
    })

    describe('when client version matches', () => {
      it('does not kill process', async () => {
        const startPromise = processManager.start()
        await nextTick()
        monitoring.updateStatus(true)
        await startPromise

        expect(process.killed).to.be.false
      })

      it('sends message when process goes up', async () => {
        const startPromise = processManager.start()
        await nextTick()
        const recorder = new CallbackRecorder()
        remoteCommunication.healthcheckUp.on(recorder.getCallback())

        monitoring.updateStatus(true)
        await startPromise

        expect(recorder.invoked).to.be.true
      })

      it('repairs process when process goes down', async () => {
        const startPromise = processManager.start()
        await nextTick()
        monitoring.updateStatus(true)
        await startPromise

        monitoring.updateStatus(false)

        expect(process.repaired).to.be.true
      })
    })

    it('sends message when process goes down', async () => {
      const startPromise = processManager.start()
      await nextTick()
      monitoring.updateStatus(true)
      await startPromise

      const recorder = new CallbackRecorder()
      remoteCommunication.healthcheckDown.on(recorder.getCallback())

      monitoring.updateStatus(false)

      expect(recorder.invoked).to.be.true
    })

    describe('when client version does not match', () => {
      beforeEach(() => {
        tequilapi.versionMock = '0.0.1'
      })

      it('upgrades process', async () => {
        const startPromise = processManager.start()
        await nextTick()

        monitoring.updateStatus(true)
        await startPromise

        expect(process.upgraded).to.be.true
      })
    })
  })

  describe('.stop', () => {
    it('does not raise error', async () => {
      await processManager.stop()
    })
  })
})
