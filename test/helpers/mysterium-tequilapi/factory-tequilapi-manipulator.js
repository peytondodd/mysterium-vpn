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

import TequilapiError from 'mysterium-tequilapi/lib/tequilapi-error'
import EmptyTequilapiClientMock from '../../unit/renderer/store/modules/empty-tequilapi-client-mock'
import ConnectionStatusDTO from 'mysterium-tequilapi/lib/dto/connection-status'
import ConnectionIPDTO from 'mysterium-tequilapi/lib/dto/connection-ip'
import ConnectionStatisticsDTO from 'mysterium-tequilapi/lib/dto/connection-statistics'
import ConnectionStatusEnum from 'mysterium-tequilapi/lib/dto/connection-status-enum'
import IdentityRegistrationDTO from 'mysterium-tequilapi/lib/dto/identity-registration'

function factoryTequilapiManipulator () {
  let statusFail = false
  let statisticsFail = false
  let ipTimeout = false
  let ipFail = false
  let connectFail = false
  let connectFailClosedRequest = false
  let connectionCancelFail = false
  let identityRegistrationFail = false

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
      return new ConnectionStatusDTO({
        sessionId: 'mock session',
        status: ConnectionStatusEnum.CONNECTING
      })
    }

    async connectionStatus (): Promise<ConnectionStatusDTO> {
      if (statusFail) {
        throw errorMock
      }
      return new ConnectionStatusDTO({
        sessionId: 'mock session',
        status: ConnectionStatusEnum.NOT_CONNECTED
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
      return new ConnectionStatisticsDTO({
        duration: 1,
        bytesReceived: 0,
        bytesSent: 0
      })
    }

    async identityRegistration (identity: string): Promise<IdentityRegistrationDTO> {
      if (identityRegistrationFail) {
        throw errorMock
      }
      return new IdentityRegistrationDTO({
        registered: false,
        publicKey: { part1: 'part-1', part2: 'part-2' },
        signature: { r: 'r', s: 's', v: 'v' }
      })
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
    setIdentityRegistrationFail () {
      identityRegistrationFail = true
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
