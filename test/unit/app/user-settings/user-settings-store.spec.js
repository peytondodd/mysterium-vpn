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
import { UserSettingsStore, userSettingName } from '../../../../src/app/user-settings/user-settings-store'
import { describe, expect, it, after, before, beforeEach } from '../../../helpers/dependencies'
import { tmpdir } from 'os'
import { join } from 'path'
import { readFileSync, writeFileSync, unlinkSync } from 'fs'
import { CallbackRecorder, capturePromiseError } from '../../../helpers/utils'
import type { UserSettings } from '../../../../src/app/user-settings/user-settings'

describe('UserSettingsStore', () => {
  describe('.save', () => {
    const saveSettingsPath = join(tmpdir(), 'settings.test.saving.json')
    const invalidPath = join(tmpdir(), 'some', 'dir')

    after(() => {
      unlinkSync(saveSettingsPath)
    })

    it('exports a valid json file', async () => {
      const userSettingsStore = new UserSettingsStore(saveSettingsPath)
      userSettingsStore.setShowDisconnectNotifications(false)
      userSettingsStore.setFavorite('id_123', true)
      userSettingsStore.addConnectionRecord({ country: 'us', success: false })
      await userSettingsStore.save()
      const data = readFileSync(saveSettingsPath, { encoding: 'utf8' })

      expect(data.toString()).to.eql(
        '{' +
        '"showDisconnectNotifications":false,' +
        '"favoriteProviders":["id_123"],' +
        '"connectionRecords":[{"country":"us","success":false}]' +
        '}'
      )
    })

    it('throws error if save() fails on invalid path to file', async () => {
      const userSettingsStore = new UserSettingsStore(invalidPath)
      userSettingsStore.setShowDisconnectNotifications(false)
      userSettingsStore.setFavorite('id_123', true)
      const error = await capturePromiseError(userSettingsStore.save())

      expect(error).to.be.an.instanceOf(Error)
    })
  })

  describe('.load', () => {
    describe('with valid settings file', () => {
      const loadSettingsPath = join(tmpdir(), 'settings.test.loading.json')
      let userSettingsStore

      before(() => {
        const settings: UserSettings = {
          showDisconnectNotifications: false,
          favoriteProviders: new Set(['id_123']),
          connectionRecords: [
            { country: 'us', success: false }
          ]
        }
        writeFileSync(
          loadSettingsPath,
          JSON.stringify(settings)
        )
      })

      beforeEach(() => {
        userSettingsStore = new UserSettingsStore(loadSettingsPath)
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

      it('loads connection records from json file', async () => {
        await userSettingsStore.load()
        expect(userSettingsStore.getAll().connectionRecords).to.be.eql([
          { country: 'us', success: false }
        ])
      })

      it('notifies subscribers about connection records change', async () => {
        const cbRec = new CallbackRecorder()
        userSettingsStore.onChange(userSettingName.connectionRecords, cbRec.getCallback())

        await userSettingsStore.load()
        expect(cbRec.invoked).to.be.true
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
        const userSettingsStore = new UserSettingsStore(invalidJsonPath)
        const error = await capturePromiseError(userSettingsStore.load())
        expect(error).to.be.instanceOf(TypeError)
      })
    })

    describe('with invalid path for settings file', () => {
      const invalidPath = join(tmpdir(), 'someother', 'another')

      it('falls back to default settings when invalid path to settings.json file is given', async () => {
        const userSettingsStore = new UserSettingsStore(invalidPath)

        await userSettingsStore.load()
        expect(userSettingsStore.getAll().showDisconnectNotifications).to.be.eql(true)
        expect(userSettingsStore.getAll().favoriteProviders).to.be.eql(new Set())
      })
    })
  })

  describe('changing settings', () => {
    let userSettingsStore

    beforeEach(() => {
      userSettingsStore = new UserSettingsStore('')
    })

    describe('.setShowDisconnectNotifications', async () => {
      it('sets showDisconnectNotification', () => {
        userSettingsStore.setShowDisconnectNotifications(false)
        expect(userSettingsStore.getAll().showDisconnectNotifications).to.be.false
      })

      it('notifies subscribers about showDisconnectNotifications change', () => {
        const cbRec = new CallbackRecorder()

        userSettingsStore.onChange(userSettingName.showDisconnectNotifications, cbRec.getCallback())
        userSettingsStore.setShowDisconnectNotifications(false)
        expect(cbRec.invoked).to.be.true
        expect(cbRec.firstArgument).to.be.false
      })
    })

    describe('.setFavorite', () => {
      it('adds favoriteId to settings store', () => {
        userSettingsStore.setFavorite('0xfax', true)
        expect(userSettingsStore.getAll().favoriteProviders.has('0xfax')).to.be.true
      })

      it('notifies subscribers about favorite add', () => {
        const cbRec = new CallbackRecorder()

        userSettingsStore.onChange(userSettingName.favoriteProviders, cbRec.getCallback())
        userSettingsStore.setFavorite('0xfax', true)
        expect(cbRec.invoked).to.be.true
        expect(cbRec.firstArgument.has('0xfax')).to.be.true
      })
    })

    describe('.addConnectionRecord', () => {
      const connection = { country: 'us', success: false }

      it('adds connection record to settings store', async () => {
        userSettingsStore.addConnectionRecord(connection)
        expect(userSettingsStore.getAll().connectionRecords).to.eql([
          connection
        ])
      })

      it('notifies subscribers about connection records change', () => {
        const cbRec = new CallbackRecorder()

        userSettingsStore.onChange(userSettingName.connectionRecords, cbRec.getCallback())
        userSettingsStore.addConnectionRecord(connection)
        expect(cbRec.invoked).to.be.true
        expect(cbRec.firstArgument).to.eql([connection])
      })
    })
  })
})
