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

import type { BugReporter } from '../bug-reporting/interface'
import path from 'path'
import { isCountryKnown } from './index'

class CountryImageResolver {
  _bugReporter: BugReporter
  _unresolvedCountryList: string[]

  constructor (bugReporter: BugReporter) {
    this._bugReporter = bugReporter
    this._unresolvedCountryList = []
  }

  getImagePath (code: ?string): string {
    if (code == null) {
      return this._getDefaultIconPath()
    }
    if (!isCountryKnown(code)) {
      this._reportCountryIfUnique(code)
      return this._getDefaultIconPath()
    }
    return this._getIconPath(code)
  }

  _getDefaultIconPath (): string {
    return this._getIconPath('world')
  }

  _getIconPath (code: string): string {
    return path.join('static', 'flags', code.toLowerCase() + '.svg')
  }

  _reportCountryIfUnique (code: string) {
    if (!this._unresolvedCountryList.includes(code)) {
      this._unresolvedCountryList.push(code)
      this._bugReporter.captureInfoMessage('Country not found, code: ' + code)
    }
  }
}

export default CountryImageResolver
