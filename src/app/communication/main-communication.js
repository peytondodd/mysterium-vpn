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
  CountriesDTO,
  CurrentIdentityChangeDTO, FavoriteProviderDTO,
  RequestConnectionDTO, RequestTermsDTO,
  TermsAnsweredDTO
} from './dto'
import type { MessageReceiver, MessageSender } from './message-transport'
import IdentityRegistrationDTO from 'mysterium-tequilapi/lib/dto/identity-registration'
import type { UserSettings } from '../user-settings/user-settings'

export type MainCommunication = {
  connectionStatusChangedReceiver: MessageReceiver<ConnectionStatusChangeDTO>,
  connectionRequestSender: MessageSender<RequestConnectionDTO>,
  connectionCancelSender: MessageSender<void>,
  reconnectRequestSender: MessageSender<void>,

  mysteriumClientReadySender: MessageSender<void>,
  currentIdentityChangedReceiver: MessageReceiver<CurrentIdentityChangeDTO>,

  termsRequestedSender: MessageSender<RequestTermsDTO>,
  termsAnsweredReceiver: MessageReceiver<TermsAnsweredDTO>,
  termsAcceptedSender: MessageSender<void>,

  rendererBootedReceiver: MessageReceiver<void>,
  rendererShowErrorSender: MessageSender<AppErrorDTO>,

  healthcheckUpSender: MessageSender<void>,
  healthcheckDownSender: MessageSender<void>,

  proposalsUpdateReceiver: MessageReceiver<void>,
  countryUpdateSender: MessageSender<CountriesDTO>,

  identityRegistrationSender: MessageSender<IdentityRegistrationDTO>,

  toggleFavoriteProviderReceiver: MessageReceiver<FavoriteProviderDTO>,
  showDisconnectNotificationReceiver: MessageReceiver<boolean>,

  userSettingsReceiver: MessageReceiver<UserSettings>,
  userSettingsSender: MessageSender<UserSettings>,
  userSettingsRequestReceiver: MessageReceiver<void>,
  userSettingsUpdateReceiver: MessageReceiver<UserSettings>
}

export function buildMainCommunication (messageBus: MessageBus): MainCommunication {
  const transports = buildMessageTransports(messageBus)
  return {
    connectionStatusChangedReceiver: transports.connectionStatusChanged,
    connectionRequestSender: transports.connectionRequest,
    connectionCancelSender: transports.connectionCancel,
    reconnectRequestSender: transports.reconnectRequest,

    mysteriumClientReadySender: transports.mysteriumClientReady,
    currentIdentityChangedReceiver: transports.currentIdentityChanged,

    termsRequestedSender: transports.termsRequested,
    termsAnsweredReceiver: transports.termsAnswered,
    termsAcceptedSender: transports.termsAccepted,

    rendererBootedReceiver: transports.rendererBooted,
    rendererShowErrorSender: transports.rendererShowError,

    healthcheckUpSender: transports.healthcheckUp,
    healthcheckDownSender: transports.healthcheckDown,

    proposalsUpdateReceiver: transports.proposalsUpdate,
    countryUpdateSender: transports.countryUpdate,

    identityRegistrationSender: transports.identityRegistration,

    toggleFavoriteProviderReceiver: transports.toggleFavoriteProvider,
    showDisconnectNotificationReceiver: transports.showDisconnectNotification,

    userSettingsReceiver: transports.userSettings,
    userSettingsSender: transports.userSettings,
    userSettingsRequestReceiver: transports.userSettingsRequest,
    userSettingsUpdateReceiver: transports.userSettingsUpdate
  }
}
