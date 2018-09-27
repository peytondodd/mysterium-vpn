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
import { buildMessageTransports } from './message-transport'
import type {
  AppErrorDTO,
  ConnectionStatusChangeDTO,
  CountriesDTO, CurrentIdentityChangeDTO, FavoriteProviderDTO,
  RequestConnectionDTO, RequestTermsDTO,
  TermsAnsweredDTO
} from '../dto'
import IdentityRegistrationDTO from 'mysterium-tequilapi/lib/dto/identity-registration'
import type { MessageReceiver, MessageSender } from './message-transport'
import type { UserSettings } from '../../user-settings/user-settings'

export type RendererTransport = {
  connectionStatusChangedSender: MessageSender<ConnectionStatusChangeDTO>,
  connectionRequestReceiver: MessageReceiver<RequestConnectionDTO>,
  connectionCancelReceiver: MessageReceiver<void>,
  reconnectRequestReceiver: MessageReceiver<void>,

  mysteriumClientReadyReceiver: MessageReceiver<void>,
  currentIdentityChangedSender: MessageSender<CurrentIdentityChangeDTO>,

  termsRequestedReceiver: MessageReceiver<RequestTermsDTO>,
  termsAnsweredSender: MessageSender<TermsAnsweredDTO>,
  termsAcceptedReceiver: MessageReceiver<void>,

  rendererBootedSender: MessageSender<void>,
  rendererShowErrorReceiver: MessageReceiver<AppErrorDTO>,

  healthcheckUpReceiver: MessageReceiver<void>,
  healthcheckDownReceiver: MessageReceiver<void>,

  proposalsUpdateSender: MessageSender<void>,
  countryUpdateReceiver: MessageReceiver<CountriesDTO>,

  identityRegistrationReceiver: MessageReceiver<IdentityRegistrationDTO>,

  toggleFavoriteProviderSender: MessageSender<FavoriteProviderDTO>,
  showDisconnectNotificationSender: MessageSender<boolean>,

  userSettingsSender: MessageSender<UserSettings>,
  userSettingsReceiver: MessageReceiver<UserSettings>,
  userSettingsRequestSender: MessageSender<void>,
  userSettingsUpdateSender: MessageSender<UserSettings>
}

export function buildRendererTransport (messageBus: MessageBus): RendererTransport {
  const messages = buildMessageTransports(messageBus)
  return {
    connectionStatusChangedSender: messages.connectionStatusChanged,
    connectionRequestReceiver: messages.connectionRequest,
    connectionCancelReceiver: messages.connectionCancel,
    reconnectRequestReceiver: messages.reconnectRequest,

    mysteriumClientReadyReceiver: messages.mysteriumClientReady,
    currentIdentityChangedSender: messages.currentIdentityChanged,

    termsRequestedReceiver: messages.termsRequested,
    termsAnsweredSender: messages.termsAnswered,
    termsAcceptedReceiver: messages.termsAccepted,

    rendererBootedSender: messages.rendererBooted,
    rendererShowErrorReceiver: messages.rendererShowError,

    healthcheckUpReceiver: messages.healthcheckUp,
    healthcheckDownReceiver: messages.healthcheckDown,

    proposalsUpdateSender: messages.proposalsUpdate,
    countryUpdateReceiver: messages.countryUpdate,

    identityRegistrationReceiver: messages.identityRegistration,

    toggleFavoriteProviderSender: messages.toggleFavoriteProvider,
    showDisconnectNotificationSender: messages.showDisconnectNotification,

    userSettingsSender: messages.userSettings,
    userSettingsReceiver: messages.userSettings,
    userSettingsRequestSender: messages.userSettingsRequest,
    userSettingsUpdateSender: messages.userSettingsUpdate
  }
}
