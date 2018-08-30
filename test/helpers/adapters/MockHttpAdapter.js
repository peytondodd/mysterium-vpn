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

import type { HttpInterface, HttpQueryParams } from '../../../src/libraries/mysterium-tequilapi/adapters/interface'

class MockHttpAdapter implements HttpInterface {
  mockError: ?Error = null
  mockResponse: any = null

  lastPath: ?string = null
  lastQuery: ?HttpQueryParams = null
  lastData: mixed = null
  lastTimeout: ?number = null

  async get (path: string, query: ?HttpQueryParams, timeout: ?number): Promise<?any> {
    this.lastPath = path
    this.lastQuery = query
    this.lastTimeout = timeout

    return this._getResponse()
  }

  async post (path: string, data: mixed, timeout: ?number): Promise<?any> {
    this.lastPath = path
    this.lastData = data
    this.lastTimeout = timeout

    return this._getResponse()
  }

  async delete (path: string, timeout: ?number): Promise<?any> {
    this.lastPath = path
    this.lastTimeout = timeout

    return this._getResponse()
  }

  async put (path: string, data: mixed, timeout: ?number): Promise<?any> {
    this.lastPath = path
    this.lastData = data
    this.lastTimeout = timeout

    return this._getResponse()
  }

  _getResponse (): any {
    if (this.mockError != null) {
      throw this.mockError
    }
    return this.mockResponse
  }
}

export default MockHttpAdapter
