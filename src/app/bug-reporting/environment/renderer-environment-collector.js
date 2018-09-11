/*
 * Copyright (C) 2017 The "mysteriumnetwork/mysterium-vpn" Authors.
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

import type { EnvironmentCollector } from './environment-collector'
import type { SyncRendererCommunication } from '../../communication/sync/sync-communication'
import type { SerializedLogCaches } from '../../logging/log-cache-bundle'
import type { BugReporterMetrics } from '../metrics/bug-reporter-metrics'

class RendererEnvironmentCollector implements EnvironmentCollector {
  _releaseId: string
  _syncRendererCommunication: SyncRendererCommunication
  _metrics: BugReporterMetrics

  constructor (releaseId: string, syncRendererCommunication: SyncRendererCommunication, metrics: BugReporterMetrics) {
    this._releaseId = releaseId
    this._syncRendererCommunication = syncRendererCommunication
    this._metrics = metrics
  }

  getReleaseId (): string {
    return this._releaseId
  }

  getSerializedCaches (): SerializedLogCaches {
    const defaultCache = { info: '', error: '' }
    const defaultCaches = { backend: defaultCache, mysterium_process: defaultCache, frontend: defaultCache }
    return this._syncRendererCommunication.getSerializedCaches() || defaultCaches
  }

  getMetrics () {
    return this._metrics.getMetrics()
  }
}

export default RendererEnvironmentCollector
