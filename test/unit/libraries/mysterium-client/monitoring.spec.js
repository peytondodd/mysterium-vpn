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

import { before, beforeEach, after, describe, expect, it } from '../../../helpers/dependencies'
import lolex from 'lolex'
import EmptyTequilapiClientMock from '../../renderer/store/modules/empty-tequilapi-client-mock'
import NodeBuildInfoDTO from 'mysterium-tequilapi/lib/dto/node-build-info'
import type { NodeHealthcheckDTO } from 'mysterium-tequilapi/lib/dto/node-healthcheck'
import TequilaMonitoring, { waitForStatusUp } from '../../../../src/libraries/mysterium-client/monitoring'
import { captureAsyncError, nextTick, RepeatableCallbackRecorder } from '../../../helpers/utils'

class TequilapiMock extends EmptyTequilapiClientMock {
  cancelIsCalled: boolean = false
  healthCheckThrowsError: boolean = false
  healthCheckCallCount: number = 0
  get healthCheckIsCalled () {
    return this.healthCheckCallCount > 0
  }

  async connectionCancel (): Promise<void> {
    this.cancelIsCalled = true
  }

  async healthCheck (_timeout: ?number): Promise<NodeHealthcheckDTO> {
    this.healthCheckCallCount++
    if (this.healthCheckThrowsError) {
      throw new Error('HEALTH_CHECK_TEST_ERROR')
    }
    return {
      uptime: '',
      process: 0,
      version: '',
      buildInfo: new NodeBuildInfoDTO({})
    }
  }
}

describe('Monitoring module', () => {
  let tequilapiClient: TequilapiMock
  let monitoring: TequilaMonitoring
  let clock: lolex

  async function tickWithDelay (duration) {
    await nextTick()
    clock.tick(duration)
    await nextTick()
  }

  before(() => {
    clock = lolex.install()
  })

  after(() => {
    clock.uninstall()
  })

  beforeEach(() => {
    tequilapiClient = new TequilapiMock()
    // $FlowFixMe
    monitoring = new TequilaMonitoring(tequilapiClient)
  })

  describe('TequilaMonitoring', () => {
    describe('.start', () => {
      it('makes healthCheck call', () => {
        expect(tequilapiClient.healthCheckIsCalled).to.be.false
        monitoring.start()
        expect(tequilapiClient.healthCheckIsCalled).to.be.true
      })

      it('calls healthCheck each 1.5 seconds', async () => {
        monitoring.start()
        await nextTick()
        expect(tequilapiClient.healthCheckCallCount).to.be.eql(1)

        await tickWithDelay(1500)
        expect(tequilapiClient.healthCheckCallCount).to.be.eql(2)

        await tickWithDelay(1500)
        expect(tequilapiClient.healthCheckCallCount).to.be.eql(3)
      })
    })

    describe('.stop', () => {
      it('stops healthcheck fetching', async () => {
        monitoring.start()
        monitoring.stop()
        expect(tequilapiClient.healthCheckCallCount).to.eql(1)
        await tickWithDelay(10000)
        expect(tequilapiClient.healthCheckCallCount).to.eql(1)
      })
    })

    describe('.onStatus', () => {
      it('notifies about status instantly if it was fetched before', async () => {
        let lastStatus: ?boolean = null
        monitoring.start()
        await nextTick()

        monitoring.onStatus(isRunning => {
          lastStatus = isRunning
        })
        expect(lastStatus).to.be.true
      })

      it('notifies when status changes', async () => {
        let lastStatus: ?boolean = null
        monitoring.onStatus(isRunning => {
          lastStatus = isRunning
        })
        monitoring.start()
        await nextTick()
        // by default tequilapi's mock healthCheck works without errors
        expect(lastStatus).to.be.true

        tequilapiClient.healthCheckThrowsError = true
        await tickWithDelay(2000)
        expect(lastStatus).to.be.false

        tequilapiClient.healthCheckThrowsError = false
        await tickWithDelay(2000)
        expect(lastStatus).to.be.true
      })
    })
  })

  describe('.onStatusChangeUp', () => {
    let recorder: RepeatableCallbackRecorder

    beforeEach(() => {
      recorder = new RepeatableCallbackRecorder()
    })

    it('invokes callback each time status is up', async () => {
      monitoring.onStatusUp(recorder.getCallback())

      monitoring.start()
      await nextTick()

      expect(recorder.invokesCount).to.eql(1)

      await tickWithDelay(4000)

      expect(recorder.invokesCount).to.eql(2)
    })

    it('invokes callback instantly if status is already up', async () => {
      monitoring.start()
      await nextTick()

      monitoring.onStatusUp(recorder.getCallback())

      expect(recorder.invokesCount).to.eql(1)
    })

    it('does not invoke callback instantly if status is down', async () => {
      tequilapiClient.healthCheckThrowsError = true
      monitoring.start()
      await nextTick()

      monitoring.onStatusUp(recorder.getCallback())

      expect(recorder.invokesCount).to.eql(0)
    })
  })

  describe('.onStatusChangeDown', () => {
    let recorder: RepeatableCallbackRecorder

    beforeEach(() => {
      recorder = new RepeatableCallbackRecorder()
    })

    it('invokes callback each time status is up', async () => {
      monitoring.onStatusDown(recorder.getCallback())
      tequilapiClient.healthCheckThrowsError = true

      monitoring.start()
      await nextTick()

      expect(recorder.invokesCount).to.eql(1)

      await tickWithDelay(4000)

      expect(recorder.invokesCount).to.eql(2)
    })

    it('invokes callback instantly if status is already down', async () => {
      tequilapiClient.healthCheckThrowsError = true
      monitoring.start()
      await nextTick()

      monitoring.onStatusDown(recorder.getCallback())

      expect(recorder.invokesCount).to.eql(1)
    })

    it('does not invoke callback instantly if status is unknown', async () => {
      monitoring.onStatusDown(recorder.getCallback())

      expect(recorder.invokesCount).to.eql(0)
    })
  })

  describe('.onStatusChangeUp', () => {
    let recorder: RepeatableCallbackRecorder

    beforeEach(() => {
      recorder = new RepeatableCallbackRecorder()
    })

    it('invokes callback after status becomes up', async () => {
      monitoring.onStatusChangeUp(recorder.getCallback())

      monitoring.start()
      await nextTick()

      expect(recorder.invokesCount).to.eql(1)
    })

    it('does not invoke callback again when status keeps being up', async () => {
      monitoring.onStatusChangeUp(recorder.getCallback())

      monitoring.start()
      await nextTick()

      await tickWithDelay(4000)

      expect(recorder.invokesCount).to.eql(1)
    })
  })

  describe('.onStatusChangeDown', () => {
    let recorder: RepeatableCallbackRecorder

    beforeEach(() => {
      recorder = new RepeatableCallbackRecorder()
    })

    it('invokes callback after status becomes down', async () => {
      monitoring.onStatusChangeDown(recorder.getCallback())

      monitoring.start()
      await nextTick()

      tequilapiClient.healthCheckThrowsError = true
      await tickWithDelay(4000)

      expect(recorder.invokesCount).to.eql(1)
    })

    it('does not invoke callback again when status keeps being down', async () => {
      monitoring.onStatusChangeUp(recorder.getCallback())

      monitoring.start()
      await nextTick()

      tequilapiClient.healthCheckThrowsError = true
      await tickWithDelay(4000)

      await tickWithDelay(4000)

      expect(recorder.invokesCount).to.eql(1)
    })
  })

  describe('.waitForStatusUpWithTimeout', () => {
    it('finishes after healthcheck passes', async () => {
      await waitForStatusUp(tequilapiClient, 6000)
      expect(tequilapiClient.healthCheckCallCount).to.be.eql(1)
      await tickWithDelay(99999)
      expect(tequilapiClient.healthCheckCallCount).to.be.eql(1)
    })

    it('fails after timeout', async () => {
      tequilapiClient.healthCheckThrowsError = true
      let errorCaught = null
      waitForStatusUp(tequilapiClient, 1000).catch((error) => {
        errorCaught = error
      })
      expect(errorCaught).to.be.null
      await tickWithDelay(999)
      expect(errorCaught).to.be.null
      await tickWithDelay(1)
      expect(errorCaught).to.be.an('error')

      if (errorCaught == null) {
        throw new Error('Error was not expected')
      }
      expect(errorCaught.message).to.be.eql('Timeout of 1000ms passed')
    })

    it('stops calling healthcheck after timeout', async () => {
      tequilapiClient.healthCheckThrowsError = true
      waitForStatusUp(tequilapiClient, 1000)
      await nextTick()
      expect(tequilapiClient.healthCheckCallCount).to.eql(1)
      await tickWithDelay(1000)
      expect(tequilapiClient.healthCheckCallCount).to.eql(1)
      await tickWithDelay(10000)
      expect(tequilapiClient.healthCheckCallCount).to.eql(1)
    })

    it('calls healthcheck multiple times', async () => {
      tequilapiClient.healthCheckThrowsError = true
      const waitPromise = waitForStatusUp(tequilapiClient, 15000)
      await nextTick()
      for (let i = 0; i < 10; i++) {
        expect(tequilapiClient.healthCheckCallCount).to.be.eql(i + 1)
        await tickWithDelay(1500)
      }
      await captureAsyncError(() => waitPromise)
      expect(tequilapiClient.healthCheckCallCount).to.be.eql(11)
    })
  })
})
