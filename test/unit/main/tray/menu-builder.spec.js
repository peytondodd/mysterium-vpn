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
import TrayMenuBuilder from '../../../../src/main/tray/menu-builder'
import ConnectionStatusEnum from 'mysterium-tequilapi/lib/dto/connection-status-enum'
import translations from '../../../../src/main/tray/translations'
import { describe, it, expect, beforeEach } from '../../../helpers/dependencies'
import { buildMainCommunication } from '../../../../src/app/communication/main-communication'
import DirectMessageBus from '../../../helpers/direct-message-bus'
import { buildRendererCommunication } from '../../../../src/app/communication/renderer-communication'
import { CallbackRecorder } from '../../../helpers/utils'
import type { MessageReceiver } from '../../../../src/app/communication/message-receiver'

class FakeApplicationQuitter {
  didQuit: boolean = false

  quit () {
    this.didQuit = true
  }
}

class MessageRecorder<T> {
  _recorder: CallbackRecorder

  constructor (receiver: MessageReceiver<T>) {
    this._recorder = new CallbackRecorder()
    receiver.on(this._recorder.getCallback())
  }

  get invoked (): boolean {
    return this._recorder.invoked
  }

  get argument (): T {
    return this._recorder.firstArgument
  }
}

describe('tray', () => {
  describe('TrayMenuBuilder', () => {
    let appQuitter
    let communication
    let rendererCommunication
    let messageBus
    let builder
    let windowIsVisible = false

    const showWindow = () => {
      windowIsVisible = true
    }

    let devToolsToggled = false
    const toggleDevTools = () => {
      devToolsToggled = !devToolsToggled
    }

    const separator = 'separator'

    beforeEach(() => {
      windowIsVisible = false
      devToolsToggled = false
      messageBus = new DirectMessageBus()
      communication = buildMainCommunication(messageBus)
      rendererCommunication = buildRendererCommunication(messageBus)
      appQuitter = new FakeApplicationQuitter()
      builder = new TrayMenuBuilder(() => appQuitter.quit(), showWindow, toggleDevTools, communication)
    })

    describe('.build', () => {
      it('renders menu items without disconnect when not connected', () => {
        const items = builder.updateConnectionStatus(ConnectionStatusEnum.NOT_CONNECTED).build()
        expect(items[1].type).to.equal(separator)
        expect(items[2].label).to.equal(translations.connect)
        expect(items[3].type).to.equal(separator)
        expect(items[4].label).to.equal(translations.showWindow)
        expect(items[5].label).to.equal(translations.toggleDeveloperTools)
        expect(items[6].type).to.equal(separator)
        expect(items[7].label).to.equal(translations.quit)
      })

      it('renders menu items with disconnect when connected', () => {
        const items = builder.updateConnectionStatus(ConnectionStatusEnum.CONNECTED).build()
        expect(items[1].type).to.equal(separator)
        expect(items[2].label).to.equal(translations.disconnect)
        expect(items[3].type).to.equal(separator)
        expect(items[4].label).to.equal(translations.showWindow)
        expect(items[5].label).to.equal(translations.toggleDeveloperTools)
        expect(items[6].type).to.equal(separator)
        expect(items[7].label).to.equal(translations.quit)
      })

      it('sets status to connected', () => {
        const items = builder.updateConnectionStatus(ConnectionStatusEnum.CONNECTED).build()
        expect(items[0].label).to.equal(translations.statusConnected)
      })

      it('sets status to disconnected', () => {
        const items = builder.updateConnectionStatus(ConnectionStatusEnum.NOT_CONNECTED).build()
        expect(items[0].label).to.equal(translations.statusDisconnected)
      })

      it('sets status to connecting', () => {
        const items = builder.updateConnectionStatus(ConnectionStatusEnum.CONNECTING).build()
        expect(items[0].label).to.equal(translations.statusConnecting)
      })

      it('sets status to disconnecting', () => {
        const items = builder.updateConnectionStatus(ConnectionStatusEnum.DISCONNECTING).build()
        expect(items[0].label).to.equal(translations.statusDisconnecting)
      })

      it('renders favourite country with an asterisk (*)', () => {
        builder.updateCountries([
          { id: 'proposalId_123', code: 'LT', name: 'Lithuania', isFavorite: true },
          { id: 'proposalId_456', code: 'US', name: 'USA', isFavorite: false }
        ])

        const items = builder.build()
        expect(items[2].submenu[0].label).to.include('*')
        expect(items[2].submenu[1].label).to.not.include('*')
      })

      it('connects', () => {
        builder.updateCountries([
          { id: 'proposalId_123', code: 'LT', name: 'Lithuania', isFavorite: true },
          { id: 'proposalId_456', code: 'US', name: 'USA', isFavorite: false }
        ])

        const items = builder.build()

        const recorder = new MessageRecorder(rendererCommunication.connectionRequestReceiver)
        expect(recorder.invoked).to.be.false
        items[2].submenu[0].click()
        expect(recorder.invoked).to.be.true
        expect(recorder.argument).to.eql({ providerId: 'proposalId_123', providerCountry: 'LT' })
      })

      it('disconnects', () => {
        const items = builder.updateConnectionStatus(ConnectionStatusEnum.CONNECTED).build()
        const recorder = new MessageRecorder(rendererCommunication.connectionCancelReceiver)
        expect(recorder.invoked).to.be.false
        items[2].click()
        expect(recorder.invoked).to.be.true
      })

      it('shows window', () => {
        const items = builder.build()
        expect(windowIsVisible).to.equal(false)
        items[4].click()
        expect(windowIsVisible).to.equal(true)
      })

      it('quits app', () => {
        const items = builder.build()
        expect(appQuitter.didQuit).to.equal(false)
        items[7].click()
        expect(appQuitter.didQuit).to.equal(true)
      })

      it('toggles developer tools', () => {
        const items = builder.build()
        expect(devToolsToggled).to.equal(false)
        items[5].click()
        expect(devToolsToggled).to.equal(true)
        items[5].click()
        expect(devToolsToggled).to.equal(false)
      })
    })
  })
})
