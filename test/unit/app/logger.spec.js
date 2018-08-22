/*
 * Copyright (C) 2017 The "MysteriumNetwork/mysterion" Authors.
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
import { before, describe, expect, it } from '../../helpers/dependencies'
import logger from '../../../src/app/logger'
import type { StringLogger } from '../../../src/app/logging/string-logger'

class StringLoggerMock implements StringLogger {
  infoText: string
  errorText: string

  info (message: string) {
    this.infoText = message
  }

  error (err: string) {
    this.errorText = err
  }

  debug () {}
  warn () {}
}

describe('Logger', () => {
  const stringLogger = new StringLoggerMock()

  before(() => {
    logger.setLogger(stringLogger)
  })

  describe('.info', () => {
    it('converts null to string', () => {
      logger.info(null)
      expect(stringLogger.infoText).to.be.eql('null')
    })

    it('logs simple string', () => {
      const str = 'THIS_IS_STRING'
      logger.info(str)
      expect(stringLogger.infoText).to.be.eql(`"${str}"`)
    })

    it('logs number as string', () => {
      const str = 123.45
      logger.info(str)
      expect(stringLogger.infoText).to.be.eql(str.toString())
    })

    it('logs complex object', () => {
      const object = {
        str: 'any string',
        intArray: [1, 2, 3],
        map: { a: 10, b: 20 }
      }
      logger.info(object)
      expect(stringLogger.infoText).to.be.eql(JSON.stringify(object))
    })

    it('logs multiple arguments', () => {
      const arg1 = 'abc'
      const arg2 = 3.14159265
      const arg3 = { x: 1, y: 2 }
      logger.info(arg1, arg2, arg3)
      expect(stringLogger.infoText).to.be.eql('"abc" 3.14159265 {"x":1,"y":2}')
    })
  })

  describe('.error', () => {
    it('converts null to string', () => {
      logger.error(null)
      expect(stringLogger.errorText).to.be.eql('null')
    })

    it('logs simple string', () => {
      const str = 'just any string'
      logger.error(str)
      expect(stringLogger.errorText).to.be.eql(`"${str}"`)
    })

    it('logs number as string', () => {
      const str = 0.45
      logger.error(str)
      expect(stringLogger.errorText).to.be.eql(str.toString())
    })

    it('logs complex object', () => {
      const object = {
        str: 'any string',
        numberArray: [1.1, 2.2, 3.3],
        map: { a: 'a' }
      }
      logger.error(object)
      expect(stringLogger.errorText).to.be.eql(JSON.stringify(object))
    })

    it('logs multiple arguments', () => {
      const arg1 = 'a b c'
      const arg2 = 2.7182818
      const arg3 = { x: '1', y: 2 }
      logger.error(arg1, arg2, arg3)
      expect(stringLogger.errorText).to.be.eql('"a b c" 3.14159265 {"x":"1","y":2}')
    })
  })
})
