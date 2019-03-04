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
import type from '../types'
import type { IdentityDTO } from 'mysterium-tequilapi/lib/dto/identity'
import type { IdentityRegistrationDTO } from 'mysterium-tequilapi/lib/dto/identity-registration/identity-registration'
import logger from '../../../app/logger'
import IdentityManager from '../../../app/identity-manager'

type State = {
  current: ?IdentityDTO,
  registration: ?IdentityRegistrationDTO
}

function stateFactory (): State {
  return {
    current: null,
    registration: null
  }
}

function actionsFactory () {
  return {
    startObserving ({ commit }: { commit: Function }, identityManager: IdentityManager) {
      identityManager.onCurrentIdentityChange((newIdentity: IdentityDTO) => {
        commit(type.SET_CURRENT_IDENTITY, newIdentity)
      })
    }
  }
}

function mutationsFactory () {
  return {
    [type.SET_CURRENT_IDENTITY] (state, identity: IdentityDTO) {
      state.current = identity
    },
    [type.SET_IDENTITY_REGISTRATION]: (state: State, registration: IdentityRegistrationDTO) => {
      state.registration = registration
    }
  }
}

const getters = {
  currentIdentity (state: State): ?string {
    const identity = state.current
    if (!identity) {
      logger.warn('Trying to get identity which is not present')
      return null
    }
    return identity.id
  },
  registration (state: State): ?IdentityRegistrationDTO {
    return state.registration
  }
}

function factory () {
  return {
    state: stateFactory(),
    getters: { ...getters },
    mutations: mutationsFactory(),
    actions: actionsFactory()
  }
}

export type { State }
export default factory
