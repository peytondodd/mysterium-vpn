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
import type { UserSettings } from '../user-settings/user-settings'
import { MessageReceiver } from './message-receiver'
import { MessageSender } from './message-sender'

export type RendererCommunication = {
  connectionStatusChanged: MessageSender<ConnectionStatusChangeDTO>,
  connectionRequest: MessageReceiver<RequestConnectionDTO>,
  connectionCancel: MessageReceiver<void>,
  reconnectRequest: MessageReceiver<void>,

  currentIdentityChanged: MessageSender<CurrentIdentityChangeDTO>,

  termsRequested: MessageReceiver<RequestTermsDTO>,
  termsAnswered: MessageSender<TermsAnsweredDTO>,
  termsAccepted: MessageReceiver<void>,

  rendererBooted: MessageSender<void>,
  rendererShowError: MessageReceiver<AppErrorDTO>,

  healthcheckUp: MessageReceiver<void>,
  healthcheckDown: MessageReceiver<void>,

  proposalsUpdate: MessageSender<void>,
  countryUpdate: MessageReceiver<CountriesDTO>,

  identityRegistration: MessageReceiver<IdentityRegistrationDTO>,

  toggleFavoriteProvider: MessageSender<FavoriteProviderDTO>,
  showDisconnectNotification: MessageSender<boolean>,

  userSettingsSender: MessageSender<UserSettings>,
  userSettingsReceiver: MessageReceiver<UserSettings>,
  userSettingsRequest: MessageSender<void>,
  userSettingsUpdate: MessageSender<UserSettings>
}

export function buildRendererCommunication (messageBus: MessageBus): RendererCommunication {
  const transports = buildMessageTransports(messageBus)
  return {
    connectionStatusChanged: transports.connectionStatusChanged.buildSender(),
    connectionRequest: transports.connectionRequest.buildReceiver(),
    connectionCancel: transports.connectionCancel.buildReceiver(),
    reconnectRequest: transports.reconnectRequest.buildReceiver(),

    currentIdentityChanged: transports.currentIdentityChanged.buildSender(),

    termsRequested: transports.termsRequested.buildReceiver(),
    termsAnswered: transports.termsAnswered.buildSender(),
    termsAccepted: transports.termsAccepted.buildReceiver(),

    rendererBooted: transports.rendererBooted.buildSender(),
    rendererShowError: transports.rendererShowError.buildReceiver(),

    healthcheckUp: transports.healthcheckUp.buildReceiver(),
    healthcheckDown: transports.healthcheckDown.buildReceiver(),

    proposalsUpdate: transports.proposalsUpdate.buildSender(),
    countryUpdate: transports.countryUpdate.buildReceiver(),

    identityRegistration: transports.identityRegistration.buildReceiver(),

    toggleFavoriteProvider: transports.toggleFavoriteProvider.buildSender(),
    showDisconnectNotification: transports.showDisconnectNotification.buildSender(),

    userSettingsSender: transports.userSettings.buildSender(),
    userSettingsReceiver: transports.userSettings.buildReceiver(),
    userSettingsRequest: transports.userSettingsRequest.buildSender(),
    userSettingsUpdate: transports.userSettingsUpdate.buildSender()
  }
}
