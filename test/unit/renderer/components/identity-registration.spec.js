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
import Vuex from 'vuex'
import mainStoreFactory from '@/store/modules/main'
import EmptyTequilapiClientMock from '../store/modules/empty-tequilapi-client-mock'
import identityStoreFactory from '../../../../src/renderer/store/modules/identity'
import BugReporterMock from '../../../helpers/bug-reporter-mock'
import types from '../../../../src/renderer/store/types'
import MockEventSender from '../../../helpers/statistics/mock-event-sender'

describe('IdentityRegistration', () => {
  let rendererCommunication: RendererCommunication
  let mainCommunication: MainCommunication
  let wrapper: IdentityRegistration
  let store: Vuex.Store

  function mountEverything (stateOverride = {}) {
    const vm = createLocalVue()
    vm.use(Vuex)

    const dependencies = new DIContainer(vm)

    const messageBus = new DirectMessageBus()
    rendererCommunication = buildRendererCommunication(messageBus)
    mainCommunication = buildMainCommunication(messageBus)

    dependencies.constant('rendererCommunication', rendererCommunication)
    dependencies.constant('getPaymentLink', () => {
    })

    const tequilapi = new EmptyTequilapiClientMock()
    const bugReporter = new BugReporterMock()
    const identity = {
      ...identityStoreFactory(bugReporter, rendererCommunication),
      state: stateOverride
    }
    store = new Vuex.Store({
      modules: {
        main: mainStoreFactory(tequilapi, new MockEventSender()),
        identity: identity
      }
    })

    wrapper = mount(IdentityRegistration, {
      localVue: vm,
      store
    })
  }

  describe('HTML rendering when State is not OK', () => {
    beforeEach(() => {
      mountEverything({
        current: null
      })
    })

    it('should still render component', () => {
      expect(wrapper.findAll('#identity-registration')).to.have.lengthOf(1)
    })
  })

  describe('HTML rendering when State is OK', () => {
    beforeEach(() => {
      mountEverything({
        current: {
          id: '0x1'
        }
      })
    })

    it('renders instructions when menu is opened', () => {
      mainCommunication.identityRegistration.send(new IdentityRegistrationDTO({
        registered: false,
        publicKey: null,
        signature: null
      }))
      expect(wrapper.findAll('#registration-instructions.is-open')).to.have.lengthOf(0)
      store.commit(types.SHOW_IDENTITY_MENU)
      expect(wrapper.findAll('#registration-instructions.is-open')).to.have.lengthOf(1)
    })

    it('renders client ID', () => {
      expect(wrapper.findAll('.consumer-id-view__item')).to.have.lengthOf(3, 'has 3 elements')
      expect(wrapper.findAll('.consumer-id-view__id-text')).to.have.lengthOf(1, 'has ID text')
      expect(wrapper.findAll('.copy-button')).to.have.lengthOf(1, 'has Copy Button')
    })
  })
})
