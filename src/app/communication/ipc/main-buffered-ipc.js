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

import type { Ipc } from './ipc'
import type { EventListener } from '../ipc-message-bus'
import { ipcMain } from 'electron'

type Sender = (channel: string, data?: mixed) => void
export type IpcMessage = { channel: string, data: ?mixed }

class MainBufferedIpc implements Ipc {
  _send: ?Sender
  _buffer: IpcMessage[] = []
  _captureException: (Error) => void

  constructor (captureException: (Error) => void) {
    this._captureException = captureException
  }

  setSenderAndSendBuffered (send: Sender) {
    this._send = send

    this._buffer.forEach((m: IpcMessage) => {
      this.send(m.channel, m.data)
    })
    this._buffer = []
  }

  send (channel: string, data?: mixed): void {
    if (!this._send) {
      this._buffer.push({ channel, data })
      return
    }
    try {
      this._send(channel, data)
    } catch (err) {
      this._captureException(err)
    }
  }

  on (channel: string, listener: EventListener): void {
    ipcMain.on(channel, listener)
  }

  removeCallback (channel: string, listener: EventListener): void {
    ipcMain.removeListener(channel, listener)
  }
}

export type { Sender }
export default MainBufferedIpc
