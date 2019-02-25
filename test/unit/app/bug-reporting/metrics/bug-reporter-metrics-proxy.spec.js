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
import { BugReporterMetricsProxy } from '../../../../../src/app/bug-reporting/metrics/bug-reporter-metrics-proxy'
import METRICS from '../../../../../src/renderer/store/types'
import FakeSyncRendererCommunication from '../../../../helpers/communication/fake-sync-renderer-communication'
import { TimeFormatter } from '../../../../../src/libraries/formatters/time-formatter'

describe('BugReporterMetricsProxy', () => {
  let proxy: BugReporterMetricsProxy
  let syncCommunication: FakeSyncRendererCommunication

  beforeEach(() => {
    syncCommunication = new FakeSyncRendererCommunication()
    const timeFormatter = new TimeFormatter(0)
    proxy = new BugReporterMetricsProxy(syncCommunication, timeFormatter)
  })

  describe('.set', () => {
    it('sends metric via communication', () => {
      const metricKey = METRICS.CONNECTION_IP
      const metricValue = { ip: '127.0.0.1' }
      proxy.set(metricKey, metricValue)

      expect(syncCommunication.sentMetric).to.eql({
        metric: metricKey,
        value: metricValue
      })
    })
  })

  describe('.getMetrics', () => {
    it('returns metrics from communication', () => {
      expect(proxy.getMetrics()).to.eql(syncCommunication.mockedMetrics)
    })
  })
})
