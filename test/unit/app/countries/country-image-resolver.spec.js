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

import { beforeEach, describe, expect, it } from '../../../helpers/dependencies'
import BugReporterMock from '../../../helpers/bug-reporter-mock'
import CountryImageResolver from '../../../../src/app/countries/country-image-resolver'

describe('CountryImageResolver', () => {
  let bugReporterMock
  let resolver

  beforeEach(() => {
    bugReporterMock = new BugReporterMock()
    resolver = new CountryImageResolver(bugReporterMock)
  })

  describe('.getImagePath', () => {
    it('returns country icon and does not send message to bug reporter for known country code', async () => {
      expect(resolver.getImagePath('lt')).to.eql('static/flags/lt.svg')
      expect(bugReporterMock.infoMessages).to.have.lengthOf(0)
    })

    it('returns world icon and reports bug for unknown country code', async () => {
      expect(resolver.getImagePath('unknown')).to.eql('static/flags/world.svg')

      expect(bugReporterMock.infoMessages).to.have.lengthOf(1)
      expect(bugReporterMock.infoMessages[0].message).to.eql('Country not found, code: unknown')
    })

    it('does not report bug for the same country code twice', () => {
      expect(resolver.getImagePath('unknown')).to.eql('static/flags/world.svg')
      resolver.getImagePath('unknown')
      expect(bugReporterMock.infoMessages).to.have.lengthOf(1)
    })

    it('returns world icon and does not report empty country', async () => {
      expect(resolver.getImagePath(null)).to.eql('static/flags/world.svg')
      expect(bugReporterMock.infoMessages).to.have.lengthOf(0)
    })
  })
})
