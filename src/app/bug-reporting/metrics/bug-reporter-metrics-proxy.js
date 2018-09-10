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

import type { BugReporterMetrics } from './bug-reporter-metrics'
import type { MapSyncCommunication } from '../../../libraries/map-sync'
import type { Metric, RavenData } from './metrics'
import type { SyncRendererCommunication } from '../../communication/sync/sync-communication'
import { getCurrentTimeISOFormat } from '../../../libraries/strings'

/**
 * Collects metrics, proxying all requests to communication.
 */
class BugReporterMetricsProxy implements BugReporterMetrics {
  _communication: MapSyncCommunication<Metric>
  _syncCommunication: SyncRendererCommunication

  constructor (communication: MapSyncCommunication<Metric>, syncCommunication: SyncRendererCommunication) {
    this._communication = communication
    this._syncCommunication = syncCommunication
  }

  set (metric: Metric, value: mixed) {
    // TODO: use only sync communication
    this._communication.sendMapUpdate({ metric, value })
  }

  setWithCurrentDateTime (metric: Metric) {
    this.set(metric, getCurrentTimeISOFormat())
  }

  getMetrics (): RavenData {
    return this._syncCommunication.getMetrics()
  }
}

export { BugReporterMetricsProxy }
