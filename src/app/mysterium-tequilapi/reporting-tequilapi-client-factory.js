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

import TequilapiClientFactory, { TEQUILAPI_URL } from '../../libraries/mysterium-tequilapi/tequilapi-client-factory'
import type { HttpInterface } from '../../libraries/mysterium-tequilapi/adapters/interface'
import LoggerAdapter from './adapters/logger-adapter'
import { TIMEOUT_DEFAULT } from '../../libraries/mysterium-tequilapi/timeouts'

class ReportingTequilapiClientFactory extends TequilapiClientFactory {
  constructor (
    baseUrl: string = TEQUILAPI_URL,
    defaultTimeout: number = TIMEOUT_DEFAULT) {
    super(baseUrl, defaultTimeout)
  }

  _buildAdapter (): HttpInterface {
    const adapter = super._buildAdapter()
    return new LoggerAdapter(adapter)
  }
}

export default ReportingTequilapiClientFactory
