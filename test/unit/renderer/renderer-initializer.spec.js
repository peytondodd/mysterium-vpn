/*
 * Copyright (C) 2019 The "mysteriumnetwork/mysterium-vpn" Authors.
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

import { RendererInitializer } from '../../../src/renderer/renderer-initializer'
import { buildRendererCommunication } from '../../../src/app/communication/renderer-communication'
import FakeMessageBus from '../../helpers/fake-message-bus'
import BugReporterMock from '../../helpers/bug-reporter-mock'
import EmptyTequilapiClientMock from './store/modules/empty-tequilapi-client-mock'
import TequilapiRegistrationFetcher from '../../../src/app/data-fetchers/tequilapi-registration-fetcher'
import IdentityManager from '../../../src/app/identity-manager'
import type { IdentityRegistrationDTO } from 'mysterium-tequilapi/lib/dto/identity-registration/identity-registration'
import { expect } from '../../helpers/dependencies'
import { nextTick } from '../../helpers/utils'

class MockStore {
  dispatch () {
  }
}

class InitializerTequilapiClientMock extends EmptyTequilapiClientMock {
  mockRegistration: IdentityRegistrationDTO = { registered: true }

  async identityRegistration (id: string): Promise<IdentityRegistrationDTO> {
    return this.mockRegistration
  }
}

describe('RendererInitializer', () => {
  let initializer: RendererInitializer

  beforeEach(() => {
    initializer = new RendererInitializer()
  })

  describe('.initialize', () => {
    it('fetches initializes identity registration once identity becomes available', async () => {
      const communication = buildRendererCommunication(new FakeMessageBus())
      const tequilapiClient = new InitializerTequilapiClientMock()
      const identityManager = new IdentityManager(tequilapiClient)
      const bugReporter = new BugReporterMock()
      const registrationFetcher = new TequilapiRegistrationFetcher(tequilapiClient)

      let registration = null
      identityManager.onRegistrationChange(reg => {
        registration = reg
      })

      initializer.initialize(communication, bugReporter, identityManager, registrationFetcher, new MockStore(), null)
      await identityManager.unlockIdentity({ id: 'test identity' })
      await nextTick()

      expect(registration).to.eql(tequilapiClient.mockRegistration)
    })
  })
})
