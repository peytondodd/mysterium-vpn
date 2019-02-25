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

import size from 'file-size'

type BytesReadable = {
  amount: string,
  units: string
}

/**
 * @function
 * @param {number} bytes
 * @returns {{amount:number,units:string}} result - holds amount and units
 * @throws if argument is null
 */

function formatBytesReadable (bytes: number): BytesReadable {
  if (typeof bytes !== 'number') {
    throw new Error('provide valid input for conversion')
  }
  const calculated = size(bytes).calculate('jedec')
  return {
    amount: calculated.fixed,
    units: calculated.suffix.replace('i', '')
  }
}

const bytesReadableDefault: BytesReadable = { amount: '-', units: 'KB' }

function formatBytesReadableOrDefault (bytes: number): BytesReadable {
  try {
    return formatBytesReadable(bytes)
  } catch (err) {
    return bytesReadableDefault
  }
}

export {
  formatBytesReadableOrDefault,
  formatBytesReadable
}
export type { BytesReadable }
