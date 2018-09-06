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
import type { State as IdentityState } from '../../../src/renderer/store/modules/identity'
import IdentityDTO from '../../../src/libraries/mysterium-tequilapi/dto/identity'
import types from '../../../src/renderer/store/types'
import { capturePromiseError } from '../../helpers/utils'
import IdentityManager from '../../../src/app/identity-manager'

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

  getTequilapi (): Object {
    return this._tequilapi
  }

  tequilapiMockIdentitiesList (identities: Array<IdentityDTO>) {
    this._tequilapi.identitiesList = () => Promise.resolve(identities)
  }

  tequilapiMockIdentityCreate (identity: IdentityDTO) {
    this._tequilapi.identityCreate = () => Promise.resolve(identity)
  }

  tequilapiMockIdentityUnlock () {
    this._tequilapi.identityUnlock = () => Promise.resolve()
  }

  tequilapiMockIdentitiesListError (error: Error) {
    this._tequilapi.identitiesList = () => Promise.reject(error)
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
      const mockIdentity = new IdentityDTO({ id: '0xC001FACE' })

      beforeEach(() => {
        tequilapiManipulator.tequilapiMockIdentitiesList([mockIdentity])
        tequilapiManipulator.tequilapiMockIdentityUnlock()
      })

      it('stores first fetched identity', async () => {
        let storedIdentity = null
        const commit = (...args: Array<any>) => {
          if (args.length === 2 && args[0] === types.SET_CURRENT_IDENTITY) {
            storedIdentity = args[1]
          }
        }
        const state: IdentityState = { current: null, unlocked: false }
        const identityManager = new IdentityManager(tequilapi, commit, state)
        await new VpnInitializer(tequilapi).initialize(identityManager, updateClientVersion)

        expect(storedIdentity).to.eql(mockIdentity)
      })
    })

    describe('with not identities', () => {
      const mockCreatedIdentity = new IdentityDTO({ id: '0xC001FACY' })

      beforeEach(() => {
        tequilapiManipulator.tequilapiMockIdentitiesList([])
        tequilapiManipulator.tequilapiMockIdentityCreate(mockCreatedIdentity)
        tequilapiManipulator.tequilapiMockIdentityUnlock()
      })

      it('creates and unlocks identity', async () => {
        let unlocked = false
        const commit = (...args: Array<any>) => {
          if (args.length === 2 && args[0] === types.SET_CURRENT_IDENTITY) {
            state.current = args[1]
          } else if (args.length === 1 && args[0] === types.IDENTITY_UNLOCK_SUCCESS) {
            unlocked = true
          }
        }
        const state: IdentityState = { current: null, unlocked: false }
        const identityManager = new IdentityManager(tequilapi, commit, state)
        await new VpnInitializer(tequilapi).initialize(identityManager, updateClientVersion)

        expect(state.current).to.eql(mockCreatedIdentity)
        expect(unlocked).to.be.true
      })
    })

    describe('identities error handling', () => {
      const mockError = new Error('Mock error')

      describe('identity listing failed', () => {
        beforeEach(() => {
          tequilapiManipulator.tequilapiMockIdentitiesListError(mockError)
        })

        it('throws exception', async () => {
          const commit = (...args: Array<any>) => {}
          const state: IdentityState = { current: null, unlocked: false }
          const vpnInitializer = new VpnInitializer(tequilapi)
          const identityManager = new IdentityManager(tequilapi, commit, state)
          const err = await capturePromiseError(vpnInitializer.initialize(identityManager, updateClientVersion))

          expect(err).to.eql(mockError)
        })
      })

      describe('identity unlocking failed', () => {
        beforeEach(() => {
          tequilapiManipulator.tequilapiMockIdentitiesList([new IdentityDTO({ id: '0xC001FACE' })])
          tequilapiManipulator.tequilapiMockIdentityUnlockError(mockError)
        })

        it('throws exception', async () => {
          const committed = []
          const commit = (...args: Array<any>) => {
            committed.push(args)
            if (args.length === 2 && args[0] === types.SET_CURRENT_IDENTITY) {
              state.current = args[1]
            }
          }
          const state: IdentityState = { current: null, unlocked: false }
          const identityManager = new IdentityManager(tequilapi, commit, state)
          await new VpnInitializer(tequilapi).initialize(identityManager, updateClientVersion)

          expect(committed[committed.length - 1]).to.eql([
            types.SHOW_ERROR,
            mockError
          ])
        })
      })
    })
  })
})
