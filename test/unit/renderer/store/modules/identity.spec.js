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

import { beforeEach, describe, expect, it } from '../../../../helpers/dependencies'
import factory from '../../../../../src/renderer/store/modules/identity'
import type { State } from '../../../../../src/renderer/store/modules/identity'
import IdentityDTO from 'mysterium-tequilapi/lib/dto/identity'
import types from '../../../../../src/renderer/store/types'
import IdentityRegistrationDTO from 'mysterium-tequilapi/lib/dto/identity-registration'
import BugReporterMock from '../../../../helpers/bug-reporter-mock'
import { buildRendererCommunication } from '../../../../../src/app/communication/renderer-communication'
import DirectMessageBus from '../../../../helpers/direct-message-bus'

describe('identity store', () => {
  let store
  let bugReporter
  let communication

  beforeEach(() => {
    bugReporter = new BugReporterMock()
    communication = buildRendererCommunication(new DirectMessageBus())
    store = factory(bugReporter, communication)
  })

  describe('getters', () => {
    let getters

    beforeEach(() => {
      getters = store.getters
    })

    describe('.currentIdentity', () => {
      it('returns id of identity', () => {
        const state: State = {
          current: new IdentityDTO({ id: 'identity id' }),
          unlocked: false,
          registration: null
        }
        expect(getters.currentIdentity(state)).to.eql('identity id')
      })

      it('returns empty string when identity is not present', () => {
        const state: State = {
          current: null,
          unlocked: false,
          registration: null
        }
        expect(getters.currentIdentity(state)).to.eql('')
      })
    })
  })

  describe('mutations', () => {
    let mutations

    beforeEach(() => {
      mutations = store.mutations
    })

    describe('SET_IDENTITY_REGISTRATION', () => {
      it('fetches and commits identity registration', async () => {
        const state: State = {
          current: null,
          unlocked: false,
          registration: null
        }
        const registration = new IdentityRegistrationDTO({})
        mutations[types.SET_IDENTITY_REGISTRATION](state, registration)
        expect(state.registration).to.eql(registration)
      })
    })
  })
})
