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

import { after, before, beforeEach, describe, expect, it } from '../../../helpers/dependencies'
import CopyButton from '../../../../src/renderer/components/copy-button'
import { createLocalVue, mount } from '@vue/test-utils'
import lolex from 'lolex'

function mountComponent () {
  return mount(CopyButton, {
    localVue: createLocalVue(),
    propsData: {
      text: 'text-to-copy'
    }
  })
}

describe('CopyButton', () => {
  let wrapper
  let clock: lolex

  before(() => {
    clock = lolex.install()
  })

  after(() => {
    clock.uninstall()
  })

  beforeEach(() => {
    wrapper = mountComponent()
  })

  it('should not show copied tooltip initially', () => {
    expect(wrapper.find('.copy-button__tooltip--success').exists()).to.be.false
  })

  it('should display copied tooltip after copy-click', () => {
    wrapper.find('.copy-button').trigger('click')

    expect(wrapper.find('.copy-button__tooltip--success').isVisible()).to.be.true
    clock.tick(1600)
    expect(wrapper.find('.copy-button__tooltip--success').exists()).to.be.false
  })
})
