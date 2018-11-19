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
import ConnectionIPDTO from 'mysterium-tequilapi/lib/dto/connection-ip'
import ConnectionStatusDTO from 'mysterium-tequilapi/lib/dto/connection-status'
import ConnectionStatisticsDTO from 'mysterium-tequilapi/lib/dto/connection-statistics'
import type { TequilapiClient } from 'mysterium-tequilapi/lib/client'
import IdentityDTO from 'mysterium-tequilapi/lib/dto/identity'
import ProposalsQuery from 'mysterium-tequilapi/lib/adapters/proposals-query'
import ProposalDTO from 'mysterium-tequilapi/lib/dto/proposal'
import ConsumerLocationDTO from 'mysterium-tequilapi/lib/dto/consumer-location'
import type { NodeHealthcheckDTO } from 'mysterium-tequilapi/lib/dto/node-healthcheck'
import NodeBuildInfoDTO from 'mysterium-tequilapi/lib/dto/node-build-info'
import IdentityRegistrationDTO from 'mysterium-tequilapi/lib/dto/identity-registration'

class EmptyTequilapiClientMock implements TequilapiClient {
  async healthCheck (_timeout: ?number): Promise<NodeHealthcheckDTO> {
    return {
      uptime: '',
      process: 0,
      version: '',
      buildInfo: new NodeBuildInfoDTO({})
    }
  }

  async stop (): Promise<void> {
  }

  async identitiesList (): Promise<Array<IdentityDTO>> {
    return []
  }

  async identityCreate (passphrase: string): Promise<IdentityDTO> {
    return new IdentityDTO({})
  }

  async identityUnlock (id: string, passphrase: string): Promise<void> {
  }

  async identityRegistration (id: string): Promise<IdentityRegistrationDTO> {
    return new IdentityRegistrationDTO({ registered: true })
  }

  async findProposals (query: ?ProposalsQuery): Promise<Array<ProposalDTO>> {
    return []
  }

  async connectionCreate (): Promise<ConnectionStatusDTO> {
    return new ConnectionStatusDTO({})
  }

  async connectionStatus (): Promise<ConnectionStatusDTO> {
    return new ConnectionStatusDTO({})
  }

  async connectionCancel (): Promise<void> {
  }

  async connectionIP (): Promise<ConnectionIPDTO> {
    return new ConnectionIPDTO({})
  }

  async connectionStatistics (): Promise<ConnectionStatisticsDTO> {
    return new ConnectionStatisticsDTO({})
  }

  async location (): Promise<ConsumerLocationDTO> {
    return new ConsumerLocationDTO({})
  }
}

export default EmptyTequilapiClientMock
