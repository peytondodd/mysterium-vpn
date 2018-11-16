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

import { after, before, describe, expect, it } from '../../../helpers/dependencies'
import { tmpdir } from 'os'
import { join } from 'path'
import { unlinkSyncIfPresent } from '../../../helpers/file-system'
import type { UserSettings } from '../../../../src/app/user-settings/user-settings'
import { readFileSync, unlinkSync, writeFileSync } from 'fs'
import { loadSettings, saveSettings } from '../../../../src/app/user-settings/storage'
import { capturePromiseError } from '../../../helpers/utils'

describe('storage', () => {
  describe('.saveSettings', () => {
    const saveSettingsPath = join(tmpdir(), 'settings.test.saving.json')

    after(() => {
      unlinkSyncIfPresent(saveSettingsPath)
    })

    it('exports a valid json file', async () => {
      const settings: UserSettings = {
        showDisconnectNotifications: false,
        favoriteProviders: new Set(['id_123']),
        showAllProviders: false
      }
      await saveSettings(saveSettingsPath, settings)
      const data = readFileSync(saveSettingsPath, { encoding: 'utf8' })

      expect(data.toString()).to.eql(
        '{' +
        '"showDisconnectNotifications":false,' +
        '"favoriteProviders":["id_123"],' +
        '"showAllProviders":false' +
        '}'
      )
    })
  })

  describe('.loadSettings', () => {
    describe('with valid settings file', () => {
      const loadSettingsPath = join(tmpdir(), 'settings.test.loading.json')

      before(() => {
        const settings: UserSettings = {
          showDisconnectNotifications: false,
          favoriteProviders: new Set(['id_123']),
          showAllProviders: false
        }
        writeFileSync(
          loadSettingsPath,
          JSON.stringify(settings)
        )
      })

      after(() => {
        unlinkSync(loadSettingsPath)
      })

      it('loads notification setting from json file', async () => {
        const settings = await loadSettings(loadSettingsPath)
        expect(settings.showDisconnectNotifications).to.be.eql(false)
      })

      it('loads favorite providers from json file 2', async () => {
        const settings = await loadSettings(loadSettingsPath)
        expect(settings.favoriteProviders).to.be.eql(new Set(['id_123']))
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
        const error = await capturePromiseError(loadSettings(invalidJsonPath))
        expect(error).to.be.instanceOf(TypeError)
      })
    })
  })
})
