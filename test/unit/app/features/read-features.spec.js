/*
 * Copyright (C) 2018 The "MysteriumNetwork/mysterion" Authors.
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

import { after, before, describe, expect, it } from '../../../helpers/dependencies'
import readFeatures from '../../../../src/app/features/read-features'
import { writeFileSync, unlinkSync } from 'fs'

describe('.readFeatures', () => {
  const filename = 'filename'

  after(() => {
    unlinkSync(filename)
  })

  describe('with JSON file', () => {
    before(() => {
      writeFileSync(filename, '{"test": true}')
    })

    it('returns parsed object', () => {
      expect(readFeatures(filename)).to.eql({ test: true })
    })
  })

  describe('with custom file', () => {
    before(() => {
      writeFileSync(filename, 'some text')
    })

    it('throws error when json is invalid', () => {
      expect(() => readFeatures(filename)).to.throw
    })
  })

  it('throws error when file does not exist', () => {
    expect(() => readFeatures('does-not-exist')).to.throw
  })
})
