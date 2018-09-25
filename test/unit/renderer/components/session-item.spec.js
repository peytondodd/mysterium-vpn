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

import SessionItem from '../../../../src/renderer/components/session-item'
import { createLocalVue, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from '../../../helpers/dependencies'
import type { SessionDto } from '../../../../src/app/bug-reporting/tequilapi-client-with-metrics'

function mountSessionItem () {
  const localVue = createLocalVue()

  const session: SessionDto = {
    id: '691bb110-c096-11e8-b371-ebde26989839',
    proposal: {
      providerId: '0x3b03a513fba4bd4868edd340f77da0c920150f3e'
    },
    location: {
      country: 'lt'
    },
    statistics: {
      dateStart: 1537787035230,
      duration: 35 * 60,
      bytesSent: 1024,
      bytesReceived: 6000
    }
  }

  return mount(SessionItem, {
    localVue,
    propsData: { session }
  })
}

describe('SessionItem', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mountSessionItem()
  })

  it('renders successfully', () => {
    expect(wrapper).to.be.ok
  })

  it('renders shortened identity', () => {
    const nodeText = wrapper.findAll('td').at(1).element.innerText
    expect(nodeText).to.eql('[lt]0x3b03a513f...')
  })

  it('renders countries', () => {
    // TODO: render icons instead
    const nodeText = wrapper.findAll('td').at(1).element.innerText
    expect(nodeText).to.have.string('[lt]')
  })

  it('renders start date and time', () => {
    const startText = wrapper.findAll('td').at(2).element.innerText
    expect(startText).to.eql('24/09/2018\n14:03:55')
  })

  it('renders duration time', () => {
    const duration = wrapper.findAll('td').at(3).element.innerText
    expect(duration).to.eql('00:35:00')
  })

  it('renders sent and received amounts', () => {
    const traffic = wrapper.findAll('td').at(4).element.innerText
    expect(traffic).to.eql('1.00KB/5.86KB')
  })
})
