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
import type { ConnectionStatusChangeDTO, CountriesDTO, RequestConnectionDTO, TermsAnsweredDTO } from '../dto'
import type { MessageReceiver, MessageSender } from './message-transport'
import IdentityRegistrationDTO from 'mysterium-tequilapi/lib/dto/identity-registration'

export type MainTransport = {
  connectionStatusChangedReceiver: MessageReceiver<ConnectionStatusChangeDTO>,
  connectionRequestSender: MessageSender<RequestConnectionDTO>,
  connectionCancelSender: MessageSender<void>,
  reconnectRequestSender: MessageSender<void>,

  identityRegistrationSender: MessageSender<IdentityRegistrationDTO>,

  termsAnsweredReceiver: MessageReceiver<TermsAnsweredDTO>,
  countryUpdateSender: MessageSender<CountriesDTO>,
}

export function buildMainTransport (messageBus: MessageBus): MainTransport {
  const messages = buildMessageTransports(messageBus)
  return {
    connectionStatusChangedReceiver: messages.connectionStatusChanged,
    connectionRequestSender: messages.connectionRequest,
    connectionCancelSender: messages.connectionCancel,
    reconnectRequestSender: messages.reconnectRequest,

    identityRegistrationSender: messages.identityRegistration,

    termsAnsweredReceiver: messages.termsAnswered,
    countryUpdateSender: messages.countryUpdate
  }
}
