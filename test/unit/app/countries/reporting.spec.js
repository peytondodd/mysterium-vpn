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

import { describe, expect, it } from '../../../helpers/dependencies'
import TequilapiProposalFetcher from '../../../../src/app/data-fetchers/tequilapi-proposal-fetcher'
import EmptyTequilapiClientMock from '../../renderer/store/modules/empty-tequilapi-client-mock'
import type { ProposalDTO } from 'mysterium-tequilapi/lib/dto/proposal'
import { parseProposalDTO } from 'mysterium-tequilapi/lib/dto/proposal'
import { reportUnknownProposalCountries } from '../../../../src/app/countries/reporting'
import BugReporterMock from '../../../helpers/bug-reporter-mock'

class ProposalsTequilapiClientMock extends EmptyTequilapiClientMock {
  _mockProposals: ProposalDTO[]

  constructor (mockProposals: ProposalDTO[]) {
    super()
    this._mockProposals = mockProposals
  }

  async findProposals (query): Promise<ProposalDTO[]> {
    return this._mockProposals
  }
}

describe('.reportUnknownProposalCountries', () => {
  it('listens for new proposals and reports unknown countries', async () => {
    function countryProposal (country: ?string): ProposalDTO {
      return parseProposalDTO({
        id: 1,
        serviceType: 'openvpn',
        providerId: '0x1',
        serviceDefinition: { locationOriginate: { country: country } }
      })
    }

    const proposals = [countryProposal('lt'), countryProposal('unknown'), countryProposal(null)]
    const tequilapiClient = new ProposalsTequilapiClientMock(proposals)
    const proposalsFetcher = new TequilapiProposalFetcher(tequilapiClient)
    const bugReporter = new BugReporterMock()
    reportUnknownProposalCountries(proposalsFetcher, bugReporter)

    await proposalsFetcher.fetch()
    expect(bugReporter.infoMessages.length).to.eql(1)
    expect(bugReporter.infoMessages[0].message).to.eql('Country not found, code: unknown')
  })
})
