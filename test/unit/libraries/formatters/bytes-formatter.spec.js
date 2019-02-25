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

import { BytesFormatter } from '../../../../src/libraries/formatters/bytes-formatter'

describe('BytesFormatter', () => {
  const formatter = new BytesFormatter()

  describe('.format', () => {
    it('returns object with value (fixed 2 decimals) and units ', () => {
      const val = 123
      const result = formatter.format(val)
      expect(result.units).to.eql('Bytes')
      expect(result.amount).to.eql('123.00')
    })

    it('calculates one Byte correctly', () => {
      const val = 1
      const result = formatter.format(val)
      expect(result.units).to.eql('Byte')
      expect(result.amount).to.eql('1.00')
    })

    it('calculates one KB correctly', () => {
      const val = 1024
      const result = formatter.format(val)
      expect(result.units).to.eql('KB')
      expect(result.amount).to.eql('1.00')
    })

    it('calculates one MB correctly', () => {
      const val = 1024 * 1024
      const result = formatter.format(val)
      expect(result.units).to.eql('MB')
      expect(result.amount).to.eql('1.00')
    })

    it('calculates one GB correctly', () => {
      const val = 1024 * 1024 * 1024
      const result = formatter.format(val)
      expect(result.units).to.eql('GB')
      expect(result.amount).to.eql('1.00')
    })

    it('calculates one TB correctly', () => {
      const val = 1024 * 1024 * 1024 * 1024
      const result = formatter.format(val)
      expect(result.units).to.eql('TB')
      expect(result.amount).to.eql('1.00')
    })

    it('returns 0', () => {
      expect(formatter.format(0).amount).to.eql('0.00')
    })
    it('throws', () => {
      expect(() => formatter.format()).to.throw('provide valid input for conversion')
      expect(() => formatter.format('str')).to.throw('provide valid input for conversion')
    })
  })

  describe('.formatOrDefault', () => {
    it('returns readable value', () => {
      expect(formatter.formatOrDefault(10000)).to.eql({
        amount: '9.77',
        units: 'KB'
      })
    })

    it('returns default value when parsing fails', () => {
      expect(formatter.formatOrDefault('a')).to.eql({
        amount: '-',
        units: 'KB'
      })
    })
  })
})
