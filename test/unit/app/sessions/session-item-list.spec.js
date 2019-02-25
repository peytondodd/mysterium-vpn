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

import { beforeEach, describe, expect, it } from '../../../helpers/dependencies'
import { SessionItemList } from '../../../../src/app/sessions/session-item-list'
import EmptyTequilapiClientMock from '../../renderer/store/modules/empty-tequilapi-client-mock'
import { SessionDTO } from 'mysterium-tequilapi/lib/dto/session'
import { TimeFormatter } from '../../../../src/libraries/time-formatter'

class SessionListTequilapiClientMock extends EmptyTequilapiClientMock {
  mockSessions: SessionDTO[] = []

  async sessionsList (): Promise<SessionDTO[]> {
    return this.mockSessions
  }
}

describe('SessionItemList', () => {
  let list: SessionItemList
  let client: SessionListTequilapiClientMock

  beforeEach(() => {
    client = new SessionListTequilapiClientMock()
    const timeFormatter = new TimeFormatter(0)
    list = new SessionItemList(client, timeFormatter)
  })

  describe('.getItems', () => {
    it('returns session items sorted by session start', async () => {
      client.mockSessions = [
        {
          sessionId: 'mock session 1',
          providerId: 'mock provider 1',
          providerCountry: 'mock provider country 1',
          dateStarted: '2019-02-14T09:04:15Z',
          bytesSent: 10000,
          bytesReceived: 20000,
          duration: 100
        },
        {
          sessionId: 'mock session 2',
          providerId: 'mock provider 2',
          providerCountry: 'mock provider country 2',
          dateStarted: '2019-02-14T11:04:15Z',
          bytesSent: 100,
          bytesReceived: 200,
          duration: 200
        }
      ]

      expect(await list.fetchItems()).to.eql([
        {
          id: 'mock session 2',
          countryCode: 'mock provider country 2',
          identity: 'mock provider 2',
          startDate: '14/02/2019',
          startTime: '11:04:15',
          // TODO: investigate whether "Bytes" unit string isn't a bug
          sent: { amount: '100.00', units: 'Bytes' },
          received: { amount: '200.00', units: 'Bytes' },
          duration: '00:03:20'
        },
        {
          id: 'mock session 1',
          countryCode: 'mock provider country 1',
          identity: 'mock provider 1',
          startDate: '14/02/2019',
          startTime: '09:04:15',
          sent: { amount: '9.77', units: 'KB' },
          received: { amount: '19.53', units: 'KB' },
          duration: '00:01:40'
        }
      ])
    })

    it('returns sessions with unknown time format at the end', async () => {
      client.mockSessions = [
        {
          sessionId: 'mock session 1',
          providerId: 'mock provider 1',
          providerCountry: 'mock provider country 1',
          dateStarted: '11:49',
          bytesSent: 10000,
          bytesReceived: 20000,
          duration: 100
        },
        {
          sessionId: 'mock session 2',
          providerId: 'mock provider 2',
          providerCountry: 'mock provider country 2',
          dateStarted: '2019-02-14T11:04:15Z',
          bytesSent: 100,
          bytesReceived: 200,
          duration: 200
        }
      ]

      expect(await list.fetchItems()).to.eql([
        {
          id: 'mock session 2',
          countryCode: 'mock provider country 2',
          identity: 'mock provider 2',
          startDate: '14/02/2019',
          startTime: '11:04:15',
          sent: { amount: '100.00', units: 'Bytes' },
          received: { amount: '200.00', units: 'Bytes' },
          duration: '00:03:20'
        },
        {
          id: 'mock session 1',
          countryCode: 'mock provider country 1',
          identity: 'mock provider 1',
          startDate: null,
          startTime: null,
          sent: { amount: '9.77', units: 'KB' },
          received: { amount: '19.53', units: 'KB' },
          duration: '00:01:40'
        }
      ])
    })
  })
})
