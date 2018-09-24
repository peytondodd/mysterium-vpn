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

type Bytes = {
  value: string,
  units: string
}

/**
 * @function
 * @param {number} val
 * @returns {{value:number,units:string}} result - holds value and units
 * @throws if argument is null
 */

function bytesReadable (val: number): Bytes {
  if (typeof val !== 'number') {
    throw new Error('provide valid input for conversion')
  }
  const calculated = size(val).calculate('jedec')
  return {
    value: calculated.fixed,
    units: calculated.suffix.replace('i', '')
  }
}

const bytesReadableDefault: Bytes = { value: '-', units: 'KB' }

function bytesReadableOrDefault (val: number): Bytes {
  try {
    return bytesReadable(val)
  } catch (err) {
    return bytesReadableDefault
  }
}

/**
 * @function
 * @param {number} val
 * @returns {string} readable in --:--:-- format
 * @throws {Error} if argument is null
 */
function timeDisplay (val: number): string {
  if (typeof val !== 'number' || val < 0) {
    throw new Error('invalid input')
  }
  let h = Math.floor(val / 3600)
  h = h > 9 ? h : '0' + h
  let m = Math.floor((val % 3600) / 60)
  m = m > 9 ? m : '0' + m
  let s = (val % 60)
  s = s > 9 ? s : '0' + s
  return `${h}:${m}:${s}`
}

const timeDisplayDefault = '--:--:--'

function timeDisplayOrDefault (val: number): string {
  try {
    return timeDisplay(val)
  } catch (err) {
    return timeDisplayDefault
  }
}

export {
  bytesReadableOrDefault,
  bytesReadable,
  timeDisplayOrDefault,
  timeDisplay
}
