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
import NavList from '@/components/nav-list'
import { createLocalVue, mount } from '@vue/test-utils'

describe('NavList', () => {
  let wrapper
  let localVue
  beforeEach(() => {
    localVue = createLocalVue()
  })

  it('should render one element', () => {
    wrapper = mount(NavList, {
      localVue,
      slots: {
        item: '<span>Item 1</span>'
      }
    })

    const items = wrapper.findAll('li')
    expect(items).to.have.lengthOf(1)
    expect(items.at(0).text()).to.equal('Item 1')
  })

  it('should render multiple elements', () => {
    wrapper = mount(NavList, {
      localVue,
      slots: {
        item: [
          '<span>Item 1</span>',
          '<span>Item 2</span>',
          '<span>Item 3</span>'
        ]
      }
    })

    const items = wrapper.findAll('li')
    expect(items).to.have.lengthOf(3)
    expect(items.at(0).text()).to.equal('Item 1')
    expect(items.at(1).text()).to.equal('Item 2')
    expect(items.at(2).text()).to.equal('Item 3')
  })
})
