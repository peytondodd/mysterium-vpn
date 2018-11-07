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

import { expect } from 'chai'
import type from '@/store/types'
import EmptyTequilapiClientMock from './empty-tequilapi-client-mock'
import { beforeEach, describe, it } from '../../../../helpers/dependencies'
import { CallbackRecorder } from '../../../../helpers/utils'
import type { NodeHealthcheckDTO } from 'mysterium-tequilapi/lib/dto/node-healthcheck'
import NodeBuildInfoDTO from 'mysterium-tequilapi/lib/dto/node-build-info'
import type { State } from '../../../../../src/renderer/store/modules/main'
import factory from '../../../../../src/renderer/store/modules/main'
import MockEventSender from '../../../../helpers/statistics/mock-event-sender'

function initialState (): State {
  return {
    init: '',
    visual: 'head',
    navOpen: false,
    identityMenuOpen: false,
    clientVersion: null,
    navVisible: true,
    errorMessage: null,
    error: null,
    showError: false
  }
}

class MainTequilapiClientMock extends EmptyTequilapiClientMock {
  async healthCheck (_timeout: ?number): Promise<NodeHealthcheckDTO> {
    return {
      uptime: '',
      process: 0,
      version: 'mock version',
      buildInfo: new NodeBuildInfoDTO({
        commit: 'mock commit',
        branch: 'mock branch',
        buildNumber: 'mock buildNumber'
      })
    }
  }
}

describe('main store', () => {
  let store
  let client: MainTequilapiClientMock
  let mockEventSender: MockEventSender

  beforeEach(() => {
    client = new MainTequilapiClientMock()
    mockEventSender = new MockEventSender()
    store = factory(client, mockEventSender)
  })

  describe('mutations', () => {
    let mutations
    let state: State

    beforeEach(() => {
      mutations = store.mutations
      state = initialState()
    })

    describe('SHOW_ERROR_MESSAGE', () => {
      it('saves message and shows it', () => {
        mutations[type.SHOW_ERROR_MESSAGE](state, 'error message')

        expect(state.showError).to.be.true
        expect(state.errorMessage).to.eql('error message')
      })
    })

    describe('HIDE_ERROR', () => {
      it('hides error', () => {
        state.showError = true
        mutations[type.HIDE_ERROR](state)

        expect(state.showError).to.be.false
      })
    })

    describe('SHOW_IDENTITY_MENU', () => {
      it('updates state to show menu', () => {
        mutations[type.SHOW_IDENTITY_MENU](state)

        expect(state.identityMenuOpen).to.be.true
      })
    })

    describe('HIDE_IDENTITY_MENU', () => {
      it('updates state to hide menu', () => {
        state.identityMenuOpen = true
        mutations[type.HIDE_IDENTITY_MENU](state)

        expect(state.identityMenuOpen).to.be.false
      })
    })
  })

  describe('actions', () => {
    let actions

    beforeEach(() => {
      actions = store.actions
    })

    describe('CLIENT_VERSION', () => {
      it('commits version from tequilapi', async () => {
        const recorder = new CallbackRecorder()
        const commit = recorder.getCallback()

        await actions[type.CLIENT_VERSION]({ commit })

        expect(recorder.arguments).to.eql([type.CLIENT_VERSION, 'mock version'])
      })

      it('sends version to Elk', async () => {
        const recorder = new CallbackRecorder()
        const commit = recorder.getCallback()

        await actions[type.CLIENT_VERSION]({ commit })

        expect(mockEventSender.events).to.eql([{ eventName: 'client_started', context: { version: 'mock version' } }])
      })
    })
  })
})
