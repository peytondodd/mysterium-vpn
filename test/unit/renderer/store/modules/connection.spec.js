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
import { expect } from 'chai'

import type from '@/store/types'
import { mutations, actionsFactory } from '@/store/modules/connection'
import { describe, it, beforeEach } from '../../../../helpers/dependencies'
import { FunctionLooper } from '@/../libraries/function-looper'
import ConnectionStatusEnum from '../../../../../src/libraries/mysterium-tequilapi/dto/connection-status-enum'
import communication from '@/../app/communication/messages'
import RendererCommunication from '@/../app/communication/renderer-communication'
import FakeMessageBus from '../../../../helpers/fake-message-bus'
import { ActionLooper, ActionLooperConfig } from '../../../../../src/renderer/store/modules/connection'
import type { ConnectionStore } from '../../../../../src/renderer/store/modules/connection'
import ConnectionStatisticsDTO from '../../../../../src/libraries/mysterium-tequilapi/dto/connection-statistics'
import BugReporterMock from '../../../../helpers/bug-reporter-mock'
import factoryTequilapiManipulator from '../../../../helpers/mysterium-tequilapi/factory-tequilapi-manipulator'
import type { ConnectionEstablisher } from '../../../../../src/app/connection/connection-establisher'
import type { ErrorMessage } from '../../../../../src/app/connection/error-message'
import ConsumerLocationDTO from '../../../../../src/libraries/mysterium-tequilapi/dto/consumer-location'
import type { ConnectionState } from '../../../../../src/app/connection/connection-state'
import type { ConnectionStatsFetcher } from '../../../../../src/app/connection/connection-stats-fetcher'
import type { Provider } from '../../../../../src/app/connection/provider'
import { captureAsyncError } from '../../../../helpers/utils'

type ConnectParams = {
  consumerId: string,
  provider: Provider,
  connectionState: ConnectionState,
  errorMessage: ErrorMessage,
  location: ?ConsumerLocationDTO,
  actionLooper: ?FunctionLooper
}

type DisconnectParams = {
  connectionState: ConnectionState,
  connectionStatsFetcher: ConnectionStatsFetcher,
  errorMessage: ErrorMessage,
  actionLooper: ?FunctionLooper
}

class MockConnectionEstablisher implements ConnectionEstablisher {
  connectParams: ?ConnectParams = null
  disconnectParams: ?DisconnectParams = null

  async connect (
    consumerId: string,
    provider: Provider,
    connectionState: ConnectionState,
    errorMessage: ErrorMessage,
    location: ?ConsumerLocationDTO,
    actionLooper: ?FunctionLooper): Promise<void> {
    this.connectParams = { consumerId, provider, connectionState, errorMessage, location, actionLooper }
  }

  async disconnect (
    connectionState: ConnectionState,
    connectionStatsFetcher: ConnectionStatsFetcher,
    errorMessage: ErrorMessage,
    actionLooper: ?FunctionLooper): Promise<void> {
    this.disconnectParams = { connectionState, connectionStatsFetcher, errorMessage, actionLooper }
  }
}

describe('connection', () => {
  describe('mutations', () => {
    describe('SET_LAST_CONNECTION_PROVIDER', () => {
      const setLastConnectionProvider = mutations[type.SET_LAST_CONNECTION_PROVIDER]

      it('updates provider', () => {
        const state: ConnectionStore = {
          status: 'Connected',
          statistics: {},
          actionLoopers: {}
        }
        const provider: Provider = {
          id: 'id',
          country: 'country'
        }
        setLastConnectionProvider(state, provider)
        expect(state).to.eql({ lastConnectionProvider: provider })
      })
    })

    describe('SET_CONNECTION_STATUS', () => {
      const connectionStatus = mutations[type.SET_CONNECTION_STATUS]

      it('updates remote status', () => {
        const state = {}
        connectionStatus(state, 'TESTING')
        expect(state).to.eql({ status: 'TESTING' })
      })
    })

    describe('CONNECTION_STATISTICS', () => {
      const connectionStatistics = mutations[type.CONNECTION_STATISTICS]

      it('updates statistics', () => {
        const state = {}
        const stats = new ConnectionStatisticsDTO({ duration: 13320 })

        connectionStatistics(state, stats)
        expect(state).to.eql({ statistics: stats })
      })
    })

    describe('CONNECTION_IP', () => {
      const connectionIp = mutations[type.CONNECTION_IP]

      it('updates ip', () => {
        const state = { ip: 'old' }
        connectionIp(state, 'new')
        expect(state).to.eql({ ip: 'new' })
      })
    })

    describe('CONNECTION_STATISTICS_RESET', () => {
      it('resets statistics', () => {
        let state = {}
        mutations[type.CONNECTION_STATISTICS_RESET](state)
        expect(state.statistics).to.eql({})
      })
    })

    describe('SET_ACTION_LOOPER', () => {
      it('sets action loopers', () => {
        const state = {
          actionLoopers: {}
        }
        const actionLooper1 = new ActionLooper(type.CONNECTION_IP, new FunctionLooper(async () => {}, 1000))
        mutations[type.SET_ACTION_LOOPER](state, actionLooper1)
        expect(state.actionLoopers).to.eql({
          [actionLooper1.action]: actionLooper1.looper
        })

        const actionLooper2 = new ActionLooper(type.FETCH_CONNECTION_STATUS, new FunctionLooper(async () => {}, 1000))
        mutations[type.SET_ACTION_LOOPER](state, actionLooper2)
        expect(state.actionLoopers).to.eql({
          [actionLooper1.action]: actionLooper1.looper,
          [actionLooper2.action]: actionLooper2.looper
        })
      })
    })

    describe('REMOVE_ACTION_LOOPER', () => {
      it('removes single action looper', () => {
        const noop = async () => {}
        const ipLooper = new FunctionLooper(noop, 1000)
        const statusLooper = new FunctionLooper(noop, 1000)
        const state = {
          actionLoopers: {
            [type.CONNECTION_IP]: ipLooper,
            [type.FETCH_CONNECTION_STATUS]: statusLooper
          }
        }
        mutations[type.REMOVE_ACTION_LOOPER](state, type.CONNECTION_IP)
        expect(state.actionLoopers).to.eql({
          [type.FETCH_CONNECTION_STATUS]: statusLooper
        })
      })
    })
  })

  describe('actions', () => {
    let fakeTequilapi = factoryTequilapiManipulator()
    let fakeMessageBus = new FakeMessageBus()
    let rendererCommunication = new RendererCommunication(fakeMessageBus)

    let bugReporterMock: BugReporterMock
    let mockConnectionEstablisher: MockConnectionEstablisher

    async function executeAction (action, state = {}, payload = {}, getters = {}) {
      const mutations = []
      const commit = (key, value) => {
        mutations.push({ key, value })
      }

      const dispatch = (action, payload = {}) => {
        const context = { commit, dispatch, state, getters }
        const actions =
          actionsFactory(fakeTequilapi.getFakeApi(), rendererCommunication, bugReporterMock, mockConnectionEstablisher)

        return actions[action](context, payload)
      }

      await dispatch(action, payload)
      return mutations
    }

    beforeEach(() => {
      fakeTequilapi = factoryTequilapiManipulator()
      fakeMessageBus = new FakeMessageBus()
      rendererCommunication = new RendererCommunication(fakeMessageBus)

      bugReporterMock = new BugReporterMock()
      mockConnectionEstablisher = new MockConnectionEstablisher()
    })

    describe('START_ACTION_LOOPING', () => {
      it('sets update looper and performs first looper cycle', async () => {
        const state = {
          actionLoopers: {}
        }
        const committed = await executeAction(
          type.START_ACTION_LOOPING,
          state,
          new ActionLooperConfig(type.CONNECTION_STATISTICS, 1000)
        )

        expect(committed).to.have.lengthOf(2)

        expect(committed[0].key).to.eql(type.SET_ACTION_LOOPER)
        const { action, looper } = committed[0].value
        expect(action).to.eql(type.CONNECTION_STATISTICS)
        expect(looper).to.be.an.instanceof(FunctionLooper)
        expect(looper.isRunning()).to.eql(true)

        expect(committed[1]).to.eql({
          key: type.CONNECTION_STATISTICS,
          value: new ConnectionStatisticsDTO({ duration: 1 })
        })
      })

      it('does not start second looper if it already exists', async () => {
        const noop = async () => {}
        const looper = new FunctionLooper(noop, 1000)
        const state = {
          actionLoopers: {
            [type.CONNECTION_STATISTICS]: looper
          }
        }
        const committed = await executeAction(
          type.START_ACTION_LOOPING,
          state,
          new ActionLooperConfig(type.CONNECTION_STATISTICS, 1000)
        )

        expect(committed).to.eql([])
      })
    })

    describe('STOP_ACTION_LOOPING', () => {
      it('stops and cleans update looper', async () => {
        const actionLooper = new FunctionLooper(async () => {}, 0)
        actionLooper.start()
        const state = {
          actionLoopers: {
            [type.CONNECTION_IP]: actionLooper
          }
        }

        expect(actionLooper.isRunning()).to.eql(true)
        const committed = await executeAction(type.STOP_ACTION_LOOPING, state, type.CONNECTION_IP)
        expect(committed).to.eql([{
          key: type.REMOVE_ACTION_LOOPER,
          value: type.CONNECTION_IP
        }])
        expect(actionLooper.isRunning()).to.eql(false)
      })

      it('does not throw error with no update looper', async () => {
        const state = {
          actionLoopers: {}
        }
        await executeAction(type.STOP_ACTION_LOOPING, state, type.CONNECTION_IP)
      })
    })

    describe('CONNECTION_IP', () => {
      it('commits new ip counter', async () => {
        const committed = await executeAction(type.CONNECTION_IP)
        expect(committed).to.eql([
          {
            key: type.CONNECTION_IP,
            value: 'mock ip'
          }
        ])
      })

      it('ignores errors', async () => {
        fakeTequilapi.setIpTimeout()
        const committed = await executeAction(type.CONNECTION_IP)
        expect(committed).to.eql([])
      })

      it('captures unknown errors', async () => {
        fakeTequilapi.setIpFail()
        await executeAction(type.CONNECTION_IP)
        expect(bugReporterMock.errorExceptions).to.have.lengthOf(1)
      })

      it('does not capture http errors', async () => {
        fakeTequilapi.setIpTimeout()
        await executeAction(type.CONNECTION_IP)
        expect(bugReporterMock.errorExceptions).to.be.empty
      })
    })

    describe('FETCH_CONNECTION_STATUS', () => {
      it('commits new status', async () => {
        const committed = await executeAction(type.FETCH_CONNECTION_STATUS)
        expect(committed).to.eql([{
          key: type.SET_CONNECTION_STATUS,
          value: 'mock status'
        }])
      })

      it('commits error when api fails', async () => {
        fakeTequilapi.setStatusFail()
        const committed = await executeAction(type.FETCH_CONNECTION_STATUS)
        expect(committed).to.eql([{
          key: type.SHOW_ERROR,
          value: fakeTequilapi.getFakeError()
        }])
      })
    })

    describe('SET_CONNECTION_STATUS', () => {
      beforeEach(() => {
        fakeMessageBus.clean()
      })

      it('commits new status', async () => {
        const committed = await executeAction(type.SET_CONNECTION_STATUS, {}, ConnectionStatusEnum.CONNECTING)
        expect(committed).to.eql([{
          key: type.SET_CONNECTION_STATUS,
          value: ConnectionStatusEnum.CONNECTING
        }])
      })

      it('sends new status to IPC', async () => {
        const state = {
          status: ConnectionStatusEnum.NOT_CONNECTED
        }
        await executeAction(type.SET_CONNECTION_STATUS, state, ConnectionStatusEnum.CONNECTING)
        expect(fakeMessageBus.lastChannel).to.eql(communication.CONNECTION_STATUS_CHANGED)
        expect(fakeMessageBus.lastData).to.eql({
          oldStatus: ConnectionStatusEnum.NOT_CONNECTED,
          newStatus: ConnectionStatusEnum.CONNECTING
        })
      })

      it('does not send new status to IPC when status does not change', async () => {
        const state = {
          status: ConnectionStatusEnum.NOT_CONNECTED
        }
        await executeAction(type.SET_CONNECTION_STATUS, state, ConnectionStatusEnum.NOT_CONNECTED)
        expect(fakeMessageBus.lastChannel).to.eql(null)
      })

      it('starts looping statistics when changing state to connected, changes IP to Refreshing...', async () => {
        const state = {
          actionLoopers: {}
        }
        const committed = await executeAction(type.SET_CONNECTION_STATUS, state, ConnectionStatusEnum.CONNECTED)
        expect(committed).to.have.lengthOf(4)
        expect(committed[0]).to.eql({
          key: type.SET_CONNECTION_STATUS,
          value: ConnectionStatusEnum.CONNECTED
        })
        expect(committed[1].key).to.eql(type.CONNECTION_IP)
        expect(committed[1].value).to.eql('Refreshing...')
        expect(committed[2].key).to.eql(type.SET_ACTION_LOOPER)
        expect(committed[2].value.action).to.eql(type.CONNECTION_STATISTICS)
        const looper = committed[2].value.looper
        expect(looper).to.be.an.instanceof(FunctionLooper)
        expect(looper.isRunning()).to.eql(true)
        expect(committed[3]).to.eql({
          key: type.CONNECTION_STATISTICS,
          value: new ConnectionStatisticsDTO({ duration: 1 })
        })
      })

      it('sets ip status to Refreshing when state changes to Disconnected', async () => {
        const committed = await executeAction(type.SET_CONNECTION_STATUS, {}, ConnectionStatusEnum.NOT_CONNECTED)

        expect(committed).to.eql([
          {
            key: type.SET_CONNECTION_STATUS,
            value: ConnectionStatusEnum.NOT_CONNECTED
          },
          {
            key: type.CONNECTION_IP,
            value: 'Refreshing...'
          }
        ])
      })

      it('stops looping statistics when changing state from connected', async () => {
        const noop = async () => {}
        const looper = new FunctionLooper(noop, 1000)
        looper.start()
        const state = {
          status: ConnectionStatusEnum.CONNECTED,
          actionLoopers: {
            [type.CONNECTION_STATISTICS]: looper
          }
        }
        const committed = await executeAction(type.SET_CONNECTION_STATUS, state, ConnectionStatusEnum.DISCONNECTING)

        expect(committed).to.eql([
          {
            key: type.SET_CONNECTION_STATUS,
            value: ConnectionStatusEnum.DISCONNECTING
          },
          {
            key: type.REMOVE_ACTION_LOOPER,
            value: type.CONNECTION_STATISTICS
          }
        ])
        expect(looper.isRunning()).to.eql(false)
      })

      it('does nothing when changing state from connected to connected', async () => {
        const noop = async () => {}
        const looper = new FunctionLooper(noop, 1000)
        const state = {
          status: ConnectionStatusEnum.CONNECTED,
          actionLoopers: {
            [type.CONNECTION_STATISTICS]: looper
          }
        }

        const committed = await executeAction(type.SET_CONNECTION_STATUS, state, ConnectionStatusEnum.CONNECTED)
        expect(committed).to.eql([])
      })
    })

    describe('CONNECTION_STATISTICS', () => {
      it('commits new statistics', async () => {
        const committed = await executeAction(type.CONNECTION_STATISTICS)
        expect(committed).to.eql([{
          key: type.CONNECTION_STATISTICS,
          value: new ConnectionStatisticsDTO({ duration: 1 })
        }])
      })

      it('commits error when api fails', async () => {
        fakeTequilapi.setStatisticsFail()
        const committed = await executeAction(type.CONNECTION_STATISTICS)
        expect(committed).to.eql([{
          key: type.SHOW_ERROR,
          value: fakeTequilapi.getFakeError()
        }])
      })
    })

    describe('RECONNECT', () => {
      it('invokes connection establisher with last connection provider', async () => {
        const state = {
          actionLoopers: {
            [type.FETCH_CONNECTION_STATUS]: new FunctionLooper(async () => {}, 1000)
          },
          location: { originalCountry: '' }
        }
        const getters = {
          currentIdentity: 'current',
          lastConnectionAttemptProvider: {
            id: 'lastConnectionProvider',
            country: 'us'
          }
        }
        await executeAction(type.RECONNECT, state, null, getters)

        const params = mockConnectionEstablisher.connectParams
        expect(params).to.exist
        if (params == null) {
          throw new Error('Connection params missing')
        }
        expect(params.provider.id).to.eql('lastConnectionProvider')
        expect(params.provider.country).to.eql('us')
        expect(params.consumerId).to.eql('current')
        expect(params.location).to.eql(state.location)
        expect(params.actionLooper).to.eql(state.actionLoopers[type.FETCH_CONNECTION_STATUS])
        expect(params.connectionState).to.exist
      })

      it('fails when last connection provider is not present', async () => {
        const state = {
          actionLoopers: {
            [type.FETCH_CONNECTION_STATUS]: new FunctionLooper(async () => {}, 1000)
          },
          location: { originalCountry: '' }
        }
        const getters = {
          currentIdentity: 'current',
          lastConnectionAttemptProvider: null
        }

        const error = await captureAsyncError(() => executeAction(type.RECONNECT, state, null, getters))
        expect(error).to.be.an('error')
        if (!(error instanceof Error)) {
          throw new Error('error is not Error instance')
        }
        expect(error.message).to.eql('Last provider not set')
      })
    })

    describe('CONNECT', () => {
      it('invokes connection establisher with given provider', async () => {
        const state = {
          actionLoopers: {},
          location: { originalCountry: '' }
        }
        const getters = {
          currentIdentity: 'consumer id'
        }
        const provider: Provider = { id: 'provider', country: 'provider country' }
        await executeAction(type.CONNECT, state, provider, getters)

        const params = mockConnectionEstablisher.connectParams
        expect(params).to.exist
        if (params == null) {
          throw new Error('Connection params missing')
        }
        expect(params.consumerId).to.eql('consumer id')
        expect(params.provider).to.eql(provider)
        expect(params.location).to.eql(state.location)
        expect(params.actionLooper).to.eql(state.actionLoopers[type.FETCH_CONNECTION_STATUS])
        expect(params.connectionState).to.exist
      })
    })

    describe('DISCONNECT', () => {
      const state = {
        actionLoopers: {}
      }

      it('invokes connection establisher to disconnect', async () => {
        await executeAction(type.DISCONNECT, state)

        const params = mockConnectionEstablisher.disconnectParams
        expect(params).to.exist
        if (params == null) {
          throw new Error('Connection params missing')
        }
        expect(params.actionLooper).to.eql(state.actionLoopers[type.FETCH_CONNECTION_STATUS])
        expect(params.connectionState).to.exist
        expect(params.connectionStatsFetcher).to.exist
      })
    })
  })
})
