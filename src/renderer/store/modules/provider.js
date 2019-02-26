/*
 * Copyright (C) 2019 The "mysteriumnetwork/mysterium-vpn" Authors.
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

type State = {
  status: ?string
}

function stateFactory (): State {
  return {
    status: null
  }
}

const mutations = {
  [type.SET_PROVIDER_STATUS] (state: State, status: string) {
    state.status = status
  }
}

const getters = {
  providerStatus: (state: State) => state.status
}

const actions = {
  [type.SET_PROVIDER_STATUS] ({ commit }, status: string) {
    commit(type.SET_PROVIDER_STATUS, status)
  }
}

function factory () {
  return {
    state: stateFactory(),
    mutations,
    getters,
    actions
  }
}

export default factory
