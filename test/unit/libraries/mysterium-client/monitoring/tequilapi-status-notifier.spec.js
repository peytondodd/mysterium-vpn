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

import { after, before, beforeEach, describe, expect, it } from '../../../../helpers/dependencies'
import { TequilapiStatusNotifier }
  from '../../../../../src/libraries/mysterium-client/monitoring/tequilapi-status-notifier'
import { nextTick } from '../../../../helpers/utils'
import TequilapiMock from './tequilapi-mock'
import lolex from 'lolex'

describe('TequilapiStatusNotifier', () => {
  let notifier: TequilapiStatusNotifier
  let tequilapiClient: TequilapiMock
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
    notifier = new TequilapiStatusNotifier(tequilapiClient)
  })

  describe('.start', () => {
    it('makes healthCheck call', () => {
      expect(tequilapiClient.healthCheckIsCalled).to.be.false
      notifier.start()
      expect(tequilapiClient.healthCheckIsCalled).to.be.true
    })

    it('calls healthCheck each 1.5 seconds', async () => {
      notifier.start()
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
      notifier.start()
      notifier.stop()
      expect(tequilapiClient.healthCheckCallCount).to.eql(1)
      await tickWithDelay(10000)
      expect(tequilapiClient.healthCheckCallCount).to.eql(1)
    })
  })

  describe('.onStatus', () => {
    it('notifies when status changes', async () => {
      let lastStatus: ?boolean = null
      notifier.onStatus(isRunning => {
        lastStatus = isRunning
      })
      notifier.start()
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
