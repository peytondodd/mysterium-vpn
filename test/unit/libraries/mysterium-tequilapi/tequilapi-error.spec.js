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

import { describe, expect, it } from '../../../helpers/dependencies'
import TequilapiError from '../../../../src/libraries/mysterium-tequilapi/tequilapi-error'
import type { AxiosError } from '../../../../src/libraries/mysterium-tequilapi/client-error'

describe('TequilapiError', () => {
  const error = new Error('test error')
  const tequilapiError = new TequilapiError(error, 'test path')

  it('is instance of TequilapiError', () => {
    // seems like redundant spec, but it's valuable, because this doesn't work by default:
    // "babel-plugin-transform-builtin-extend" plugin was used to make this work
    expect(tequilapiError instanceof TequilapiError).to.be.true
  })

  describe('.name', () => {
    it('return TequilapiError', () => {
      expect(tequilapiError.name).to.eql('TequilapiError')
    })
  })

  describe('.message', () => {
    it('returns extended message', () => {
      expect(tequilapiError.message).to.eql('test error (path="test path")')
    })
  })

  describe('.code', () => {
    describe('with simple error', () => {
      it('returns null', () => {
        expect(tequilapiError.code).to.be.null
      })
    })

    describe('with error having code', () => {
      it('returns code of original error', () => {
        const error = new Error('test error')
        const errorObj: AxiosError = error
        errorObj.code = '500'

        const tequilapiError = new TequilapiError(error, 'test path')

        expect(tequilapiError.code).to.eql('500')
      })
    })
  })
})
