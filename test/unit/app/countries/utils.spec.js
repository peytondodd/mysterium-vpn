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

import {
  getCountryLabel,
  isCountryKnown,
  isCountryTrusted
} from '../../../../src/app/countries/utils'
import { QualityLevel } from 'mysterium-vpn-js'
import { describe, expect, it } from '../../../helpers/dependencies'
import type { Country } from '../../../../src/app/countries/country'

describe('countries utils', () => {
  describe('.getCountryLabel', () => {
    function createCountry (id, name): Country {
      return {
        id,
        code: null,
        name,
        isFavorite: false,
        quality: 0.1,
        qualityLevel: QualityLevel.MEDIUM
      }
    }

    const countries: Country[] = [
      createCountry('0x0987654321', 'Australia'),
      createCountry('0x0987654321', 'Congo, The Democratic Republic of the'),
      createCountry('0x1234567890', 'Lithuania')
    ]

    it('truncates provider IDs', () => {
      expect(getCountryLabel(countries[0])).to.be.eql('Australia (0x0987654..)')
      expect(getCountryLabel(countries[1])).to.be.eql('Congo, The Democratic Republic of the (0x0987654..)')
      expect(getCountryLabel(countries[2])).to.be.eql('Lithuania (0x1234567..)')
    })

    it('truncates country name when specified limit', () => {
      expect(getCountryLabel(countries[0], 10)).to.be.eql('Australia (0x0987654..)')
      expect(getCountryLabel(countries[1], 10)).to.be.eql('Congo, The.. (0x0987654..)')
      expect(getCountryLabel(countries[2], 10)).to.be.eql('Lithuania (0x1234567..)')
    })
  })

  describe('.isCountryKnown', () => {
    it('returns true only for known countries', () => {
      expect(isCountryKnown('it')).to.be.true
      expect(isCountryKnown('xx')).to.be.false
    })
  })

  describe('.isCountryTrusted', () => {
    function createCountry (qualityLevel): Country {
      return {
        id: '0x123',
        code: null,
        name: 'name',
        isFavorite: false,
        quality: 0.1,
        qualityLevel: qualityLevel
      }
    }

    it('returns true for high-quality and medium-quality proposals', () => {
      expect(isCountryTrusted(createCountry(QualityLevel.HIGH))).to.be.true
      expect(isCountryTrusted(createCountry(QualityLevel.MEDIUM))).to.be.true
    })

    it('returns false for low-quality and unknown-quality proposals', () => {
      expect(isCountryTrusted(createCountry(QualityLevel.LOW))).to.be.false
      expect(isCountryTrusted(createCountry(QualityLevel.UNKNOWN))).to.be.false
    })
  })
})
