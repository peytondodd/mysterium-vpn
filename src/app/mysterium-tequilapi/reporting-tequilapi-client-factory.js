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

import TequilapiClientFactory, { TEQUILAPI_URL } from 'mysterium-tequilapi'
import { TequilapiClient } from 'mysterium-tequilapi/lib/client'
import type { HttpInterface } from 'mysterium-tequilapi/lib/adapters/interface'
import LoggerAdapter from './adapters/logger-adapter'
import { TIMEOUT_DEFAULT } from 'mysterium-tequilapi/lib/timeouts'
import logger from '../logger'

class ReportingTequilapiClientFactory {
  _tequilapiFactory: TequilapiClientFactory

  constructor (
    baseUrl: string = TEQUILAPI_URL,
    defaultTimeout: number = TIMEOUT_DEFAULT) {
    this._tequilapiFactory = new TequilapiClientFactory(baseUrl, defaultTimeout)
  }

  build (adapter: HttpInterface): TequilapiClient {
    return this._tequilapiFactory.build(adapter)
  }

  buildAdapter (): HttpInterface {
    const adapter = this._tequilapiFactory.buildAdapter()
    return new LoggerAdapter(logger, adapter)
  }
}

export default ReportingTequilapiClientFactory
