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
import { beforeEach, describe, expect, it } from '../../../../helpers/dependencies'
import LaunchDaemonProcess from '../../../../../src/libraries/mysterium-client/launch-daemon/launch-daemon-process'
import MockAdapter from 'axios-mock-adapter'
import axios from 'axios'
import EmptyTequilapiClientMock from '../../../renderer/store/modules/empty-tequilapi-client-mock'
import { MockStatusNotifier } from '../../../../helpers/mysterium-client/monitoring-mock'
import { nextTick } from '../../../../helpers/utils'
import Monitoring from '../../../../../src/libraries/mysterium-client/monitoring/monitoring'

class TequilapiClientMock extends EmptyTequilapiClientMock {
  stopped: boolean = false

  async stop (): Promise<void> {
    this.stopped = true
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
      monitoring
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
    it('kills process, waits for healthcheck down and starts it', async () => {
      const upgradePromise = process.upgrade()

      expect(tequilApi.stopped).to.be.true

      expect(processStarted).to.be.false
      notifierMock.notifyStatus(false)
      await nextTick()
      notifierMock.notifyStatus(true)

      await upgradePromise
      expect(processStarted).to.be.true
    })
  })
})
