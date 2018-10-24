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

import { beforeEach, describe, expect, it, before, after } from '../../../../helpers/dependencies'
import { waitForStatusUp } from '../../../../../src/libraries/mysterium-client/monitoring/utils'
import TequilapiMock from './tequilapi-mock'
import { captureAsyncError, nextTick } from '../../../../helpers/utils'
import lolex from 'lolex'

describe('utils', () => {
  describe('.waitForStatusUp', () => {
    let clock: lolex
    let tequilapiClient: TequilapiMock

    before(() => {
      clock = lolex.install()
    })

    after(() => {
      clock.uninstall()
    })

    async function tickWithDelay (duration) {
      await nextTick()
      clock.tick(duration)
      await nextTick()
    }

    beforeEach(() => {
      tequilapiClient = new TequilapiMock()
    })

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
