/*
 * Copyright (C) 2018 The "MysteriumNetwork/mysterion" Authors.
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
import DIContainer from '../../../../src/app/di/vue-container'
import IdentityRegistration from '@/components/identity-registration'
import { createLocalVue, mount } from '@vue/test-utils'

class FakeRendererCommunication {
  callback: IdentityRegistration => void

  onRegistrationUpdate (callback: IdentityRegistration => void) {
    this.callback = callback
  }

  sendRegistationUpdate (registration: IdentityRegistration) {
    if (this.callback) {
      this.callback(registration)
    }
  }
}

describe('IdentityRegistration', () => {
  let rendererCommunication: FakeRendererCommunication
  let vue: IdentityRegistration

  beforeEach(() => {
    const vm = createLocalVue()
    const dependencies = new DIContainer(vm)
    rendererCommunication = new FakeRendererCommunication()
    dependencies.constant('rendererCommunication', rendererCommunication)
    dependencies.constant('paymentBaseUrl', '')
    vue = mount(IdentityRegistration, {
      localVue: vm
    })
  })

  describe('renders', () => {
    it('no ID icon until registration state comes from communication', () => {
      expect(vue.findAll('.identity-registration')).to.have.lengthOf(0)
      rendererCommunication.callback({ registered: true })
      expect(vue.findAll('.identity-registration')).to.have.lengthOf(1)
    })

    it('ID icon when identity becomes registered', () => {
      rendererCommunication.callback({ registered: true })
      expect(vue.findAll('.identity-registration')).to.have.lengthOf(1)
      expect(vue.findAll('.identity-registered')).to.have.lengthOf(1)
      expect(vue.findAll('.identity-unregistered')).to.have.lengthOf(0)
    })

    it('ID icon when identity becomes registered', () => {
      rendererCommunication.callback({ registered: false })
      expect(vue.findAll('.identity-registration')).to.have.lengthOf(1)
      expect(vue.findAll('.identity-registered')).to.have.lengthOf(0)
      expect(vue.findAll('.identity-unregistered')).to.have.lengthOf(1)
    })

    it('instructions on unregistered ID click', () => {
      rendererCommunication.callback({ registered: false })
      expect(vue.findAll('#registration-instructions.is-open')).to.have.lengthOf(0)
      vue.findAll('.identity-registration').trigger('click')
      expect(vue.findAll('#registration-instructions.is-open')).to.have.lengthOf(1)
    })
  })
})
