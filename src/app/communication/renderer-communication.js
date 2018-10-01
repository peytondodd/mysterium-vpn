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
    connectionStatusChangedSender: transports.connectionStatusChanged.buildSender(),
    connectionRequestReceiver: transports.connectionRequest.buildReceiver(),
    connectionCancelReceiver: transports.connectionCancel.buildReceiver(),
    reconnectRequestReceiver: transports.reconnectRequest.buildReceiver(),

    mysteriumClientReadyReceiver: transports.mysteriumClientReady.buildReceiver(),
    currentIdentityChangedSender: transports.currentIdentityChanged.buildSender(),

    termsRequestedReceiver: transports.termsRequested.buildReceiver(),
    termsAnsweredSender: transports.termsAnswered.buildSender(),
    termsAcceptedReceiver: transports.termsAccepted.buildReceiver(),

    rendererBootedSender: transports.rendererBooted.buildSender(),
    rendererShowErrorReceiver: transports.rendererShowError.buildReceiver(),

    healthcheckUpReceiver: transports.healthcheckUp.buildReceiver(),
    healthcheckDownReceiver: transports.healthcheckDown.buildReceiver(),

    proposalsUpdateSender: transports.proposalsUpdate.buildSender(),
    countryUpdateReceiver: transports.countryUpdate.buildReceiver(),

    identityRegistrationReceiver: transports.identityRegistration.buildReceiver(),

    toggleFavoriteProviderSender: transports.toggleFavoriteProvider.buildSender(),
    showDisconnectNotificationSender: transports.showDisconnectNotification.buildSender(),

    userSettingsSender: transports.userSettings.buildSender(),
    userSettingsReceiver: transports.userSettings.buildReceiver(),
    userSettingsRequestSender: transports.userSettingsRequest.buildSender(),
    userSettingsUpdateSender: transports.userSettingsUpdate.buildSender()
  }
}
