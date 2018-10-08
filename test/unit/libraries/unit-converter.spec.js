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
  formatBytesReadable,
  formatBytesReadableOrDefault,
  formatTimeDisplay,
  formatTimeDisplayOrDefault
} from '../../../src/libraries/unit-converter'

describe('unit-converter', () => {
  describe('.formatBytesReadable', () => {
    it('returns object with value (fixed 2 decimals) and units ', () => {
      const val = 123
      const result = formatBytesReadable(val)
      expect(result.units).to.eql('Bytes')
      expect(result.amount).to.eql('123.00')
    })

    it('calculates one Byte correctly', () => {
      const val = 1
      const result = formatBytesReadable(val)
      expect(result.units).to.eql('Byte')
      expect(result.amount).to.eql('1.00')
    })

    it('calculates one KB correctly', () => {
      const val = 1024
      const result = formatBytesReadable(val)
      expect(result.units).to.eql('KB')
      expect(result.amount).to.eql('1.00')
    })

    it('calculates one MB correctly', () => {
      const val = 1024 * 1024
      const result = formatBytesReadable(val)
      expect(result.units).to.eql('MB')
      expect(result.amount).to.eql('1.00')
    })

    it('calculates one GB correctly', () => {
      const val = 1024 * 1024 * 1024
      const result = formatBytesReadable(val)
      expect(result.units).to.eql('GB')
      expect(result.amount).to.eql('1.00')
    })

    it('calculates one TB correctly', () => {
      const val = 1024 * 1024 * 1024 * 1024
      const result = formatBytesReadable(val)
      expect(result.units).to.eql('TB')
      expect(result.amount).to.eql('1.00')
    })

    it('returns 0', () => {
      expect(formatBytesReadable(0).amount).to.eql('0.00')
    })
    it('throws', () => {
      expect(() => formatBytesReadable()).to.throw('provide valid input for conversion')
      expect(() => formatBytesReadable('str')).to.throw('provide valid input for conversion')
    })
  })

  describe('.formatBytesReadableOrDefault', () => {
    it('returns readable value', () => {
      expect(formatBytesReadableOrDefault(10000)).to.eql({
        amount: '9.77',
        units: 'KB'
      })
    })

    it('returns default value when parsing fails', () => {
      expect(formatBytesReadableOrDefault('a')).to.eql({
        amount: '-',
        units: 'KB'
      })
    })
  })

  describe('.formatTimeDisplay', () => {
    it('converts time correnctly', () => {
      expect(formatTimeDisplay(60 * 60 + 60 + 1)).to.be.eql('01:01:01')
      expect(formatTimeDisplay(60 * 60 * 24 * 5)).to.be.eql('120:00:00')
    })
    it('throws invalid parameter types', () => {
      expect(() => formatTimeDisplay(null)).to.throw('invalid input')
      expect(() => formatTimeDisplay(undefined)).to.throw('invalid input')
      expect(() => formatTimeDisplay('some string')).to.throw('invalid input')
      expect(() => formatTimeDisplay(-10)).to.throw('invalid input')
    })
  })

  describe('.formatTimeDisplayOrDefault', () => {
    it('returns display value', () => {
      expect(formatTimeDisplayOrDefault(60 * 60 + 60 + 1)).to.be.eql('01:01:01')
    })

    it('returns default value when parsing fails', () => {
      expect(formatTimeDisplayOrDefault('a')).to.eql('--:--:--')
    })
  })
})
