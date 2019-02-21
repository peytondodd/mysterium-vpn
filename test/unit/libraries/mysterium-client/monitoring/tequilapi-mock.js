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

import EmptyTequilapiClientMock from '../../../renderer/store/modules/empty-tequilapi-client-mock'
import type { NodeHealthcheckDTO } from 'mysterium-tequilapi/lib/dto/node-healthcheck'

/**
 * Mock TequilapiClient class for testing monitoring.
 */
class TequilapiMock extends EmptyTequilapiClientMock {
  cancelIsCalled: boolean = false
  healthCheckThrowsError: boolean = false
  healthCheckCallCount: number = 0

  get healthCheckIsCalled () {
    return this.healthCheckCallCount > 0
  }

  async connectionCancel (): Promise<void> {
    this.cancelIsCalled = true
  }

  async healthCheck (_timeout: ?number): Promise<NodeHealthcheckDTO> {
    this.healthCheckCallCount++
    if (this.healthCheckThrowsError) {
      throw new Error('HEALTH_CHECK_TEST_ERROR')
    }
    return {
      uptime: '',
      process: 0,
      version: '',
      buildInfo: {
        branch: 'mock branch',
        buildNumber: 'mock build number',
        commit: 'mock commit'
      }
    }
  }
}

export default TequilapiMock
