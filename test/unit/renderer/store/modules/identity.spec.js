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

import Vuex from 'vuex'
import { beforeEach, describe, expect, it } from '../../../../helpers/dependencies'
import factory from '../../../../../src/renderer/store/modules/identity'
import type { State } from '../../../../../src/renderer/store/modules/identity'
import types from '../../../../../src/renderer/store/types'
import type { IdentityRegistrationDTO } from 'mysterium-tequilapi/lib/dto/identity-registration/identity-registration'
import BugReporterMock from '../../../../helpers/bug-reporter-mock'
import { buildRendererCommunication } from '../../../../../src/app/communication/renderer-communication'
import DirectMessageBus from '../../../../helpers/direct-message-bus'
import IdentityManager from '../../../../../src/app/identity-manager'
import EmptyTequilapiClientMock from './empty-tequilapi-client-mock'
import { createLocalVue } from '@vue/test-utils'

describe('identity store', () => {
  let storeConfig
  let bugReporter
  let communication

  beforeEach(() => {
    bugReporter = new BugReporterMock()
    communication = buildRendererCommunication(new DirectMessageBus())
    storeConfig = factory(bugReporter, communication)
  })

  describe('getters', () => {
    let getters

    beforeEach(() => {
      getters = storeConfig.getters
    })

    describe('.currentIdentity', () => {
      it('returns id of identity', () => {
        const state: State = {
          current: { id: 'identity id' },
          registration: null
        }
        expect(getters.currentIdentity(state)).to.eql('identity id')
      })

      it('returns null when identity is not present', () => {
        const state: State = {
          current: null,
          registration: null
        }
        expect(getters.currentIdentity(state)).to.eql(null)
      })
    })
  })

  describe('mutations', () => {
    let mutations

    beforeEach(() => {
      mutations = storeConfig.mutations
    })

    describe('SET_IDENTITY_REGISTRATION', () => {
      it('fetches and commits identity registration', async () => {
        const state: State = {
          current: null,
          registration: null
        }
        const registration: IdentityRegistrationDTO = { registered: true }
        mutations[types.SET_IDENTITY_REGISTRATION](state, registration)
        expect(state.registration).to.eql(registration)
      })
    })
  })

  describe('with store', () => {
    describe('actions', () => {
      let store
      let identityManager: IdentityManager

      beforeEach(() => {
        identityManager = new IdentityManager(new EmptyTequilapiClientMock())

        const localVue = createLocalVue()
        localVue.use(Vuex)
        store = new Vuex.Store(storeConfig)
      })

      describe('.startObserving', () => {
        it('observes identity', () => {
          store.dispatch('startObserving', identityManager)

          identityManager.setCurrentIdentity({ id: 'new identity' })
          expect(store.getters.currentIdentity).to.eql('new identity')
        })
      })
    })
  })
})
