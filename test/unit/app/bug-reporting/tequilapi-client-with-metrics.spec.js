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

import { expect, beforeEach, describe, it } from '../../../helpers/dependencies'
import TequilapiClientWithMetrics from '../../../../src/app/bug-reporting/tequilapi-client-with-metrics'
import EmptyTequilapiClientMock from '../../renderer/store/modules/empty-tequilapi-client-mock'
import BugReporterMetricsStore from '../../../../src/app/bug-reporting/metrics/bug-reporter-metrics-store'
import { METRICS, NOT_SET } from '../../../../src/app/bug-reporting/metrics/metrics'

describe('TequilapiClientWithMetrics', () => {
  let api
  let metrics
  let apiMetrics

  beforeEach(() => {
    api = new EmptyTequilapiClientMock()
    metrics = new BugReporterMetricsStore()
    apiMetrics = new TequilapiClientWithMetrics(api, metrics)
  })

  describe('healthcheck()', () => {
    it('sets HEALTH_CHECK_TIME metric value', async () => {
      expect(metrics.get(METRICS.HEALTH_CHECK_TIME)).to.eql(NOT_SET)
      await apiMetrics.healthCheck()
      expect(metrics.get(METRICS.HEALTH_CHECK_TIME)).to.not.eql(NOT_SET)
    })
  })
})
