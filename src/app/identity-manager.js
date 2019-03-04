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

import type { IdentityDTO } from 'mysterium-tequilapi/lib/dto/identity'
import type { IdentityRegistrationDTO } from 'mysterium-tequilapi/lib/dto/identity-registration/identity-registration'
import type { TequilapiClient } from 'mysterium-tequilapi/lib/client'
import messages from './messages'
import Publisher from '../libraries/publisher'

const PASSWORD = ''

/**
 * Allows managing identities using TequilapiClient and persisting data in identities module.
 */
class IdentityManager {
  _tequilapi: TequilapiClient

  _identity: ?IdentityDTO = null
  _registration: ?IdentityRegistrationDTO

  _identityPublisher: Publisher<IdentityDTO> = new Publisher()
  _registrationPublisher: Publisher<IdentityRegistrationDTO> = new Publisher()
  _errorMessagePublisher: Publisher<string> = new Publisher()

  constructor (tequilapi: TequilapiClient) {
    this._tequilapi = tequilapi
  }

  async listIdentities (): Promise<Array<IdentityDTO>> {
    try {
      return await this._tequilapi.identitiesList()
    } catch (err) {
      this._showErrorMessage(messages.identityListFailed)
      throw err
    }
  }

  setCurrentIdentity (identity: IdentityDTO) {
    if (!identity.id) {
      throw new Error('Cannot set empty identity.')
    }

    this._identity = identity
    this._identityPublisher.publish(identity)
  }

  // TODO: unify naming
  onCurrentIdentityChange (callback: IdentityDTO => void) {
    this._identityPublisher.addSubscriber(callback)
  }

  setRegistration (registration: IdentityRegistrationDTO) {
    this._registration = registration
    this._registrationPublisher.publish(registration)
  }

  onRegistrationChange (subscriber: IdentityRegistrationDTO => any) {
    this._registrationPublisher.addSubscriber(subscriber)
  }

  async createIdentity (): Promise<IdentityDTO> {
    try {
      return await this._tequilapi.identityCreate(PASSWORD)
    } catch (err) {
      this._showErrorMessage(messages.identityCreateFailed)
      throw err
    }
  }

  async unlockCurrentIdentity (): Promise<void> {
    const currentIdentity = this._identity

    if (currentIdentity == null || !currentIdentity.id) {
      const message = 'Identity is not available'

      this._showErrorMessage(message)

      throw new Error(message)
    }

    try {
      await this._tequilapi.identityUnlock(currentIdentity.id, PASSWORD)
    } catch (err) {
      this._showErrorMessage(messages.identityUnlockFailed)
      throw err
    }
  }

  onErrorMessage (callback: string => void) {
    this._errorMessagePublisher.addSubscriber(callback)
  }

  // TODO: this class should not show errors in case VpnInitializer is run with multiple retries
  _showErrorMessage (message: string): void {
    this._errorMessagePublisher.publish(message)
  }
}

export default IdentityManager
