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

import { beforeEach, describe, expect, it } from '../../../helpers/dependencies'
import LogoIcon from '../../../../src/renderer/components/logo-icon'
import { createLocalVue, mount } from '@vue/test-utils'

function mountComponent () {
  return mount(LogoIcon, {
    localVue: createLocalVue()
  })
}

describe('LogoIcon', () => {
  let wrapper
  beforeEach(() => {
    wrapper = mountComponent()
  })

  it('displays inactive icon by default', () => {
    expect(wrapper.find('.icon-logo--active').exists()).to.be.false
    expect(wrapper.find('.icon-logo--inactive').exists()).to.be.true
  })

  it('displays inactive icon when active=false', () => {
    wrapper.setProps({
      active: false
    })
    expect(wrapper.find('.icon-logo--active').exists()).to.be.false
    expect(wrapper.find('.icon-logo--inactive').exists()).to.be.true
  })

  it('displays active icon when active=true', () => {
    wrapper.setProps({
      active: true
    })
    expect(wrapper.find('.icon-logo--active').exists()).to.be.true
    expect(wrapper.find('.icon-logo--inactive').exists()).to.be.false
  })
})
