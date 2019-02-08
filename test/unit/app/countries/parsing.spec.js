/*
 * Copyright (C) 2019 The "mysteriumnetwork/mysterium-vpn" Authors.
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

import { getSortedCountryListFromProposals } from '../../../../src/app/countries/parsing'

describe('countries parsing', () => {
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
})
