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

import { describe, expect, it } from '../../../helpers/dependencies'
import EmptyTequilapiClientMock from '../../renderer/store/modules/empty-tequilapi-client-mock'
import type { NodeHealthcheckDTO } from 'mysterium-tequilapi/lib/dto/node-healthcheck'
import NodeBuildInfoDTO from 'mysterium-tequilapi/lib/dto/node-build-info'
import VersionCheck from '../../../../src/libraries/mysterium-client/version-check'

class TequilapiMock extends EmptyTequilapiClientMock {
  _versionMock: string

  constructor (versionMock: string) {
    super()
    this._versionMock = versionMock
  }

  async healthCheck (_timeout: ?number): Promise<NodeHealthcheckDTO> {
    return {
      uptime: '',
      process: 0,
      version: this._versionMock,
      buildInfo: new NodeBuildInfoDTO({})
    }
  }
}

describe('VersionCheck', () => {
  const tequilapiClient = new TequilapiMock('1.0.0')

  describe('.runningVersionMatchesPackageVersion', () => {
    it('returns true when healthcheck version matches', async () => {
      const versionCheck = new VersionCheck(tequilapiClient, '1.0.0')
      expect(await versionCheck.runningVersionMatchesPackageVersion()).to.be.true
    })

    it('returns false when healthcheck version differs', async () => {
      const versionCheck = new VersionCheck(tequilapiClient, '0.0.1')
      expect(await versionCheck.runningVersionMatchesPackageVersion()).to.be.false
    })
  })
})
