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

import ClientLogSubscriber from '../../../../../src/libraries/mysterium-client/client-log-subscriber'
import BugReporterMock from '../../../../helpers/bug-reporter-mock'
import { after, before, beforeEach, describe, expect, it } from '../../../../helpers/dependencies'
import LaunchDaemonProcess from '../../../../../src/libraries/mysterium-client/launch-daemon/launch-daemon-process'
import MockAdapter from 'axios-mock-adapter'
import axios from 'axios'
import EmptyTequilapiClientMock from '../../../renderer/store/modules/empty-tequilapi-client-mock'
import { MockStatusNotifier } from '../../../../helpers/mysterium-client/monitoring-mock'
import { captureAsyncError, nextTick } from '../../../../helpers/utils'
import Monitoring from '../../../../../src/libraries/mysterium-client/monitoring/monitoring'
import VersionCheck from '../../../../../src/libraries/mysterium-client/version-check'
import type { NodeHealthcheckDTO } from 'mysterium-tequilapi/lib/dto/node-healthcheck'
import NodeBuildInfoDTO from 'mysterium-tequilapi/lib/dto/node-build-info'
import lolex from 'lolex'

class TequilapiClientMock extends EmptyTequilapiClientMock {
  stopped: boolean = false
  mockVersion: string = '1.0.0'

  async stop (): Promise<void> {
    this.stopped = true
  }

  async healthCheck (_timeout: ?number): Promise<NodeHealthcheckDTO> {
    return {
      uptime: '',
      process: 0,
      version: this.mockVersion,
      buildInfo: new NodeBuildInfoDTO({})
    }
  }
}

describe('LaunchDaemonProcess', () => {
  let process: LaunchDaemonProcess
  let notifierMock: MockStatusNotifier
  let monitoring: Monitoring
  let tequilApi: TequilapiClientMock

  let processStarted: boolean

  beforeEach(() => {
    const logSubscriber = new ClientLogSubscriber(new BugReporterMock(), '', '', '', () => new Date(), () => {})
    tequilApi = new TequilapiClientMock()
    notifierMock = new MockStatusNotifier()
    monitoring = new Monitoring(notifierMock)
    monitoring.start()
    process = new LaunchDaemonProcess(
      tequilApi,
      logSubscriber,
      1234,
      monitoring,
      new VersionCheck(tequilApi, '1.1.0')
    )

    processStarted = false
    const axiosMock = new MockAdapter(axios)
    axiosMock.onGet('http://127.0.0.1:1234').reply(() => {
      processStarted = true
      return [200]
    })
  })

  describe('.start', () => {
    it('makes a request to given localhost port', async () => {
      await process.start()
      expect(processStarted).to.be.true
    })
  })

  describe('.upgrade', () => {
    it('kills process and waits for new client version', async () => {
      const upgradePromise = process.upgrade()

      expect(tequilApi.stopped).to.be.true

      notifierMock.notifyStatus(true)
      tequilApi.mockVersion = '1.1.0'

      await upgradePromise
    })

    it('starts client when it is down', async () => {
      const upgradePromise = process.upgrade()
      await nextTick()

      expect(processStarted).to.be.false
      notifierMock.notifyStatus(false)

      notifierMock.notifyStatus(true)
      tequilApi.mockVersion = '1.1.0'

      await upgradePromise

      expect(processStarted).to.be.true
    })

    describe('with faked clock', () => {
      let clock

      before(() => {
        clock = lolex.install()
      })

      after(() => {
        clock.uninstall()
      })

      it('fails after timeout', async () => {
        const upgradePromise = process.upgrade()

        await nextTick()
        clock.tick(15000)

        const err = await captureAsyncError(() => upgradePromise)
        if (!(err instanceof Error)) {
          throw new Error('Expected error')
        }
        expect(err.message).to.eql('Waiting for upgrade timed out')
      })
    })
  })
})
