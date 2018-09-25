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

import ConnectionStatusDTO from 'mysterium-tequilapi/lib/dto/connection-status'
import type { NodeHealthcheckDTO } from 'mysterium-tequilapi/lib/dto/node-healthcheck'
import ProposalDTO from 'mysterium-tequilapi/lib/dto/proposal'
import ProposalsQuery from 'mysterium-tequilapi/lib/adapters/proposals-query'
import { TIMEOUT_DISABLED } from 'mysterium-tequilapi/lib/timeouts'
import ConnectionRequestDTO from 'mysterium-tequilapi/lib/dto/connection-request'
import ConnectionStatisticsDTO from 'mysterium-tequilapi/lib/dto/connection-statistics'
import ConnectionIPDTO from 'mysterium-tequilapi/lib/dto/connection-ip'
import type { TequilapiClient } from 'mysterium-tequilapi/lib/client'
import IdentityDTO from 'mysterium-tequilapi/lib/dto/identity'
import ConsumerLocationDTO from 'mysterium-tequilapi/lib/dto/consumer-location'
import IdentityRegistrationDTO from 'mysterium-tequilapi/lib/dto/identity-registration'
import type { BugReporterMetrics } from './metrics/bug-reporter-metrics'
import { METRICS } from './metrics/metrics'

type ConnectionRecordDto = {
  id: string,
  provider: {
    identity: string,
    country: string
  },
  status: string,
  start: number,
  duration: number,
  bytesSent: number,
  bytesReceived: number
}

class TequilapiClientWithMetrics implements TequilapiClient {
  _bugReporterMetrics: BugReporterMetrics
  _client: TequilapiClient

  constructor (client: TequilapiClient, bugReporterMetrics: BugReporterMetrics) {
    this._client = client
    this._bugReporterMetrics = bugReporterMetrics
  }

  async stop (): Promise<void> {
    return this._client.stop()
  }

  async identitiesList (): Promise<Array<IdentityDTO>> {
    return this._client.identitiesList()
  }

  async identityCreate (passphrase: string): Promise<IdentityDTO> {
    return this._client.identityCreate(passphrase)
  }

  async healthCheck (timeout: ?number): Promise<NodeHealthcheckDTO> {
    const result = await this._client.healthCheck(timeout)
    this._bugReporterMetrics.setWithCurrentDateTime(METRICS.HEALTH_CHECK_TIME)
    return result
  }

  async identityUnlock (id: string, passphrase: string): Promise<void> {
    this._bugReporterMetrics.set(METRICS.IDENTITY_UNLOCKED, false)
    await this._client.identityUnlock(id, passphrase)
    this._bugReporterMetrics.set(METRICS.IDENTITY_UNLOCKED, true)
  }

  async identityRegistration (id: string): Promise<IdentityRegistrationDTO> {
    const result = await this._client.identityRegistration(id)
    this._bugReporterMetrics.set(METRICS.IDENTITY_REGISTERED, result.registered)
    return result
  }

  async findProposals (query: ?ProposalsQuery): Promise<Array<ProposalDTO>> {
    const result = await this._client.findProposals(query)
    if (!result || result.length === 0) {
      this._bugReporterMetrics.set(METRICS.PROPOSALS_FETCHED_ONCE, false)
    } else {
      this._bugReporterMetrics.set(METRICS.PROPOSALS_FETCHED_ONCE, true)
    }
    return result
  }

  async connectionCreate (
    request: ConnectionRequestDTO,
    timeout: ?number = TIMEOUT_DISABLED): Promise<ConnectionStatusDTO> {
    this._bugReporterMetrics.set(METRICS.CONNECTION_ACTIVE, false)
    const result = await this._client.connectionCreate(request, timeout)
    this._bugReporterMetrics.set(METRICS.CONNECTION_ACTIVE, true)
    return result
  }

  async connectionStatus (): Promise<ConnectionStatusDTO> {
    const result = await this._client.connectionStatus()
    this._bugReporterMetrics.set(METRICS.CONNECTION_STATUS, result)
    return result
  }

  async connectionCancel (): Promise<void> {
    await this._client.connectionCancel()
    this._bugReporterMetrics.set(METRICS.CONNECTION_ACTIVE, false)
  }

  async connectionIP (timeout: ?number): Promise<ConnectionIPDTO> {
    const result = await this._client.connectionIP(timeout)
    this._bugReporterMetrics.set(METRICS.CONNECTION_IP, result)
    return result
  }

  async connectionStatistics (): Promise<ConnectionStatisticsDTO> {
    const result = await this._client.connectionStatistics()
    this._bugReporterMetrics.set(METRICS.CONNECTION_STATISTICS, result)
    return result
  }

  async location (timeout: ?number): Promise<ConsumerLocationDTO> {
    return this._client.location(timeout)
  }

  async connectionHistoryList (): Promise<ConnectionRecordDto[]> {
    return [
      {
        id: '30f610a0-c096-11e8-b371-ebde26989839',
        provider: {
          identity: '0x3b03a513fba4bd4868edd340f77da0c920150f3e',
          country: 'lt'
        },
        status: 'Successful',
        start: 1537787035230,
        duration: 35 * 60,
        bytesSent: 1024,
        bytesReceived: 6000
      },
      {
        id: '76fca3dc-28d0-4f00-b06e-a7d6050699ae',
        provider: {
          identity: '0x1b03b513fba4bd4868edd340f77da0c920150f0a',
          country: 'us'
        },
        status: 'Unsuccessful',
        start: 1537787035230,
        duration: 35 * 60,
        bytesSent: 1024,
        bytesReceived: 6000
      },
      {
        id: 'ffbfb796-5483-4a1b-82c8-10d6b85d4d62',
        provider: {
          identity: '0x1b03b513fba4bd4868edd340f77da0c920150f0a',
          country: 'us'
        },
        start: 1537787035230,
        status: 'Cancelled',
        duration: 35 * 60,
        bytesSent: 1024,
        bytesReceived: 6000
      },
      {
        id: '27f49b3a-070b-4d2e-881b-5163b9ab0a74',
        provider: {
          identity: '0x1b03b513fba4bd4868edd340f77da0c920150f0a',
          country: 'us'
        },
        status: 'Successful',
        start: 1537787035230,
        duration: 35 * 60,
        bytesSent: 1024,
        bytesReceived: 6000
      },
      {
        id: '0b2d1dba-264f-4fb6-b1a3-63c5c40db848',
        provider: {
          identity: '0x1b03b513fba4bd4868edd340f77da0c920150f0a',
          country: 'us'
        },
        status: 'Successful',
        start: 1537787035230,
        duration: 35 * 60,
        bytesSent: 1024,
        bytesReceived: 6000
      },
      {
        id: '03b876cd-e262-4491-9ddf-ed98fedb9b99',
        provider: {
          identity: '0x1b03b513fba4bd4868edd340f77da0c920150f0a',
          country: 'us'
        },
        status: 'Successful',
        start: 1537787035230,
        duration: 35 * 60,
        bytesSent: 1024,
        bytesReceived: 6000
      },
      {
        id: '8593c811-3988-437b-809c-46e6124278c1',
        provider: {
          identity: '0x1b03b513fba4bd4868edd340f77da0c920150f0a',
          country: 'us'
        },
        status: 'Successful',
        start: 1537787035230,
        duration: 35 * 60,
        bytesSent: 1024,
        bytesReceived: 6000
      },
      {
        id: 'b97038dd-03c3-44e5-be33-479af4ebb91e',
        provider: {
          identity: '0x1b03b513fba4bd4868edd340f77da0c920150f0a',
          country: 'us'
        },
        status: 'Successful',
        start: 1537787035230,
        duration: 35 * 60,
        bytesSent: 1024,
        bytesReceived: 6000
      }
    ]
  }
}

export type { ConnectionRecordDto }
export default TequilapiClientWithMetrics
