/*
 * Copyright (C) 2018 The "MysteriumNetwork/mysterium-vpn" Authors.
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
import { describe, it, expect, beforeEach } from '../../../../helpers/dependencies'
import { startSyncing } from '../../../../../src/app/bug-reporting/metrics/syncing'
import FakeMapSyncCommunication from '../../../../helpers/fake_map_sync_communication'
import BugReporterMetricsStore from '../../../../../src/app/bug-reporting/metrics/bug-reporter-metrics-store'
import { METRICS } from '../../../../../src/app/bug-reporting/metrics/metrics'

describe('.startSyncing', () => {
  let metricsStore: BugReporterMetricsStore

  beforeEach(() => {
    metricsStore = new BugReporterMetricsStore()
  })

  it('receives metric via message bus', () => {
    const communication = new FakeMapSyncCommunication()
    startSyncing(metricsStore, communication)

    const metricKey = METRICS.CONNECTION_IP
    const newValue = { ip: '192.168.1.1' }
    communication.sendMapUpdate({
      metric: metricKey,
      value: newValue
    })

    const updatedValue = metricsStore.get(metricKey)
    expect(updatedValue).to.be.eql(newValue)
  })
})
