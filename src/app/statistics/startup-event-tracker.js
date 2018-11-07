/*
 * Copyright (C) 2017 The "mysteriumnetwork/mysterium-vpn" Authors.
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

import os from 'os'
import type { EventSender } from './event-sender'
import osName from 'os-name'
import EVENT_NAMES from './event-names'

/**
 * Sends startup event.
 */
class StartupEventTracker {
  _eventSender: EventSender

  constructor (eventSender: EventSender) {
    this._eventSender = eventSender
  }

  async sendAppStartEvent () {
    await this._eventSender.send(EVENT_NAMES.APP_START, {})
  }

  async sendAppStartSuccessEvent () {
    await this._eventSender.send(EVENT_NAMES.APP_START_SUCCESS, {})
  }

  async sendRuntimeEnvironmentDetails (identity: string) {
    const context = {
      platform: os.platform(),
      osName: osName(os.platform(), os.release()),
      osRelease: os.release(),
      identity
    }
    await this._eventSender.send(EVENT_NAMES.STARTUP, context)
  }
}

export default StartupEventTracker
