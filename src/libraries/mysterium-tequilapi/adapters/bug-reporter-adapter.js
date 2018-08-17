/*
 * Copyright (C) 2017 The "MysteriumNetwork/mysterion" Authors.
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

import type { HttpInterface, HttpQueryParams } from './interface'
import type { BugReporter } from '../../../app/bug-reporting/interface'
import { isHttpError } from '../client-error'

/**
 * Delegates to other 'HttpInterface' and captures errors to 'BugReporter'.
 */
class BugReporterAdapter implements HttpInterface {
  _adapter: HttpInterface
  _bugReporter: BugReporter

  constructor (adapter: HttpInterface, bugReporter: BugReporter) {
    this._adapter = adapter
    this._bugReporter = bugReporter
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
      if (isHttpError(err)) {
        this._bugReporter.captureInfoException(err)
      }
      throw err
    }
  }
}

export default BugReporterAdapter
