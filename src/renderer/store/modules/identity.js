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
import IdentityDTO from 'mysterium-tequilapi/lib/dto/identity'
import type { BugReporter } from '../../../app/bug-reporting/interface'
import type { RendererCommunication } from '../../../app/communication/renderer-communication'
import IdentityRegistrationDTO from 'mysterium-tequilapi/lib/dto/identity-registration'

type State = {
  current: ?IdentityDTO,
  unlocked: boolean,
  registration: ?IdentityRegistrationDTO
}

function stateFactory (): State {
  return {
    current: null,
    unlocked: false,
    registration: null
  }
}

function mutationsFactory (bugReporter: BugReporter, communication: RendererCommunication) {
  return {
    [type.SET_CURRENT_IDENTITY] (state, identity: IdentityDTO) {
      state.current = identity
      bugReporter.setUser(identity)
      communication.currentIdentityChanged.send(identity)
    },
    [type.IDENTITY_UNLOCK_SUCCESS] (state) {
      state.unlocked = true
    },
    [type.IDENTITY_UNLOCK_PENDING] (state) {
      state.unlocked = false
    },
    // TODO: remove duplicated mutation
    [type.IDENTITY_UNLOCK_FAIL] (state) {
      state.unlocked = false
    },
    [type.SET_IDENTITY_REGISTRATION]: (state: State, registration: IdentityRegistrationDTO) => {
      state.registration = registration
    }
  }
}

const getters = {
  currentIdentity (state: State): string {
    const identity = state.current
    if (!identity) {
      throw new Error('Trying to get identity which is not present')
    }
    return identity.id
  },
  registration (state: State): ?IdentityRegistrationDTO {
    return state.registration
  }
}

function factory (bugReporter: BugReporter, communication: RendererCommunication) {
  return {
    state: stateFactory(),
    getters: { ...getters },
    mutations: mutationsFactory(bugReporter, communication)
  }
}

export type { State }
export default factory
