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

import {
  getCountryLabel,
  isProposalTrusted
} from '../../../../src/app/countries/utils'
import ProposalDTO from 'mysterium-tequilapi/lib/dto/proposal'
import { getSortedCountryListFromProposals } from '../../../../src/app/countries/parsing'

describe('countries utils', () => {
  describe('.getSortedCountryListFromProposals', () => {
    const proposals = [
      {
        providerId: '0x1234567890',
        serviceDefinition: {
          locationOriginate: {
            country: 'LT'
          }
        }
      },
      {
        providerId: '0x9876543210',
        serviceDefinition: {
          locationOriginate: {
            country: 'AU'
          }
        }
      },
      {
        providerId: '0x0987654321',
        serviceDefinition: {
          locationOriginate: {
            country: 'CD'
          }
        }
      }
    ]

    it('returns sorted list', () => {
      const list = getSortedCountryListFromProposals(proposals, new Set(['0x0987654321']))
      expect(list[0].id).to.be.eql('0x0987654321')
      expect(list[0].name).to.be.eql('Congo, The Democratic Republic of the')
      expect(list[0].code).to.be.eql('CD')

      expect(list[1].id).to.be.eql('0x9876543210')
      expect(list[1].name).to.be.eql('Australia')
      expect(list[1].code).to.be.eql('AU')

      expect(list[2].id).to.be.eql('0x1234567890')
      expect(list[2].name).to.be.eql('Lithuania')
      expect(list[2].code).to.be.eql('LT')
    })
  })

  describe('.getCountryLabel', () => {
    const proposals = [
      {
        providerId: '0x1234567890',
        serviceDefinition: {
          locationOriginate: {
            country: 'LT'
          }
        }
      },
      {
        providerId: '0x0987654321',
        serviceDefinition: {
          locationOriginate: {
            country: 'AU'
          }
        }
      },
      {
        providerId: '0x0987654321',
        serviceDefinition: {
          locationOriginate: {
            country: 'CD'
          }
        }
      }
    ]

    it('truncates provider IDs', () => {
      const list = getSortedCountryListFromProposals(proposals, new Set())
      expect(getCountryLabel(list[0])).to.be.eql('Australia (0x0987654..)')
      expect(getCountryLabel(list[1])).to.be.eql('Congo, The Democratic Republic of the (0x0987654..)')
      expect(getCountryLabel(list[2])).to.be.eql('Lithuania (0x1234567..)')

      expect(getCountryLabel(list[0], 10)).to.be.eql('Australia (0x0987654..)')
      expect(getCountryLabel(list[1], 10)).to.be.eql('Congo, The.. (0x0987654..)')
      expect(getCountryLabel(list[2], 10)).to.be.eql('Lithuania (0x1234567..)')
    })
  })

  describe('.isProposalTrusted', () => {
    function createProposal (connectCount) {
      return new ProposalDTO({
        id: 1,
        providerId: 'provider id',
        serviceType: 'service type',
        metrics: { connectCount }
      })
    }

    it('returns true when there are successful connections', () => {
      const proposal1 = createProposal({ success: 1, fail: 0, timeout: 1 })
      expect(isProposalTrusted(proposal1)).to.be.true

      const proposal2 = createProposal({ success: 1, fail: 100, timeout: 1 })
      expect(isProposalTrusted(proposal2)).to.be.true
    })

    it('returns true for new proposal', () => {
      const proposal = createProposal({ success: 0, fail: 0, timeout: 0 })
      expect(isProposalTrusted(proposal)).to.be.true
    })

    it('returns true when metrics are unavailable', () => {
      const proposal = new ProposalDTO({ id: 1, providerId: 'provider id', serviceType: 'service type' })
      expect(isProposalTrusted(proposal)).to.be.true
    })

    it('returns false for proposals with only failed connections', () => {
      const proposal = createProposal({ success: 0, fail: 1, timeout: 0 })
      expect(isProposalTrusted(proposal)).to.be.false
    })
  })
})
