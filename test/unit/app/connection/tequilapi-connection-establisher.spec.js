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
import { ConnectionStatus } from 'mysterium-tequilapi/lib/dto/connection-status'
import MockEventSender from '../../../helpers/statistics/mock-event-sender'
import BugReporterMock from '../../../helpers/bug-reporter-mock'
import type { ConsumerLocationDTO } from 'mysterium-tequilapi/lib/dto/consumer-location'
import factoryTequilapiManipulator from '../../../helpers/mysterium-tequilapi/factory-tequilapi-manipulator'
import TequilapiConnectionEstablisher from '../../../../src/app/connection/tequilapi-connection-establisher'
import type { ErrorMessage } from '../../../../src/app/connection/error-message'
import { FunctionLooper } from '../../../../src/libraries/function-looper'
import type { ConnectionStatsFetcher } from '../../../../src/app/connection/connection-stats-fetcher'
import type { ConnectionState } from '../../../../src/app/connection/connection-state'
import type { Provider } from '../../../../src/app/connection/provider'
import messages from '../../../../src/app/messages'

class MockConnectionState implements ConnectionState {
  connectionStatus: ?ConnectionStatus = null
  statisticsReset: boolean = false
  lastConnectionProvider: Provider

  setLastConnectionProvider (provider: Provider) {
    this.lastConnectionProvider = provider
  }

  async setConnectionStatus (status: ConnectionStatus) {
    this.connectionStatus = status
  }

  resetStatistics () {
    this.statisticsReset = true
  }
}

class MockConnectionStatsFetcher implements ConnectionStatsFetcher {
  async fetchConnectionStatus () {
  }

  async fetchConnectionIp () {
  }
}

class MockErrorMessage implements ErrorMessage {
  hidden: boolean = false
  messageShown: ?string = null

  hide (): void {
    this.hidden = true
  }

  show (message: string): void {
    this.hidden = false
    this.messageShown = message
  }
}

describe('TequilapiConnectionEstablisher', () => {
  let fakeTequilapi = factoryTequilapiManipulator()
  let fakeEventSender: MockEventSender
  let bugReporterMock: BugReporterMock

  let connectionEstablisher: TequilapiConnectionEstablisher
  let mockConnectionState: MockConnectionState
  let mockErrorMessage: MockErrorMessage

  const location: ConsumerLocationDTO = {
    originalCountry: 'lt'
  }
  const actionLooper: ?FunctionLooper = null

  beforeEach(() => {
    fakeTequilapi = factoryTequilapiManipulator()
    fakeEventSender = new MockEventSender()
    bugReporterMock = new BugReporterMock()

    const fakeApi = fakeTequilapi.getFakeApi()
    connectionEstablisher =
      new TequilapiConnectionEstablisher(fakeApi, fakeEventSender, bugReporterMock)
    mockConnectionState = new MockConnectionState()
    mockErrorMessage = new MockErrorMessage()
  })

  describe('.connect', () => {
    const consumerId = 'consumer'
    const provider: Provider = { id: 'provider id', country: 'us' }

    it('marks connecting status', async () => {
      await connectionEstablisher
        .connect(consumerId, provider, mockConnectionState, mockErrorMessage, location, actionLooper)

      expect(mockConnectionState.connectionStatus).to.eql(ConnectionStatus.CONNECTING)
    })

    it('resets statistics', async () => {
      await connectionEstablisher
        .connect(consumerId, provider, mockConnectionState, mockErrorMessage, location, actionLooper)
      expect(mockConnectionState.statisticsReset).to.be.true
    })

    it('hides error', async () => {
      await connectionEstablisher
        .connect(consumerId, provider, mockConnectionState, mockErrorMessage, location, actionLooper)
      expect(mockErrorMessage.hidden).to.be.true
    })

    it('persists provider id', async () => {
      await connectionEstablisher
        .connect(consumerId, provider, mockConnectionState, mockErrorMessage, location, actionLooper)
      expect(mockConnectionState.lastConnectionProvider).to.eql({ id: 'provider id', country: 'us' })
    })

    it('sends successful connection event', async () => {
      await connectionEstablisher
        .connect(consumerId, provider, mockConnectionState, mockErrorMessage, location, actionLooper)

      expect(fakeEventSender.events).to.have.lengthOf(1)
      const event = fakeEventSender.events[0]
      expect(event.eventName).to.eql('connect_successful')
      expect(event.context.originalCountry).to.eql('lt')
      expect(event.context.providerCountry).to.eql('us')
    })

    describe('when connection fails', () => {
      beforeEach(() => {
        fakeTequilapi.setConnectFail()
      })

      it('shows error', async () => {
        await connectionEstablisher
          .connect(consumerId, provider, mockConnectionState, mockErrorMessage, location, actionLooper)
        expect(mockErrorMessage.messageShown).to.eql('Connection failed. Try another country')
      })

      it('sends error event', async () => {
        await connectionEstablisher
          .connect(consumerId, provider, mockConnectionState, mockErrorMessage, location, actionLooper)

        expect(fakeEventSender.events).to.have.lengthOf(1)
        const event = fakeEventSender.events[0]
        expect(event.eventName).to.eql('connect_failed')
        expect(event.context.error).to.eql('Error: Connection to node failed.')
      })

      it('captures error', async () => {
        await connectionEstablisher
          .connect(consumerId, provider, mockConnectionState, mockErrorMessage, location, actionLooper)
        expect(bugReporterMock.infoExceptions).to.have.lengthOf(1)
      })
    })

    describe('when connection was cancelled', () => {
      beforeEach(() => {
        fakeTequilapi.setConnectFailClosedRequest()
      })

      it('does not throw error and does not show error', async () => {
        await connectionEstablisher
          .connect(consumerId, provider, mockConnectionState, mockErrorMessage, location, actionLooper)
        expect(mockErrorMessage.messageShown).to.be.null
      })
    })
  })

  describe('.disconnect', () => {
    let mockConnectionStatsFetcher: MockConnectionStatsFetcher

    beforeEach(() => {
      mockConnectionStatsFetcher = new MockConnectionStatsFetcher()
    })

    it('marks disconnecting status', async () => {
      await connectionEstablisher
        .disconnect(mockConnectionState, mockConnectionStatsFetcher, mockErrorMessage, actionLooper)
      expect(mockConnectionState.connectionStatus).to.eql(ConnectionStatus.DISCONNECTING)
    })

    describe('when disconnecting fails', () => {
      beforeEach(() => {
        fakeTequilapi.setConnectCancelFail()
      })

      it('captures error', async () => {
        await connectionEstablisher
          .disconnect(mockConnectionState, mockConnectionStatsFetcher, mockErrorMessage, actionLooper)

        expect(bugReporterMock.infoExceptions).to.have.lengthOf(1)
      })

      it('shows error', async () => {
        await connectionEstablisher
          .disconnect(mockConnectionState, mockConnectionStatsFetcher, mockErrorMessage, actionLooper)
        expect(mockErrorMessage.messageShown).to.eql(messages.disconnectFailed)
      })
    })
  })
})
