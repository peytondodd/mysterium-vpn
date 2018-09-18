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

import type { HttpInterface, HttpQueryParams } from '../../../libraries/mysterium-tequilapi/adapters/interface'
import { Logger } from '../../logger'

/**
 * Delegates to other 'HttpInterface' and logs errors.
 */
class LoggerAdapter implements HttpInterface {
  _logger: Logger
  _adapter: HttpInterface

  constructor (logger: Logger, adapter: HttpInterface) {
    this._logger = logger
    this._adapter = adapter
  }

  async get (path: string, query: ?HttpQueryParams, timeout: ?number): Promise<?any> {
    const func = () => this._adapter.get(path, query, timeout)
    return this._captureHttpErrors(func)
  }

  async post (path: string, data: mixed, timeout: ?number): Promise<?any> {
    const func = () => this._adapter.post(path, data, timeout)
    return this._captureHttpErrors(func)
  }

  async delete (path: string, timeout: ?number): Promise<?any> {
    const func = () => this._adapter.delete(path, timeout)
    return this._captureHttpErrors(func)
  }

  async put (path: string, data: mixed, timeout: ?number): Promise<?any> {
    const func = () => this._adapter.put(path, data, timeout)
    return this._captureHttpErrors(func)
  }

  async _captureHttpErrors (func: () => Promise<?any>): Promise<?any> {
    try {
      return await func()
    } catch (err) {
      this._logger.info(err)
      throw err
    }
  }
}

export default LoggerAdapter
