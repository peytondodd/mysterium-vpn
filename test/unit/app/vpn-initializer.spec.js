/*
 * Copyright (C) 2017 The "mysteriumnetwork/mysterium-vpn" Authors.
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

import VpnInitializer from '../../../src/app/vpn-initializer'
import { beforeEach, describe, expect, it } from '../../helpers/dependencies'
import type { IdentityDTO } from 'mysterium-tequilapi/lib/dto/identity'
import { capturePromiseError } from '../../helpers/utils'
import IdentityManager from '../../../src/app/identity-manager'
import messages from '../../../src/app/messages'

class MockTequilapiManipulator {
  _tequilapi: Object

  constructor (version: string) {
    const healtcheckResponse = {
      version: {
        commit: version
      }
    }

    this._tequilapi = {
      healthCheck: () => Promise.resolve(healtcheckResponse)
    }
  }

  // TODO: return TequilapiClient interface
  getTequilapi (): Object {
    return this._tequilapi
  }

  tequilapiMockIdentitiesList (identities: Array<IdentityDTO>) {
    this._tequilapi.identitiesList = () => Promise.resolve(identities)
  }

  tequilapiMockIdentityCreate (identity: IdentityDTO) {
    this._tequilapi.identityCreate = () => Promise.resolve(identity)
  }

  tequilapiMockIdentityUnlock (callback: ?(() => void) = null) {
    this._tequilapi.identityUnlock = () => {
      if (callback) {
        callback()
      }
      return Promise.resolve()
    }
  }

  tequilapiMockIdentitiesListError (error: Error) {
    this._tequilapi.identitiesList = () => Promise.reject(error)
  }

  tequilapiMockIdentityCreateError (error: Error) {
    this._tequilapi.identityCreate = () => Promise.reject(error)
  }

  tequilapiMockIdentityUnlockError (error: Error) {
    this._tequilapi.identityUnlock = () => Promise.reject(error)
  }
}

describe('VpnInitializer', () => {
  describe('.initialize', () => {
    let tequilapiManipulator
    let tequilapi

    const updateClientVersion: () => Promise<void> = async () => {}

    beforeEach(() => {
      tequilapiManipulator = new MockTequilapiManipulator('test version')
      tequilapi = tequilapiManipulator.getTequilapi()
    })

    describe('with some identities', () => {
      const mockIdentity: IdentityDTO = { id: '0xC001FACE' }

      beforeEach(() => {
        tequilapiManipulator.tequilapiMockIdentitiesList([mockIdentity])
        tequilapiManipulator.tequilapiMockIdentityUnlock()
      })

      it('stores first fetched identity', async () => {
        const identityManager = new IdentityManager(tequilapi)

        let identity = null
        identityManager.onCurrentIdentityChange(id => { identity = id })

        await new VpnInitializer(tequilapi).initialize(identityManager, updateClientVersion)

        expect(identity).to.eql(mockIdentity)
      })
    })

    describe('with no identities', () => {
      const mockCreatedIdentity: IdentityDTO = { id: '0xC001FACY' }
      let identityUnlocked: boolean

      beforeEach(() => {
        tequilapiManipulator.tequilapiMockIdentitiesList([])
        tequilapiManipulator.tequilapiMockIdentityCreate(mockCreatedIdentity)

        identityUnlocked = false
        tequilapiManipulator.tequilapiMockIdentityUnlock(() => {
          identityUnlocked = true
        })
      })

      it('creates and unlocks identity', async () => {
        const identityManager = new IdentityManager(tequilapi)
        let identity = null
        identityManager.onCurrentIdentityChange(id => { identity = id })

        await new VpnInitializer(tequilapi).initialize(identityManager, updateClientVersion)

        expect(identity).to.eql(mockCreatedIdentity)
        expect(identityUnlocked).to.eql(true)
      })
    })

    describe('identities error handling', () => {
      const mockError = new Error('Mock error')

      describe('when identity listing fails', () => {
        beforeEach(() => {
          tequilapiManipulator.tequilapiMockIdentitiesListError(mockError)
        })

        it('throws exception and shows error', async () => {
          const vpnInitializer = new VpnInitializer(tequilapi)

          const identityManager = new IdentityManager(tequilapi)
          let errorMessage = null
          identityManager.onErrorMessage(msg => { errorMessage = msg })

          const err = await capturePromiseError(vpnInitializer.initialize(identityManager, updateClientVersion))

          expect(err).to.eql(mockError)
          expect(errorMessage).to.eql(messages.identityListFailed)
        })
      })

      describe('when identity creation fails', () => {
        beforeEach(() => {
          tequilapiManipulator.tequilapiMockIdentitiesList([])
          tequilapiManipulator.tequilapiMockIdentityCreateError(mockError)
        })

        it('throws exception and shows error message', async () => {
          const identityManager = new IdentityManager(tequilapi)
          let errorMessage = null
          identityManager.onErrorMessage(msg => { errorMessage = msg })

          const vpnInitializer = new VpnInitializer(tequilapi)
          const err = await capturePromiseError(vpnInitializer.initialize(identityManager, updateClientVersion))

          expect(err).to.be.an('error')
          expect(errorMessage).to.eql(messages.identityCreateFailed)
        })
      })

      describe('when identity unlocking fails', () => {
        beforeEach(() => {
          tequilapiManipulator.tequilapiMockIdentitiesList([{ id: '0xC001FACE' }])
          tequilapiManipulator.tequilapiMockIdentityUnlockError(mockError)
        })

        it('throws exception and shows error message', async () => {
          const identityManager = new IdentityManager(tequilapi)
          let errorMessage = null
          identityManager.onErrorMessage(msg => { errorMessage = msg })

          const vpnInitializer = new VpnInitializer(tequilapi)
          const err = await capturePromiseError(vpnInitializer.initialize(identityManager, updateClientVersion))

          expect(err).to.be.an('error')
          expect(errorMessage).to.eql(messages.identityUnlockFailed)
        })
      })
    })
  })
})
