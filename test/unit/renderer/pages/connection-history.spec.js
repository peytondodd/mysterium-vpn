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

describe('ConnectionHistory', () => {
  let wrapper

  function mountConnectionHistory () {
    const localVue = createLocalVue()
    const dependencies = new DIContainer(localVue)
    dependencies.constant('tequilapiClient', {
      async connectionHistoryList () {
        return [
          {
            id: '1',
            identity: '0x3b03a513fba4bd4868edd340f77da0c920150f3e',
            start: '2018.09.24 14:23:23',
            status: 'Successful',
            duration: '00:35:00',
            sent: '1MB',
            received: '5MB'
          }
        ]
      }
    })
    return mount(ConnectionHistory, {
      localVue
    })
  }

  beforeEach(() => {
    wrapper = mountConnectionHistory()
  })

  it('renders list of records', async () => {
    await wrapper.vm.$nextTick()
    expect(wrapper).to.be.ok
    expect(wrapper.findAll('tr')).to.have.length(2)
  })
})
