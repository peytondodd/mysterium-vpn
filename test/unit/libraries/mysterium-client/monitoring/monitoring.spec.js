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

import { beforeEach, describe, expect, it } from '../../../../helpers/dependencies'
import Monitoring from '../../../../../src/libraries/mysterium-client/monitoring/monitoring'
import { RepeatableCallbackRecorder } from '../../../../helpers/utils'
import { MockStatusNotifier } from '../../../../helpers/mysterium-client/monitoring-mock'

describe('Monitoring', () => {
  let notifier: MockStatusNotifier
  let monitoring: Monitoring

  let recorder: RepeatableCallbackRecorder

  beforeEach(() => {
    notifier = new MockStatusNotifier()
    monitoring = new Monitoring(notifier)

    recorder = new RepeatableCallbackRecorder()
  })

  describe('.onStatusUp', () => {
    it('invokes callback each time status is up', async () => {
      monitoring.onStatusUp(recorder.getCallback())

      monitoring.start()

      notifier.notifyStatus(true)
      expect(recorder.invokesCount).to.eql(1)

      notifier.notifyStatus(true)
      expect(recorder.invokesCount).to.eql(2)
    })

    it('invokes callback instantly if status is already up', async () => {
      monitoring.start()
      notifier.notifyStatus(true)

      monitoring.onStatusUp(recorder.getCallback())

      expect(recorder.invokesCount).to.eql(1)
    })

    it('does not invoke callback instantly if status is down', async () => {
      monitoring.start()
      notifier.notifyStatus(false)

      monitoring.onStatusUp(recorder.getCallback())

      expect(recorder.invokesCount).to.eql(0)
    })
  })

  describe('.onStatusDown', () => {
    it('invokes callback each time status is down', async () => {
      monitoring.onStatusDown(recorder.getCallback())

      monitoring.start()

      notifier.notifyStatus(false)
      expect(recorder.invokesCount).to.eql(1)

      notifier.notifyStatus(false)
      expect(recorder.invokesCount).to.eql(2)
    })

    it('invokes callback instantly if status is already down', async () => {
      monitoring.start()
      notifier.notifyStatus(false)

      monitoring.onStatusDown(recorder.getCallback())

      expect(recorder.invokesCount).to.eql(1)
    })

    it('does not invoke callback instantly if status is unknown', async () => {
      monitoring.onStatusDown(recorder.getCallback())

      expect(recorder.invokesCount).to.eql(0)
    })
  })

  describe('.onStatusChangeUp', () => {
    it('invokes callback after status becomes up', async () => {
      monitoring.onStatusChangeUp(recorder.getCallback())

      monitoring.start()
      notifier.notifyStatus(true)

      expect(recorder.invokesCount).to.eql(1)
    })

    it('does not invoke callback again when status keeps being up', async () => {
      monitoring.onStatusChangeUp(recorder.getCallback())

      monitoring.start()
      notifier.notifyStatus(true)
      notifier.notifyStatus(true)

      expect(recorder.invokesCount).to.eql(1)
    })
  })

  describe('.onStatusChangeDown', () => {
    it('invokes callback after status becomes down', async () => {
      monitoring.onStatusChangeDown(recorder.getCallback())

      monitoring.start()

      notifier.notifyStatus(true)
      notifier.notifyStatus(false)

      expect(recorder.invokesCount).to.eql(1)
    })

    it('does not invoke callback again when status keeps being down', async () => {
      monitoring.onStatusChangeDown(recorder.getCallback())

      monitoring.start()

      notifier.notifyStatus(true)
      notifier.notifyStatus(false)
      notifier.notifyStatus(false)

      expect(recorder.invokesCount).to.eql(1)
    })
  })
})
