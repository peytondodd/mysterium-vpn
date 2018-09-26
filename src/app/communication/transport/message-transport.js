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
import type { CountriesDTO, TermsAnsweredDTO } from '../dto'
import messages from '../messages'

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
  const termsAnswered: MessageTransport<TermsAnsweredDTO> = new MessageTransport('terms.answered', messageBus)
  const countryUpdate: MessageTransport<CountriesDTO> = new MessageTransport(messages.COUNTRY_UPDATE, messageBus)
  return {
    termsAnswered,
    countryUpdate
  }
}
