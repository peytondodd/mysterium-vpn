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

import { beforeEach, describe, expect, it } from '../../../../helpers/dependencies'
import BugReporterMetricsStore from '../../../../../src/app/bug-reporting/metrics/bug-reporter-metrics-store'
import { EXTRA, METRICS, NOT_SET, TAGS } from '../../../../../src/app/bug-reporting/metrics/metrics'

describe('BugReporterMetricsStore', () => {
  let store: BugReporterMetricsStore

  beforeEach(() => {
    store = new BugReporterMetricsStore()
  })

  describe('.get/.set', () => {
    it('sets tag metric', () => {
      const metricKey = METRICS.IDENTITY_UNLOCKED
      const metricValue = true

      expect(store.get(metricKey)).to.be.undefined
      store.set(metricKey, metricValue)
      expect(store.get(metricKey)).to.eql(metricValue)
    })

    it('sets extra metric', () => {
      const metricKey = EXTRA.CONNECTION_IP
      const metricValue = { ip: '192.168.1.1' }

      expect(store.get(metricKey)).to.be.undefined
      store.set(metricKey, metricValue)
      expect(store.get(metricKey)).to.eql(metricValue)
    })
  })

  describe('.getMetrics', () => {
    it('returns value for non-used metrics', () => {
      const unsetMetric = TAGS.CLIENT_RUNNING
      const data = store.getMetrics()
      expect(data.tags[unsetMetric]).to.be.eql(NOT_SET)
    })

    it('returns value for used metrics', () => {
      const metricKey = TAGS.IDENTITY_UNLOCKED
      const metricValue = true
      store.set(metricKey, metricValue)
      const data = store.getMetrics()
      expect(data.tags[metricKey]).to.be.eql(store.get(metricKey))
    })

    it('gets all metrics', () => {
      const metricKey = TAGS.IDENTITY_UNLOCKED
      const metricValue = true
      store.set(metricKey, metricValue)

      const data = store.getMetrics()
      const tagKeys = Object.keys(data.tags)
      const extraKeys = Object.keys(data.extra)

      expect(tagKeys.length).to.eql(Object.values(TAGS).length)
      expect(extraKeys.length).to.eql(Object.values(EXTRA).length)

      for (let tagKey of Object.values(TAGS)) {
        expect(tagKeys).to.contain(tagKey)
        // $FlowFixMe
        expect(data.tags[tagKey]).to.deep.equal(store.get(tagKey) || NOT_SET)
      }
      for (let extraKey of Object.values(EXTRA)) {
        expect(extraKeys).to.contain(extraKey)
        // $FlowFixMe
        expect(data.extra[extraKey]).to.deep.equal(store.get(extraKey) || NOT_SET)
      }
    })
  })
})
