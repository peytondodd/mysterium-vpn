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

import type { TequilapiClient } from 'mysterium-tequilapi/lib/client'
import { TequilapiStatusNotifier } from './tequilapi-status-notifier'
import { promisify } from 'util'
import Monitoring from './monitoring'
import sleep from '../../sleep'

function waitForStatusUp (tequilapi: TequilapiClient, timeout: number): Promise<void> {
  const process = new TequilapiStatusNotifier(tequilapi)
  const monitoring = new Monitoring(process)
  const statusUpAsync = promisify(monitoring.onStatusChangeUp.bind(monitoring))
  monitoring.start()

  return Promise.race([
    throwErrorAfterTimeout(timeout),
    statusUpAsync()
  ]).finally(() => {
    process.stop()
  })
}

async function throwErrorAfterTimeout (timeout: number) {
  await sleep(timeout)
  throw new Error(`Timeout of ${timeout}ms passed`)
}

export { waitForStatusUp }
