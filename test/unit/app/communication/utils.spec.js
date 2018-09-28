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

import { onFirstEvent } from '../../../../src/app/communication/utils'
import { describe, expect, it } from '../../../helpers/dependencies'

const subscription = (onResolve) => onResolve('resolution of instant data')

describe('utils', () => {
  describe('.onFirstEvent', () => {
    it('resolves once serial data is passed to callback', async () => {
      const resolvedData = await onFirstEvent(subscription)
      expect(resolvedData).to.eql('resolution of instant data')
    })
  })
})
