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
import DIContainer from '../../../../src/app/di/vue-container'
import IdentityRegistration from '@/components/identity-registration'
import { createLocalVue, mount } from '@vue/test-utils'
import DirectMessageBus from '../../../helpers/direct-message-bus'
import { buildRendererCommunication } from '../../../../src/app/communication/renderer-communication'
import { buildMainCommunication } from '../../../../src/app/communication/main-communication'
import type { RendererCommunication } from '../../../../src/app/communication/renderer-communication'
import type { MainCommunication } from '../../../../src/app/communication/main-communication'
import IdentityRegistrationDTO from 'mysterium-tequilapi/lib/dto/identity-registration'

describe('IdentityRegistration', () => {
  let rendererCommunication: RendererCommunication
  let mainCommunication: MainCommunication
  let vue: IdentityRegistration

  beforeEach(() => {
    const vm = createLocalVue()
    const dependencies = new DIContainer(vm)

    const messageBus = new DirectMessageBus()
    rendererCommunication = buildRendererCommunication(messageBus)
    mainCommunication = buildMainCommunication(messageBus)

    dependencies.constant('rendererCommunication', rendererCommunication)
    dependencies.constant('getPaymentLink', () => {})
    vue = mount(IdentityRegistration, {
      localVue: vm
    })
  })

  describe('HTML rendering', () => {
    it('renders no ID icon until registration state comes from communication', () => {
      expect(vue.findAll('.identity-registration')).to.have.lengthOf(0)
      mainCommunication.identityRegistrationSender.send(new IdentityRegistrationDTO({ registered: true }))
      expect(vue.findAll('.identity-registration')).to.have.lengthOf(1)
    })

    it('renders ID icon when identity becomes registered', () => {
      mainCommunication.identityRegistrationSender.send(new IdentityRegistrationDTO({ registered: true }))
      expect(vue.findAll('.identity-registration')).to.have.lengthOf(1)
      expect(vue.findAll('.identity-registered')).to.have.lengthOf(1)
      expect(vue.findAll('.identity-unregistered')).to.have.lengthOf(0)
    })

    it('renders ID icon when identity becomes unregistered', () => {
      mainCommunication.identityRegistrationSender.send(new IdentityRegistrationDTO({ registered: false }))
      expect(vue.findAll('.identity-registration')).to.have.lengthOf(1)
      expect(vue.findAll('.identity-registered')).to.have.lengthOf(0)
      expect(vue.findAll('.identity-unregistered')).to.have.lengthOf(1)
    })

    it('renders instructions on unregistered ID click', () => {
      mainCommunication.identityRegistrationSender.send(new IdentityRegistrationDTO({ registered: false }))
      expect(vue.findAll('#registration-instructions.is-open')).to.have.lengthOf(0)
      vue.findAll('.identity-registration').trigger('click')
      expect(vue.findAll('#registration-instructions.is-open')).to.have.lengthOf(1)
    })
  })
})
