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

import TequilapiError from '../../../src/libraries/mysterium-tequilapi/tequilapi-error'
import EmptyTequilapiClientMock from '../../unit/renderer/store/modules/empty-tequilapi-client-mock'
import ConnectionStatusDTO from '../../../src/libraries/mysterium-tequilapi/dto/connection-status'
import ConnectionIPDTO from '../../../src/libraries/mysterium-tequilapi/dto/connection-ip'
import ConnectionStatisticsDTO from '../../../src/libraries/mysterium-tequilapi/dto/connection-statistics'

function factoryTequilapiManipulator () {
  let statusFail = false
  let statisticsFail = false
  let ipTimeout = false
  let ipFail = false
  let connectFail = false
  let connectFailClosedRequest = false
  let connectionCancelFail = false

  let errorMock = new Error('Mock error')
  const timeoutErrorMock = createMockTimeoutError()
  const closedRequestErrorMock = createMockRequestClosedError()

  class ConnectionTequilapiClientMock extends EmptyTequilapiClientMock {
    async connectionCreate (): Promise<ConnectionStatusDTO> {
      if (connectFailClosedRequest) {
        throw closedRequestErrorMock
      }
      if (connectFail) {
        throw errorMock
      }
      return new ConnectionStatusDTO({})
    }

    async connectionStatus (): Promise<ConnectionStatusDTO> {
      if (statusFail) {
        throw errorMock
      }
      return new ConnectionStatusDTO({
        status: 'mock status'
      })
    }

    async connectionCancel (): Promise<void> {
      if (connectionCancelFail) {
        throw errorMock
      }
    }

    async connectionIP (): Promise<ConnectionIPDTO> {
      if (ipTimeout) {
        throw timeoutErrorMock
      }
      if (ipFail) {
        throw errorMock
      }
      return new ConnectionIPDTO({
        ip: 'mock ip'
      })
    }

    async connectionStatistics (): Promise<ConnectionStatisticsDTO> {
      if (statisticsFail) {
        throw errorMock
      }
      return new ConnectionStatisticsDTO({ duration: 1 })
    }
  }

  return {
    getFakeApi () {
      return new ConnectionTequilapiClientMock()
    },
    setStatusFail () {
      statusFail = true
    },
    setStatisticsFail () {
      statisticsFail = true
    },
    setIpTimeout () {
      ipTimeout = true
    },
    setIpFail () {
      ipFail = true
    },
    setConnectFail () {
      connectFail = true
    },
    setConnectFailClosedRequest () {
      connectFailClosedRequest = true
    },
    setConnectCancelFail () {
      connectionCancelFail = true
    },
    getFakeError (): Error {
      return errorMock
    },
    setFakeError (error: Error) {
      errorMock = error
    }
  }
}

function createMockTimeoutError (): Error {
  const error = new Error('Mock timeout error')
  const object = (error: Object)
  object.code = 'ECONNABORTED'
  return new TequilapiError(error, 'mock-path')
}

function createMockRequestClosedError (): Error {
  const error = new Error('Mock closed request error')
  const object = (error: Object)
  object.response = { status: 499 }

  return new TequilapiError(error, 'mock-path')
}

function createMockHttpError (): Error {
  const error = new Error('Mock http error')
  return new TequilapiError(error, 'mock-path')
}

export { createMockHttpError }

export default factoryTequilapiManipulator
