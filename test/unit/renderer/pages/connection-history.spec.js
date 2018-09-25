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
import { createLocalVue, mount } from '@vue/test-utils'
import { beforeEach, describe, it, expect } from '../../../helpers/dependencies'
import ConnectionHistory from '../../../../src/renderer/pages/connection-history'
import DIContainer from '../../../../src/app/di/vue-container'
import type { SessionDto } from '../../../../src/app/bug-reporting/tequilapi-client-with-metrics'

describe('ConnectionHistory', () => {
  let wrapper

  const mockedSessions: SessionDto[] = [
    {
      id: '5fefd260-c096-11e8-b371-ebde26989839',
      provider: {
        identity: '0x3b03a513fba4bd4868edd340f77da0c920150f3e',
        country: 'lt'
      },
      start: 1537787035230,
      duration: 35 * 60,
      bytesSent: 1024,
      bytesReceived: 6000
    },
    {
      id: '64eef750-c096-11e8-b371-ebde26989839',
      provider: {
        identity: '0x3b03a513fba4bd4868edd340f77da0c920150f3e',
        country: 'lt'
      },
      start: 1537787035230,
      duration: 35 * 60,
      bytesSent: 1024,
      bytesReceived: 6000
    }
  ]

  function mountConnectionHistory () {
    const localVue = createLocalVue()
    const dependencies = new DIContainer(localVue)
    dependencies.constant('tequilapiClient', {
      async sessionsList () {
        return mockedSessions
      }
    })
    return mount(ConnectionHistory, {
      localVue
    })
  }

  beforeEach(() => {
    wrapper = mountConnectionHistory()
  })

  it('renders successfully', () => {
    expect(wrapper).to.be.ok
  })

  it('renders table with headers and list of sessions', async () => {
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('tr')).to.have.length(1 + mockedSessions.length)
  })
})
