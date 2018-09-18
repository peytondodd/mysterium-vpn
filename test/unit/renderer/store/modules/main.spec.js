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

import { mutations, actionsFactory } from '@/store/modules/main'
import type from '@/store/types'
import EmptyTequilapiClientMock from './empty-tequilapi-client-mock'
import { describe, it } from '../../../../helpers/dependencies'
import { CallbackRecorder } from '../../../../helpers/utils'
import type { NodeHealthcheckDTO } from '../../../../../src/libraries/mysterium-tequilapi/dto/node-healthcheck'
import NodeBuildInfoDTO from '../../../../../src/libraries/mysterium-tequilapi/dto/node-build-info'

function initialState () {
  return {
    init: '',
    visual: 'head',
    navOpen: false,
    clientVersion: null,
    navVisible: true,
    errorMessage: null,
    error: null,
    showError: false
  }
}

describe('mutations', () => {
  describe('SHOW_ERROR_MESSAGE', () => {
    it('saves message and shows it', () => {
      const state = initialState()
      mutations[type.SHOW_ERROR_MESSAGE](state, 'error message')

      expect(state.showError).to.eql(true)
      expect(state.errorMessage).to.eql('error message')
    })
  })

  describe('HIDE_ERROR', () => {
    it('hides error', () => {
      const state = initialState()
      state.showError = true
      mutations[type.HIDE_ERROR](state)

      expect(state.showError).to.eql(false)
    })
  })
})

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

describe('actions', () => {
  describe('CLIENT_VERSION', () => {
    it('commits version from tequilapi', async () => {
      const client = new MainTequilapiClientMock()
      const actions = actionsFactory(client)
      const recorder = new CallbackRecorder()
      const commit = recorder.getCallback()

      await actions[type.CLIENT_VERSION]({ commit })

      expect(recorder.arguments).to.eql([type.CLIENT_VERSION, 'mock version'])
    })
  })
})
