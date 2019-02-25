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

import type { LogCallback } from '../../../../src/libraries/mysterium-client'
import logLevels from '../../../../src/libraries/mysterium-client/log-levels'
import BugReporterMock from '../../../helpers/bug-reporter-mock'
import { afterEach, beforeEach, describe, expect, it } from '../../../helpers/dependencies'
import ClientLogPublisher from '../../../../src/libraries/mysterium-client/client-log-publisher'
import { existsSync, unlinkSync } from 'fs'
import path from 'path'
import { CallbackRecorder } from '../../../helpers/utils'
import { TimeFormatter } from '../../../../src/libraries/formatters/time-formatter'

describe('ClientLogPublisher', () => {
  let logCallbackParam: string
  let publisher
  const stdout = path.join(process.cwd(), __dirname, 'stdout.log')
  const stderr = path.join(process.cwd(), __dirname, 'stderr.log')

  beforeEach(() => {
    logCallbackParam = ''
    const tailFunction = (path: string, logCallback: LogCallback) => {
      logCallback(logCallbackParam)
    }
    const dateFunction = () => new Date('2018-01-01')
    const timeFormatter = new TimeFormatter(0)
    const bugReporter = new BugReporterMock()
    publisher = new ClientLogPublisher(bugReporter, stdout, stderr, stdout, dateFunction, timeFormatter, tailFunction)
  })

  afterEach(() => {
    unlinkSync(stdout)
    unlinkSync(stderr)
  })

  describe('.setup', () => {
    it('creates missing files', async () => {
      expect(existsSync(stdout)).to.be.false
      expect(existsSync(stderr)).to.be.false

      await publisher.setup()

      expect(existsSync(stdout)).to.be.true
      expect(existsSync(stderr)).to.be.true
    })
  })

  describe('.onLog', () => {
    it('binds info level log callback', async () => {
      logCallbackParam = 'info line'

      const sub = new CallbackRecorder()
      publisher.onLog(logLevels.INFO, sub.getCallback())

      await publisher.setup()

      expect(sub.invoked).to.be.true
      expect(sub.arguments).to.be.eql([logCallbackParam])
    })

    it('binds error level log callback', async () => {
      logCallbackParam = 'error line'
      const sub = new CallbackRecorder()

      publisher.onLog(logLevels.ERROR, sub.getCallback())

      await publisher.setup()

      expect(sub.invoked).to.be.true
      expect(sub.arguments).to.be.eql(['2018-01-01T00:00:00.000Z error line'])
    })
  })
})
