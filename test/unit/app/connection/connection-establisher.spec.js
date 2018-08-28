/*
 * Copyright (C) 2018 The "MysteriumNetwork/mysterion" Authors.
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
import ConnectionStatusEnum from '../../../../src/libraries/mysterium-tequilapi/dto/connection-status-enum'
import ConnectionRequestDTO from '../../../../src/libraries/mysterium-tequilapi/dto/connection-request'
import TequilapiConnectionEstablisher from '../../../../src/app/connection/connection-establisher'
import MockEventSender from '../../../helpers/statistics/mock-event-sender'
import BugReporterMock from '../../../helpers/bug-reporter-mock'
import type { ConnectionActions } from '../../../../src/app/connection/connection-establisher'
import ConsumerLocationDTO from '../../../../src/libraries/mysterium-tequilapi/dto/consumer-location'
import type { ConnectionStore } from '../../../../src/renderer/store/modules/connection'
import type { ConnectionStatus } from '../../../../src/libraries/mysterium-tequilapi/dto/connection-status-enum'
import factoryTequilapiManipulator, { createMockHttpError } from '../../../helpers/mysterium-tequilapi/factory-tequilapi-manipulator'

class MockConnectionActions implements ConnectionActions {
  connectionStatus: ?ConnectionStatus = null
  statisticsReset: boolean = false
  lastConnectionProviderId: ?string = null
  errorHidden: boolean = false
  errorShown: ?Error = null
  errorMessageShown: ?string = null

  resetStatistics () {
    this.statisticsReset = true
  }

  setLastConnectionProvider (providerId: string) {
    this.lastConnectionProviderId = providerId
  }

  hideError () {
    this.errorHidden = true
  }

  showError (error: Error) {
    this.errorShown = error
  }

  showErrorMessage (message: string) {
    this.errorMessageShown = message
  }

  async setConnectionStatus (status: ConnectionStatus) {
    this.connectionStatus = status
  }

  async fetchConnectionStatus () {
  }

  async fetchConnectionIp () {
  }
}

describe('TequilapiConnectionEstablisher', () => {
  let fakeTequilapi = factoryTequilapiManipulator()
  let fakeEventSender: MockEventSender
  let bugReporterMock: BugReporterMock

  let connectionEstablisher: TequilapiConnectionEstablisher
  let mockActions: MockConnectionActions

  const state: ConnectionStore = {
    actionLoopers: {},
    location: new ConsumerLocationDTO({ original: {}, current: {} }),
    ip: null,
    lastConnectionProvider: null,
    statistics: {},
    status: 'Connected'
  }

  beforeEach(() => {
    fakeTequilapi = factoryTequilapiManipulator()
    fakeEventSender = new MockEventSender()
    bugReporterMock = new BugReporterMock()

    const fakeApi = fakeTequilapi.getFakeApi()
    connectionEstablisher = new TequilapiConnectionEstablisher(fakeApi, fakeEventSender, bugReporterMock)
    mockActions = new MockConnectionActions()
  })

  describe('.connect', () => {
    const request = new ConnectionRequestDTO('consumer', 'provider id')

    it('marks connecting status, resets statistics, hides error', async () => {
      await connectionEstablisher.connect(request, mockActions, state)

      expect(mockActions.connectionStatus).to.eql(ConnectionStatusEnum.CONNECTING)
      expect(mockActions.statisticsReset).to.be.true
      expect(mockActions.lastConnectionProviderId).to.eql('provider id')
      expect(mockActions.errorHidden).to.be.true
    })

    describe('when connection fails', () => {
      beforeEach(() => {
        fakeTequilapi.setConnectFail()
      })

      it('shows error', async () => {
        await connectionEstablisher.connect(request, mockActions, state)

        expect(mockActions.errorMessageShown).to.eql('Connection failed. Try another country')
      })

      it('sends error event', async () => {
        await connectionEstablisher.connect(request, mockActions, state)

        expect(fakeEventSender.events).to.have.lengthOf(1)
        const event = fakeEventSender.events[0]
        expect(event.eventName).to.eql('connect_failed')
        expect(event.context.error).to.eql('Error: Connection to node failed.')
      })

      it('captures unknown error', async () => {
        await connectionEstablisher.connect(request, mockActions, state)

        expect(bugReporterMock.infoExceptions).to.have.lengthOf(1)
      })

      it('does not capture http error', async () => {
        fakeTequilapi.setFakeError(createMockHttpError())

        await connectionEstablisher.connect(request, mockActions, state)

        expect(bugReporterMock.infoExceptions).to.be.empty
      })
    })

    describe('when connection was cancelled', () => {
      beforeEach(() => {
        fakeTequilapi.setConnectFailClosedRequest()
      })

      it('does not throw error and does not show error', async () => {
        await connectionEstablisher.connect(request, mockActions, state)
        expect(mockActions.errorMessageShown).to.be.null
        expect(mockActions.errorShown).to.be.null
      })
    })
  })

  describe('.disconnect', () => {
    it('marks disconnecting status', async () => {
      await connectionEstablisher.disconnect(mockActions, state)
      expect(mockActions.connectionStatus).to.eql(ConnectionStatusEnum.DISCONNECTING)
    })

    describe('when disconnecting fails', () => {
      beforeEach(() => {
        fakeTequilapi.setConnectCancelFail()
      })

      it('captures unknown error', async () => {
        await connectionEstablisher.disconnect(mockActions, state)

        expect(bugReporterMock.infoExceptions).to.have.lengthOf(1)
      })

      it('does not capture http error', async () => {
        fakeTequilapi.setFakeError(createMockHttpError())
        await connectionEstablisher.disconnect(mockActions, state)

        expect(bugReporterMock.infoExceptions).to.be.empty
      })
    })
  })
})
