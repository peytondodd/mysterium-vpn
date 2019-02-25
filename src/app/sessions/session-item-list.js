/*
 * Copyright (C) 2019 The "mysteriumnetwork/mysterium-vpn" Authors.
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

import { TequilapiClient } from 'mysterium-tequilapi/lib/client'
import { TimeFormatter } from '../../libraries/formatters/time-formatter'
import { SessionDTO } from 'mysterium-tequilapi/lib/dto/session'
import type { SessionItem } from './session-item'
import { DurationFormatter } from '../../libraries/formatters/duration-formatter'
import { BytesFormatter } from '../../libraries/formatters/bytes-formatter'

export class SessionItemList {
  _client: TequilapiClient
  _timeFormatter: TimeFormatter
  _durationFormatter: DurationFormatter
  _bytesFormatter: BytesFormatter

  constructor (
    client: TequilapiClient,
    timeFormatter: TimeFormatter,
    durationFormatter: DurationFormatter,
    bytesFormatter: BytesFormatter) {
    this._client = client
    this._timeFormatter = timeFormatter
    this._durationFormatter = durationFormatter
    this._bytesFormatter = bytesFormatter
  }

  async fetchItems (): Promise<SessionItem[]> {
    const sessions = await this._client.sessionsList()
    sessions.sort((a, b) => this._compareSessions(a, b))
    return sessions.map(session => this._sessionDTOToSessionItem(session))
  }

  _compareSessions (a: SessionDTO, b: SessionDTO): number {
    const aDate = this._parseDate(a.dateStarted)
    const bDate = this._parseDate(b.dateStarted)

    if (aDate == null && bDate == null) {
      return 0
    }
    if (aDate == null) {
      return 1
    }
    if (bDate == null) {
      return -1
    }

    if (aDate < bDate) {
      return 1
    }
    if (aDate > bDate) {
      return -1
    }
    return 0
  }

  _parseDate (dateString: string): ?Date {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return null
    }

    return date
  }

  _sessionDTOToSessionItem (session: SessionDTO): SessionItem {
    const date = this._parseDate(session.dateStarted)
    return {
      id: session.sessionId,
      countryCode: session.providerCountry,
      identity: session.providerId,
      startDate: date != null ? this._timeFormatter.formatDate(date) : null,
      startTime: date != null ? this._timeFormatter.formatTime(date) : null,
      sent: this._bytesFormatter.formatOrDefault(session.bytesSent),
      received: this._bytesFormatter.formatOrDefault(session.bytesReceived),
      duration: this._durationFormatter.formatOrDefault(session.duration)
    }
  }
}
