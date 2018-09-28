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
import type { MessageBus } from './message-bus'
import { buildMessageTransports } from './message-transport'
import type {
  AppErrorDTO,
  ConnectionStatusChangeDTO,
  CountriesDTO, CurrentIdentityChangeDTO, FavoriteProviderDTO,
  RequestConnectionDTO, RequestTermsDTO,
  TermsAnsweredDTO
} from './dto'
import IdentityRegistrationDTO from 'mysterium-tequilapi/lib/dto/identity-registration'
import type { MessageReceiver, MessageSender } from './message-transport'
import type { UserSettings } from '../user-settings/user-settings'

export type RendererCommunication = {
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

export function buildRendererCommunication (messageBus: MessageBus): RendererCommunication {
  const transports = buildMessageTransports(messageBus)
  return {
    connectionStatusChangedSender: transports.connectionStatusChanged,
    connectionRequestReceiver: transports.connectionRequest,
    connectionCancelReceiver: transports.connectionCancel,
    reconnectRequestReceiver: transports.reconnectRequest,

    mysteriumClientReadyReceiver: transports.mysteriumClientReady,
    currentIdentityChangedSender: transports.currentIdentityChanged,

    termsRequestedReceiver: transports.termsRequested,
    termsAnsweredSender: transports.termsAnswered,
    termsAcceptedReceiver: transports.termsAccepted,

    rendererBootedSender: transports.rendererBooted,
    rendererShowErrorReceiver: transports.rendererShowError,

    healthcheckUpReceiver: transports.healthcheckUp,
    healthcheckDownReceiver: transports.healthcheckDown,

    proposalsUpdateSender: transports.proposalsUpdate,
    countryUpdateReceiver: transports.countryUpdate,

    identityRegistrationReceiver: transports.identityRegistration,

    toggleFavoriteProviderSender: transports.toggleFavoriteProvider,
    showDisconnectNotificationSender: transports.showDisconnectNotification,

    userSettingsSender: transports.userSettings,
    userSettingsReceiver: transports.userSettings,
    userSettingsRequestSender: transports.userSettingsRequest,
    userSettingsUpdateSender: transports.userSettingsUpdate
  }
}
