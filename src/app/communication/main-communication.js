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
import IdentityRegistrationDTO from 'mysterium-tequilapi/lib/dto/identity-registration'
import type { UserSettings } from '../user-settings/user-settings'
import { MessageReceiver } from './message-receiver'
import { MessageSender } from './message-sender'

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
    connectionStatusChangedReceiver: transports.connectionStatusChanged.buildReceiver(),
    connectionRequestSender: transports.connectionRequest.buildSender(),
    connectionCancelSender: transports.connectionCancel.buildSender(),
    reconnectRequestSender: transports.reconnectRequest.buildSender(),

    mysteriumClientReadySender: transports.mysteriumClientReady.buildSender(),
    currentIdentityChangedReceiver: transports.currentIdentityChanged.buildReceiver(),

    termsRequestedSender: transports.termsRequested.buildSender(),
    termsAnsweredReceiver: transports.termsAnswered.buildReceiver(),
    termsAcceptedSender: transports.termsAccepted.buildSender(),

    rendererBootedReceiver: transports.rendererBooted.buildReceiver(),
    rendererShowErrorSender: transports.rendererShowError.buildSender(),

    healthcheckUpSender: transports.healthcheckUp.buildSender(),
    healthcheckDownSender: transports.healthcheckDown.buildSender(),

    proposalsUpdateReceiver: transports.proposalsUpdate.buildReceiver(),
    countryUpdateSender: transports.countryUpdate.buildSender(),

    identityRegistrationSender: transports.identityRegistration.buildSender(),

    toggleFavoriteProviderReceiver: transports.toggleFavoriteProvider.buildReceiver(),
    showDisconnectNotificationReceiver: transports.showDisconnectNotification.buildReceiver(),

    userSettingsReceiver: transports.userSettings.buildReceiver(),
    userSettingsSender: transports.userSettings.buildSender(),
    userSettingsRequestReceiver: transports.userSettingsRequest.buildReceiver(),
    userSettingsUpdateReceiver: transports.userSettingsUpdate.buildReceiver()
  }
}
