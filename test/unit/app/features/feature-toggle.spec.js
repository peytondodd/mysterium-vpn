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

import FeatureToggle from '../../../../src/app/features/feature-toggle'
import { describe, expect, it } from '../../../helpers/dependencies'

describe('FeatureToggle', () => {
  describe('.paymentsAreEnabled', () => {
    it('returns true when payments are set to true', () => {
      const features = { payments: true }
      const featureToggle = new FeatureToggle(features)
      expect(featureToggle.paymentsAreEnabled()).to.be.true
    })

    it('returns false when payments are set to false', () => {
      const features = { payments: false }
      const featureToggle = new FeatureToggle(features)
      expect(featureToggle.paymentsAreEnabled()).to.be.false
    })

    it('defaults to false', () => {
      const featureToggle = new FeatureToggle()
      expect(featureToggle.paymentsAreEnabled()).to.be.false
    })
  })

  describe('.clientVersionCheckEnabled', () => {
    it('returns true when version check is set to true', () => {
      const features = { clientVersionCheck: true }
      const featureToggle = new FeatureToggle(features)
      expect(featureToggle.clientVersionCheckEnabled()).to.be.true
    })

    it('returns false when version check is set to false', () => {
      const features = { clientVersionCheck: false }
      const featureToggle = new FeatureToggle(features)
      expect(featureToggle.clientVersionCheckEnabled()).to.be.false
    })

    it('defaults to true', () => {
      const featureToggle = new FeatureToggle()
      expect(featureToggle.clientVersionCheckEnabled()).to.be.true
    })
  })
})
