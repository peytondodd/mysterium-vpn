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
import { userSettingName } from '../../../../src/app/user-settings/user-settings-store'
import { afterEach, beforeEach, describe, expect, it } from '../../../helpers/dependencies'
import { tmpdir } from 'os'
import { join } from 'path'
import { CallbackRecorder, capturePromiseError } from '../../../helpers/utils'
import { UserSettingsStorage } from '../../../../src/app/user-settings/user-settings-storage'
import { unlinkSyncIfPresent } from '../../../helpers/file-system'

describe('UserSettingsStorage', () => {
  describe('.load', () => {
    describe('with invalid path for settings file', () => {
      const invalidPath = join(tmpdir(), 'someother', 'another')

      it('falls back to default settings', async () => {
        const userSettingsStore = new UserSettingsStorage(invalidPath)

        await userSettingsStore.load()
        expect(userSettingsStore.getAll().showDisconnectNotifications).to.be.eql(true)
        expect(userSettingsStore.getAll().favoriteProviders).to.be.eql(new Set())
      })
    })
  })

  describe('changing settings', () => {
    let userSettingsStore
    const settingsPath = 'test-settings.json'

    beforeEach(() => {
      userSettingsStore = new UserSettingsStorage(settingsPath)
    })

    afterEach(() => {
      unlinkSyncIfPresent(settingsPath)
    })

    describe('.setShowDisconnectNotifications', async () => {
      it('sets showDisconnectNotification', async () => {
        await userSettingsStore.setShowDisconnectNotifications(false)
        expect(userSettingsStore.getAll().showDisconnectNotifications).to.be.false
      })

      it('notifies subscribers about showDisconnectNotifications change', async () => {
        const cbRec = new CallbackRecorder()

        userSettingsStore.onChange(userSettingName.showDisconnectNotifications, cbRec.getCallback())
        await userSettingsStore.setShowDisconnectNotifications(false)
        expect(cbRec.invoked).to.be.true
        expect(cbRec.firstArgument).to.be.false
      })

      it('saves settings', async () => {
        await userSettingsStore.setShowDisconnectNotifications(false)
        const changedSettings = userSettingsStore.getAll()
        expect(await userSettingsStore.load()).to.be.true
        const loadedSettings = userSettingsStore.getAll()
        expect(loadedSettings).to.eql(changedSettings)
      })

      it('throws error if saving fails on invalid path to file', async () => {
        const invalidPath = join(tmpdir(), 'some', 'dir')
        const userSettingsStore = new UserSettingsStorage(invalidPath)
        const error = await capturePromiseError(userSettingsStore.setShowDisconnectNotifications(false))

        expect(error).to.be.an.instanceOf(Error)
      })
    })

    describe('.setFavorite', () => {
      it('adds favoriteId to settings store', async () => {
        await userSettingsStore.setFavorite('0xfax', true)
        expect(userSettingsStore.getAll().favoriteProviders.has('0xfax')).to.be.true
      })

      it('notifies subscribers about favorite add', async () => {
        const cbRec = new CallbackRecorder()

        userSettingsStore.onChange(userSettingName.favoriteProviders, cbRec.getCallback())
        await userSettingsStore.setFavorite('0xfax', true)
        expect(cbRec.invoked).to.be.true
        expect(cbRec.firstArgument.has('0xfax')).to.be.true
      })

      it('saves settings', async () => {
        await userSettingsStore.setFavorite('0xfax', true)
        const changedSettings = userSettingsStore.getAll()
        expect(await userSettingsStore.load()).to.be.true
        const loadedSettings = userSettingsStore.getAll()
        expect(loadedSettings).to.eql(changedSettings)
      })
    })
  })
})
