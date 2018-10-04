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
import UnknownProposalCountryReporter from '../../../../src/app/countries/unknown-country-reporter'
import { getCountryImagePath } from '../../../../src/app/countries/images'

describe('UnknownProposalCountryReporter', () => {
  let bugReporterMock
  let reporter

  beforeEach(() => {
    bugReporterMock = new BugReporterMock()

    reporter = new UnknownProposalCountryReporter(bugReporterMock)
  })

  describe('.reportCodeIfUnknown', () => {
    it('does not report known country code', async () => {
      reporter.reportCodeIfUnknown('lt')
      expect(bugReporterMock.infoMessages).to.have.lengthOf(0)
    })

    it('reports unknown country code', () => {
      reporter.reportCodeIfUnknown('unknown')
      expect(bugReporterMock.infoMessages).to.have.lengthOf(1)
      expect(bugReporterMock.infoMessages[0].message).to.eql('Country not found, code: unknown')
    })

    it('does not report the same country code twice', () => {
      reporter.reportCodeIfUnknown('unknown')
      reporter.reportCodeIfUnknown('unknown')
      expect(bugReporterMock.infoMessages).to.have.lengthOf(1)
    })

    it('does not report empty country code', async () => {
      reporter.reportCodeIfUnknown(null)
      expect(bugReporterMock.infoMessages).to.have.lengthOf(0)
    })
  })
})

describe('.getCountryImagePath', () => {
  it('returns country icon for known country code', () => {
    expect(getCountryImagePath('lt')).to.eql('static/flags/lt.svg')
  })

  it('returns world icon for unknown country code', () => {
    expect(getCountryImagePath('unknown')).to.eql('static/flags/world.svg')
  })

  it('returns world icon for empty country code', async () => {
    expect(getCountryImagePath(null)).to.eql('static/flags/world.svg')
  })
})
