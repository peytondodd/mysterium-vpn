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
import RavenJs from 'raven-js'

class FeedbackForm {
  _raven: Object
  _email: string

  constructor (raven: typeof RavenJs, email: string) {
    this._raven = raven
    this._email = email
  }

  show () {
    this._raven.captureMessage('User opened issue report form.', { level: 'info' })
    this._raven.setUserContext({ email: this._email })
    this._raven.showReportDialog()
  }
}

export { FeedbackForm }
