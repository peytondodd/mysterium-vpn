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

import type { MainCommunication } from '../../src/app/communication/main-communication'
import type {
  AppErrorDTO, ConnectionStatusChangeDTO, CurrentIdentityChangeDTO,
  RequestTermsDTO, RequestConnectionDTO, FavoriteProviderDTO
} from '../../src/app/communication/dto'
import type { UserSettings } from '../../src/app/user-settings/user-settings'
import IdentityRegistrationDTO from 'mysterium-tequilapi/lib/dto/identity-registration'

/**
 * Allows tracking method invocations.
 */
class FakeMainCommunication implements MainCommunication {
  _invokedMethods: Set<string> = new Set()
  _invokedMethodPayloads: Object = {}

  /**
   * Returns whether given instance method was invoked.
   *
   * @param method - method of this class to check
   * @returns {*|boolean}
   */
  wasInvoked (method: Function): boolean {
    return this._invokedMethods.has(method.name)
  }

  getLastPayload (method: Function): Array<any> {
    const payloads = this._getPayloads(method)
    return payloads[payloads.length - 1]
  }

  onRendererBooted (callback: () => void): void {
    this._registerMethod(this.onRendererBooted)
  }

  sendRendererShowErrorMessage (error: string): void {
    this._registerMethod(this.sendRendererShowErrorMessage, error)
  }

  sendRendererShowError (data: AppErrorDTO): void {
    this._registerMethod(this.sendRendererShowError, data)
  }

  sendMysteriumClientIsReady (): void {
    this._registerMethod(this.sendMysteriumClientIsReady)
  }

  sendMysteriumClientUp () {
    this._registerMethod(this.sendMysteriumClientUp)
  }

  sendMysteriumClientDown () {
    this._registerMethod(this.sendMysteriumClientDown)
  }

  sendRegistration (registration: IdentityRegistrationDTO): void {
    this._registerMethod(this.sendRegistration, registration)
  }

  sendConnectionCancelRequest () {
    this._registerMethod(this.sendConnectionCancelRequest)
  }

  sendConnectionRequest (data: RequestConnectionDTO) {
    this._registerMethod(this.sendConnectionRequest, data)
  }

  sendTermsRequest (data: RequestTermsDTO): void {
    this._registerMethod(this.sendTermsRequest, data)
  }

  sendTermsAccepted (): void {
    this._registerMethod(this.sendTermsAccepted)
  }

  sendUserSettings (data: UserSettings): void {
    this._registerMethod(this.sendUserSettings, data)
  }

  onConnectionStatusChange (callback: (ConnectionStatusChangeDTO) => void): void {
    this._registerMethod(this.onConnectionStatusChange)
  }

  onCurrentIdentityChange (callback: (CurrentIdentityChangeDTO) => void): void {
    this._registerMethod(this.onCurrentIdentityChange)
  }

  onProposalUpdateRequest (callback: () => void): void {
    this._registerMethod(this.onProposalUpdateRequest)
  }

  onUserSettingsRequest (callback: () => void): void {
    this._registerMethod(this.onUserSettingsRequest)
  }

  onUserSettingsUpdate (callback: (UserSettings) => void): void {
    this._registerMethod(this.onUserSettingsUpdate)
  }

  onCurrentIdentityChangeOnce (callback: (CurrentIdentityChangeDTO) => void): void {
    this._registerMethod(this.onCurrentIdentityChangeOnce, callback)
  }

  onToggleFavoriteProvider (callback: (FavoriteProviderDTO) => void): void {
    this._registerMethod(this.onToggleFavoriteProvider)
  }

  onUserSettingsShowDisconnectNotifications (callback: (boolean) => void): void {
    this._registerMethod(this.onUserSettingsShowDisconnectNotifications)
  }

  _registerMethod (method: Function, ...payload: Array<any>): void {
    this._invokedMethods.add(method.name)
    if (!this._invokedMethodPayloads[method.name]) {
      this._invokedMethodPayloads[method.name] = []
    }
    this._invokedMethodPayloads[method.name].push(payload)
  }

  _getPayloads (method: Function): Array<any> {
    return this._invokedMethodPayloads[method.name]
  }
}

export default FakeMainCommunication
