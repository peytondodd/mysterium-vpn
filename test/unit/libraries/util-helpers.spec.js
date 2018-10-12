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

import { describe, expect, it } from '../../helpers/dependencies'
import utilHelpers from '../../../src/libraries/util-helpers'
import { captureError } from '../../helpers/utils'

describe('utilHelpers', () => {
  describe('.parseSemanticVersion', () => {
    it('returns parsed numbers', () => {
      const version = utilHelpers.parseSemanticVersion('12.34.56')
      expect(version.major).to.eql(12)
    })

    it('throws error when version is invalid', () => {
      const err = captureError(() => utilHelpers.parseSemanticVersion('not a version'))
      if (!(err instanceof Error)) {
        throw new Error('Expected an error')
      }
      expect(err.message).to.eql('Invalid version string: "not a version"')
    })

    it('throws error when version includes some prefix', () => {
      const err = captureError(() => utilHelpers.parseSemanticVersion('^1.0.0'))
      expect(err).to.be.an.instanceof(Error)
    })

    it('throws error when version includes some postfix', () => {
      const err = captureError(() => utilHelpers.parseSemanticVersion('1.0.0.'))
      expect(err).to.be.an.instanceof(Error)
    })
  })

  describe('.isSemanticVersionValid', () => {
    it('returns true when semantic version is valid', () => {
      expect(utilHelpers.isSemanticVersionValid('1.2.3')).to.be.true
    })

    it('returns false when semantic version is not valid', () => {
      expect(utilHelpers.isSemanticVersionValid('asd')).to.be.false
      expect(utilHelpers.isSemanticVersionValid('X.X.X')).to.be.false
    })
  })
})
