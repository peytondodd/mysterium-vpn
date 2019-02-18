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
import path from 'path'
import { app, Tray, Menu } from 'electron'
import Window from '../../app/window'

const trayFactory = (
  window: Window,
  iconPath: string
) => {
  let theme = 'passive'

  // once we upgrade our Electron version, we can use this:
  // const { remote } = require('electron')
  // if (process.platform === 'darwin') {
  //   const { systemPreferences } = remote
  //
  //   theme = systemPreferences.isDarkMode() ? 'passive' : 'active'
  // }

  const icon = `tray-${theme}-mode.png`

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show app',
      type: 'normal',
      click () {
        window.show()
      }
    },
    {
      label: 'Quit',
      type: 'normal',
      click () {
        app.quit()
      }
    }
  ])

  const tray = new Tray(path.join(iconPath, icon))
  tray.setContextMenu(contextMenu)

  return tray
}

export default trayFactory
