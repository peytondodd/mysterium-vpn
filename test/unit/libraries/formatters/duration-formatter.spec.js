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

// @flow

import { describe, it, expect } from '../../../helpers/dependencies'
import { DurationFormatter } from '../../../../src/libraries/formatters/duration-formatter'

describe('DurationFormatter', () => {
  const formatter = new DurationFormatter()

  describe('.formatTimeDisplay', () => {
    it('converts time correnctly', () => {
      expect(formatter.formatTimeDisplay(60 * 60 + 60 + 1)).to.be.eql('01:01:01')
      expect(formatter.formatTimeDisplay(60 * 60 * 24 * 5)).to.be.eql('120:00:00')
    })
    it('throws invalid parameter types', () => {
      expect(() => formatter.formatTimeDisplay((null: any))).to.throw('invalid input')
      expect(() => formatter.formatTimeDisplay((undefined: any))).to.throw('invalid input')
      expect(() => formatter.formatTimeDisplay(('some string': any))).to.throw('invalid input')
      expect(() => formatter.formatTimeDisplay(-10)).to.throw('invalid input')
    })
  })

  describe('.formatTimeDisplayOrDefault', () => {
    it('returns display value', () => {
      expect(formatter.formatTimeDisplayOrDefault(60 * 60 + 60 + 1)).to.be.eql('01:01:01')
    })

    it('returns default value when parsing fails', () => {
      expect(formatter.formatTimeDisplayOrDefault(('a': any))).to.eql('--:--:--')
    })
  })
})
