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

import type { MessageBus } from '../message-bus'
import type {
  AppErrorDTO,
  ConnectionStatusChangeDTO,
  CountriesDTO,
  CurrentIdentityChangeDTO, FavoriteProviderDTO,
  RequestConnectionDTO, RequestTermsDTO,
  TermsAnsweredDTO
} from '../dto'
import IdentityRegistrationDTO from 'mysterium-tequilapi/lib/dto/identity-registration'
import messages from '../messages'
import type { UserSettings } from '../../user-settings/user-settings'

export interface MessageSender<T> {
  send (data: T): void
}

export interface MessageReceiver<T> {
  on (callback: T => void): void,
  removeCallback (callback: T => void): void
}

/**
 * Sends and receives message using message bus.
 */
class MessageTransport<T> implements MessageSender<T>, MessageReceiver<T> {
  _channel: string
  _messageBus: MessageBus

  constructor (channel: string, messageBus: MessageBus) {
    this._channel = channel
    this._messageBus = messageBus
  }

  send (data: T) {
    this._messageBus.send(this._channel, data)
  }

  on (callback: T => void) {
    this._messageBus.on(this._channel, callback)
  }

  removeCallback (callback: T => void) {
    this._messageBus.removeCallback(this._channel, callback)
  }
}

export default MessageTransport

export function buildMessageTransports (messageBus: MessageBus) {
  const build = (channel: string): MessageTransport<any> => {
    return new MessageTransport(channel, messageBus)
  }
  const connectionStatusChanged: MessageTransport<ConnectionStatusChangeDTO> = build(messages.CONNECTION_STATUS_CHANGED)
  const connectionRequest: MessageTransport<RequestConnectionDTO> = build(messages.CONNECTION_REQUEST)
  const connectionCancel: MessageTransport<void> = build(messages.CONNECTION_CANCEL)
  const reconnectRequest: MessageTransport<void> = build(messages.RECONNECT_REQUEST)

  const mysteriumClientReady: MessageTransport<void> = build(messages.MYSTERIUM_CLIENT_READY)
  const currentIdentityChanged: MessageTransport<CurrentIdentityChangeDTO> = build(messages.CURRENT_IDENTITY_CHANGED)

  const termsRequested: MessageTransport<RequestTermsDTO> = build(messages.TERMS_REQUESTED)
  const termsAnswered: MessageTransport<TermsAnsweredDTO> = build(messages.TERMS_ANSWERED)
  const termsAccepted: MessageTransport<void> = build(messages.TERMS_ACCEPTED)

  const rendererBooted: MessageTransport<void> = build(messages.RENDERER_BOOTED)
  const rendererShowError: MessageTransport<AppErrorDTO> = build(messages.RENDERER_SHOW_ERROR)

  const healthcheckUp: MessageTransport<void> = build(messages.HEALTHCHECK_UP)
  const healthcheckDown: MessageTransport<void> = build(messages.HEALTHCHECK_DOWN)

  const proposalsUpdate: MessageTransport<void> = build(messages.PROPOSALS_UPDATE)
  const countryUpdate: MessageTransport<CountriesDTO> = build(messages.COUNTRY_UPDATE)

  const identityRegistration: MessageTransport<IdentityRegistrationDTO> = build(messages.IDENTITY_REGISTRATION)

  const toggleFavoriteProvider: MessageTransport<FavoriteProviderDTO> = build(messages.TOGGLE_FAVORITE_PROVIDER)
  const showDisconnectNotification: MessageTransport<boolean> = build(messages.SHOW_DISCONNECT_NOTIFICATION)

  const userSettings: MessageTransport<UserSettings> = build(messages.USER_SETTINGS)
  const userSettingsRequest: MessageTransport<void> = build(messages.USER_SETTINGS_REQUEST)
  const userSettingsUpdate: MessageTransport<UserSettings> = build(messages.USER_SETTINGS_UPDATE)

  return {
    connectionStatusChanged,
    connectionRequest,
    connectionCancel,
    reconnectRequest,

    mysteriumClientReady,
    currentIdentityChanged,

    termsRequested,
    termsAnswered,
    termsAccepted,

    rendererBooted,
    rendererShowError,

    healthcheckUp,
    healthcheckDown,

    proposalsUpdate,
    countryUpdate,

    identityRegistration,

    toggleFavoriteProvider,
    showDisconnectNotification,

    userSettings,
    userSettingsRequest,
    userSettingsUpdate
  }
}
