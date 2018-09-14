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
import { after, afterEach, before, beforeEach, describe, expect, it } from '../../../helpers/dependencies'
import { tmpdir } from 'os'
import { join } from 'path'
import { readFileSync, unlinkSync, writeFileSync } from 'fs'
import { CallbackRecorder, capturePromiseError } from '../../../helpers/utils'
import type { UserSettings } from '../../../../src/app/user-settings/user-settings'
import { UserSettingsStorage } from '../../../../src/app/user-settings/user-settings-storage'
import { unlinkSyncIfPresent } from '../../../helpers/file-system'

describe('UserSettingsStorage', () => {
  describe('.save', () => {
    const saveSettingsPath = join(tmpdir(), 'settings.test.saving.json')

    after(() => {
      unlinkSyncIfPresent(saveSettingsPath)
    })

    it('exports a valid json file', async () => {
      const userSettingsStore = new UserSettingsStorage(saveSettingsPath)
      await userSettingsStore.setShowDisconnectNotifications(false)
      await userSettingsStore.setFavorite('id_123', true)
      const data = readFileSync(saveSettingsPath, { encoding: 'utf8' })

      expect(data.toString()).to.eql(
        '{' +
        '"showDisconnectNotifications":false,' +
        '"favoriteProviders":["id_123"]' +
        '}'
      )
    })
  })

  describe('.load', () => {
    describe('with valid settings file', () => {
      const loadSettingsPath = join(tmpdir(), 'settings.test.loading.json')
      let userSettingsStore

      before(() => {
        const settings: UserSettings = {
          showDisconnectNotifications: false,
          favoriteProviders: new Set(['id_123'])
        }
        writeFileSync(
          loadSettingsPath,
          JSON.stringify(settings)
        )
      })

      beforeEach(() => {
        userSettingsStore = new UserSettingsStorage(loadSettingsPath)
      })

      after(() => {
        unlinkSync(loadSettingsPath)
      })

      it('loads notification setting from json file', async () => {
        await userSettingsStore.load()
        expect(userSettingsStore.getAll().showDisconnectNotifications).to.be.eql(false)
      })

      it('loads favorite providers from json file', async () => {
        await userSettingsStore.load()
        expect(userSettingsStore.getAll().favoriteProviders).to.be.eql(new Set(['id_123']))
      })
    })

    describe('with invalid settings file', () => {
      const invalidJsonPath = join(tmpdir(), 'invalidJsonFile')

      before(() => {
        writeFileSync(
          invalidJsonPath,
          '{"notOfUserSettingsType":true}'
        )
      })
      after(() => {
        unlinkSync(invalidJsonPath)
      })

      it('throws TypeError if parsed Object from file is not of UserSettings type', async () => {
        const userSettingsStore = new UserSettingsStorage(invalidJsonPath)
        const error = await capturePromiseError(userSettingsStore.load())
        expect(error).to.be.instanceOf(TypeError)
      })
    })

    describe('with invalid path for settings file', () => {
      const invalidPath = join(tmpdir(), 'someother', 'another')

      it('falls back to default settings when invalid path to settings.json file is given', async () => {
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
