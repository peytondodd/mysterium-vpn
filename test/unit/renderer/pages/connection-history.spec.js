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
import VueRouter from 'vue-router'
import { SessionDTO } from 'mysterium-tequilapi/lib/dto/session'
import { TimeFormatter } from '../../../../src/libraries/time-formatter'
import { DurationFormatter } from '../../../../src/libraries/duration-formatter'

describe('ConnectionHistory', () => {
  let wrapper

  const mockedSessions: SessionDTO[] = [
    {
      sessionId: '5fefd260-c096-11e8-b371-ebde26989839',
      providerId: '0x3b03a513fba4bd4868edd340f77da0c920150f3e',
      providerCountry: 'lt',
      dateStarted: '2019-02-14T11:04:15Z',
      bytesSent: 1024,
      bytesReceived: 6000,
      duration: 35 * 60
    },
    {
      sessionId: '64eef750-c096-11e8-b371-ebde26989839',
      providerId: '0x3b03a513fba4bd4868edd340f77da0c920150f3e',
      providerCountry: 'lt',
      dateStarted: '2019-02-14T11:04:15Z',
      bytesSent: 1024,
      bytesReceived: 6000,
      duration: 35 * 60
    }
  ]

  function mountConnectionHistory () {
    const localVue = createLocalVue()
    localVue.use(VueRouter)
    const dependencies = new DIContainer(localVue)
    dependencies.constant('tequilapiClient', {
      async sessionsList () {
        return mockedSessions
      }
    })
    dependencies.constant('timeFormatter', new TimeFormatter(0))
    dependencies.constant('durationFormatter', new DurationFormatter())
    const router = new VueRouter()
    return mount(ConnectionHistory, { localVue, router })
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

  it('renders close button which opens vpn window', () => {
    wrapper.find('.close-button').trigger('click')
    expect(wrapper.vm.$router.currentRoute.path).to.eql('/vpn')
  })
})
