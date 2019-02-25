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
import Vpn from '../../../../src/renderer/pages/vpn'
import Vuex, { Store } from 'vuex'
import DIContainer from '../../../../src/app/di/vue-container'
import messages from '../../../../src/app/communication/messages'
import FakeMessageBus from '../../../helpers/fake-message-bus'
import BugReporterMock from '../../../helpers/bug-reporter-mock'
import StartupEventTracker from '../../../../src/app/statistics/startup-event-tracker'
import MockEventSender from '../../../helpers/statistics/mock-event-sender'
import { UserSettingsProxy } from '../../../../src/app/user-settings/user-settings-proxy'
import { buildRendererCommunication } from '../../../../src/app/communication/renderer-communication'
import identityStoreFactory from '../../../../src/renderer/store/modules/identity'
import types from '../../../../src/renderer/store/types'
import type { IdentityRegistrationDTO } from 'mysterium-tequilapi/lib/dto/identity-registration/identity-registration'
import mainStoreFactory from '../../../../src/renderer/store/modules/main'
import EmptyTequilapiClientMock from '../store/modules/empty-tequilapi-client-mock'
import CountryImageResolver from '../../../../src/app/countries/unknown-country-reporter'
import FeatureToggle from '../../../../src/app/features/feature-toggle'
import { DurationFormatter } from '../../../../src/libraries/formatters/duration-formatter'

describe('Vpn', () => {
  let vpnWrapper
  let fakeMessageBus
  let bugReporterMock

  function mountVpn (paymentsEnabled = true) {
    const vue = createLocalVue()
    vue.use(Vuex)
    fakeMessageBus = new FakeMessageBus()
    const startupEventTracker = new StartupEventTracker(new MockEventSender())
    const communication = buildRendererCommunication(fakeMessageBus)
    const dependencies = new DIContainer(vue)
    dependencies.constant('rendererCommunication', communication)
    dependencies.constant('bugReporter', bugReporterMock)
    dependencies.constant('startupEventTracker', startupEventTracker)
    dependencies.constant('userSettingsStore', new UserSettingsProxy(communication))
    dependencies.constant('countryImageResolver', new CountryImageResolver(bugReporterMock))
    dependencies.constant('featureToggle', new FeatureToggle({ payments: paymentsEnabled }))
    dependencies.constant('getPaymentLink', () => {})
    dependencies.constant('durationFormatter', new DurationFormatter())

    const store = new Store({
      getters: {
        connection () {},
        status () { return 'NotConnected' },
        ip () {},
        errorMessage () {},
        showError () {}
      },
      modules: {
        main: mainStoreFactory(new EmptyTequilapiClientMock(), new MockEventSender()),
        identity: identityStoreFactory(bugReporterMock, communication)
      }
    })

    return mount(Vpn, {
      localVue: vue,
      store
    })
  }

  describe('when payments are enabled', () => {
    beforeEach(() => {
      bugReporterMock = new BugReporterMock()
      vpnWrapper = mountVpn()
    })

    it('mounts', () => {
      expect(vpnWrapper).to.be.ok
    })

    describe('.fetchCountries', () => {
      it('it shows error when empty proposal list is received', async () => {
        fakeMessageBus.triggerOn(messages.COUNTRY_UPDATE, [])
        vpnWrapper.vm.fetchCountries()

        expect(bugReporterMock.infoMessages[0].message).to.eql('Renderer received empty countries list')
      })
    })

    it('renders ID icon when no registration state is set', async () => {
      expect(vpnWrapper.findAll('.identity-button')).to.have.lengthOf(1)
    })

    it('renders ID icon when identity becomes unregistered', () => {
      const registration: IdentityRegistrationDTO = { registered: false }
      vpnWrapper.vm.$store.commit(types.SET_IDENTITY_REGISTRATION, registration)
      expect(vpnWrapper.findAll('.identity-button')).to.have.lengthOf(1)
      expect(vpnWrapper.findAll('.identity-button--registered')).to.have.lengthOf(0)
      expect(vpnWrapper.findAll('.identity-button--unregistered')).to.have.lengthOf(1)
    })

    it('renders ID icon when identity becomes registered', () => {
      const registration: IdentityRegistrationDTO = { registered: true }
      vpnWrapper.vm.$store.commit(types.SET_IDENTITY_REGISTRATION, registration)
      expect(vpnWrapper.findAll('.identity-button')).to.have.lengthOf(1)
      expect(vpnWrapper.findAll('.identity-button--registered')).to.have.lengthOf(1)
      expect(vpnWrapper.findAll('.identity-button--unregistered')).to.have.lengthOf(0)
    })
  })

  describe('when payments are disabled', () => {
    beforeEach(() => {
      bugReporterMock = new BugReporterMock()
      vpnWrapper = mountVpn(false)
    })

    it('does not render ID icon when payments feature disabled', async () => {
      expect(vpnWrapper.findAll('.identity-button')).to.have.lengthOf(0)
    })
  })
})
