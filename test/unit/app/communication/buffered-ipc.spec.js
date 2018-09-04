/*
 * Copyright (C) 2018 The "MysteriumNetwork/mysterium-vpn" Authors.
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

import { describe, it, expect, beforeEach } from '../../../helpers/dependencies'
import MainBufferedIpc from '../../../../src/app/communication/ipc/main-buffered-ipc'
import BugReporterMock from '../../../helpers/bug-reporter-mock'
import type { IpcMessage } from '../../../../src/app/communication/ipc/main-buffered-ipc'

const bugReporterMock = new BugReporterMock()

const getMockSendFn = (message: IpcMessage) => {
  return (channel: string, data: ?mixed) => {
    message.channel = channel
    message.data = data
  }
}

describe('MainBufferedIpc', () => {
  describe('.send()', () => {
    let mainBufferedIpc
    beforeEach(() => {
      mainBufferedIpc = new MainBufferedIpc(bugReporterMock.captureErrorException)
    })

    it('buffers message on .send() and sends it after .setSender() is called', () => {
      const message = { channel: '', data: null }
      mainBufferedIpc.send('test', { some: 'data' })
      expect(message).to.eql({ channel: '', data: null })
      mainBufferedIpc.setSenderAndSendBuffered(getMockSendFn(message))

      expect(message).to.eql({ channel: 'test', data: { some: 'data' } })
    })

    it('sends message immediately if .send() it called after .setSender()', () => {
      const message = { channel: '', data: null }
      mainBufferedIpc.setSenderAndSendBuffered(getMockSendFn(message))
      mainBufferedIpc.send('testSome', { some: 'dataOnce' })

      expect(message).to.eql({ channel: 'testSome', data: { some: 'dataOnce' } })
    })
  })
})
