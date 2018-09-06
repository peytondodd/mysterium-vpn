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

import types from '../renderer/store/types'
import IdentityDTO from '../libraries/mysterium-tequilapi/dto/identity'
import type { TequilapiClient } from '../libraries/mysterium-tequilapi/client'
import type { State as IdentityState } from '../renderer/store/modules/identity'

const PASSWORD = ''

/**
 * Allows managing identities using TequilapiClient and persisting data in identities module.
 */
class IdentityManager {
  _tequilapi: TequilapiClient
  _commit: Function
  _state: IdentityState

  constructor (tequilapi: TequilapiClient, commit: Function, state: IdentityState) {
    this._tequilapi = tequilapi
    this._commit = commit
    this._state = state
  }

  async listIdentities (): Promise<Array<IdentityDTO>> {
    try {
      return await this._tequilapi.identitiesList()
    } catch (err) {
      this._commit(types.SHOW_ERROR, err)
      throw err
    }
  }

  setCurrentIdentity (identity: IdentityDTO) {
    this._commit(types.SET_CURRENT_IDENTITY, identity)
  }

  async createIdentity (): Promise<IdentityDTO> {
    try {
      return await this._tequilapi.identityCreate(PASSWORD)
    } catch (err) {
      this._commit(types.SHOW_ERROR, err)
      throw err
    }
  }

  async unlockCurrentIdentity (): Promise<void> {
    try {
      if (this._state.current == null) {
        throw new Error('Identity is not available')
      }
      await this._tequilapi.identityUnlock(this._state.current.id, PASSWORD)
      this._commit(types.IDENTITY_UNLOCK_SUCCESS)
    } catch (err) {
      this._commit(types.SHOW_ERROR, err)
      throw err
    }
  }
}

export default IdentityManager
