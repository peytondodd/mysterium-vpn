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

import { TequilapiClient } from 'mysterium-tequilapi/lib/client'

class VersionCheck {
  _tequilapi: TequilapiClient
  _packageVersion: ?string

  constructor (tequilapi: TequilapiClient, packageVersion: string) {
    this._tequilapi = tequilapi
    this._packageVersion = packageVersion
  }

  async runningVersionMatchesPackageVersion (): Promise<boolean> {
    const healthCheckResponse = await this._tequilapi.healthCheck()

    return healthCheckResponse.version === this._packageVersion
  }
}

export default VersionCheck
