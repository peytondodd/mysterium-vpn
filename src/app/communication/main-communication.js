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
  CurrentIdentityChangeDTO,
  FavoriteProviderDTO,
  RequestConnectionDTO,
  RequestTermsDTO,
  TermsAnsweredDTO
} from './dto'
import IdentityRegistrationDTO from 'mysterium-tequilapi/lib/dto/identity-registration'
import type { UserSettings } from '../user-settings/user-settings'
import { MessageReceiver } from './message-receiver'
import { MessageSender } from './message-sender'

export type MainCommunication = {
  connectionStatusChanged: MessageReceiver<ConnectionStatusChangeDTO>,
  connectionRequest: MessageSender<RequestConnectionDTO>,
  connectionCancel: MessageSender<void>,
  reconnectRequest: MessageSender<void>,

  currentIdentityChanged: MessageReceiver<CurrentIdentityChangeDTO>,

  termsRequested: MessageSender<RequestTermsDTO>,
  termsAnswered: MessageReceiver<TermsAnsweredDTO>,
  termsAccepted: MessageSender<void>,

  rendererBooted: MessageReceiver<void>,
  rendererShowError: MessageSender<AppErrorDTO>,

  healthcheckUp: MessageSender<void>,
  healthcheckDown: MessageSender<void>,

  proposalsUpdate: MessageReceiver<void>,
  countryUpdate: MessageSender<CountriesDTO>,

  identityRegistration: MessageSender<IdentityRegistrationDTO>,

  toggleFavoriteProvider: MessageReceiver<FavoriteProviderDTO>,
  showDisconnectNotification: MessageReceiver<boolean>,

  userSettingsReceiver: MessageReceiver<UserSettings>,
  userSettingsSender: MessageSender<UserSettings>,
  userSettingsRequest: MessageReceiver<void>,
  userSettingsUpdate: MessageReceiver<UserSettings>
}

export function buildMainCommunication (messageBus: MessageBus): MainCommunication {
  const transports = buildMessageTransports(messageBus)
  return {
    connectionStatusChanged: transports.connectionStatusChanged.buildReceiver(),
    connectionRequest: transports.connectionRequest.buildSender(),
    connectionCancel: transports.connectionCancel.buildSender(),
    reconnectRequest: transports.reconnectRequest.buildSender(),

    currentIdentityChanged: transports.currentIdentityChanged.buildReceiver(),

    termsRequested: transports.termsRequested.buildSender(),
    termsAnswered: transports.termsAnswered.buildReceiver(),
    termsAccepted: transports.termsAccepted.buildSender(),

    rendererBooted: transports.rendererBooted.buildReceiver(),
    rendererShowError: transports.rendererShowError.buildSender(),

    healthcheckUp: transports.healthcheckUp.buildSender(),
    healthcheckDown: transports.healthcheckDown.buildSender(),

    proposalsUpdate: transports.proposalsUpdate.buildReceiver(),
    countryUpdate: transports.countryUpdate.buildSender(),

    identityRegistration: transports.identityRegistration.buildSender(),

    toggleFavoriteProvider: transports.toggleFavoriteProvider.buildReceiver(),
    showDisconnectNotification: transports.showDisconnectNotification.buildReceiver(),

    userSettingsReceiver: transports.userSettings.buildReceiver(),
    userSettingsSender: transports.userSettings.buildSender(),
    userSettingsRequest: transports.userSettingsRequest.buildReceiver(),
    userSettingsUpdate: transports.userSettingsUpdate.buildReceiver()
  }
}
