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

import { expect } from 'chai'
import ProposalDTO from 'mysterium-tequilapi/lib/dto/proposal'
import ServiceDefinitionDTO from 'mysterium-tequilapi/lib/dto/service-definition'

describe('TequilapiClient DTO', () => {
  describe('ProposalDTO', () => {
    it('sets properties with full structure', async () => {
      const proposal = new ProposalDTO({
        id: '1',
        providerId: '0x1',
        serviceType: 'openvpn',
        serviceDefinition: {}
      })

      expect(proposal.id).to.equal('1')
      expect(proposal.providerId).to.equal('0x1')
      expect(proposal.serviceType).to.equal('openvpn')
      expect(proposal.serviceDefinition).to.deep.equal(new ServiceDefinitionDTO({}))
    })
  })
})
