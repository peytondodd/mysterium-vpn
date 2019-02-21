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
import LoggerAdapter from '../../../../../src/app/mysterium-tequilapi/adapters/logger-adapter'
import type { HttpInterface } from 'mysterium-tequilapi/lib/adapters/interface'
import MockHttpAdapter from '../../../../helpers/adapters/MockHttpAdapter'
import type { StringLogger } from '../../../../../src/app/logging/string-logger'
import { Logger } from '../../../../../src/app/logger'
import { captureAsyncError } from '../../../../helpers/utils'
import { HttpQueryParams } from 'mysterium-tequilapi/lib/adapters/interface'

class MockStringLogger implements StringLogger {
  logs: {level: string, message: string}[] = []

  info (message: string): void {
    this._log('info', message)
  }

  warn (message: string): void {
    this._log('warn', message)
  }

  error (message: string): void {
    this._log('error', message)
  }

  debug (message: string) {
    this._log('debug', message)
  }

  _log (level: string, message: string) {
    this.logs.push({ level: 'info', message })
  }
}

describe('LoggerAdapter', () => {
  let adapter: HttpInterface
  let mockAdapter: MockHttpAdapter
  let mockStringLogger: MockStringLogger

  beforeEach(() => {
    mockAdapter = new MockHttpAdapter()

    mockStringLogger = new MockStringLogger()
    const logger = new Logger()
    logger.setLogger(mockStringLogger)

    adapter = new LoggerAdapter(logger, mockAdapter)
  })

  describe('.get', () => {
    it('delegates call to passed adapter', async () => {
      const mockResponse = 'hello'
      mockAdapter.mockResponse = mockResponse
      const query: HttpQueryParams = ({ key: 'value' }: { [string]: any })
      const response = await adapter.get('path', query, 5)
      expect(response).to.eql(mockResponse)

      expect(mockAdapter.lastPath).to.eql('path')
      expect(mockAdapter.lastQuery).to.eql({ key: 'value' })
      expect(mockAdapter.lastTimeout).to.eql(5)
    })

    it('logs error', async () => {
      mockAdapter.mockError = new Error('mock error')
      await captureAsyncError(() => adapter.get('path'))
      expect(mockStringLogger.logs).to.eql([
        {
          level: 'info',
          message: 'Error: mock error'
        }
      ])
    })
  })

  describe('.post', () => {
    it('delegates call to passed adapter', async () => {
      const mockResponse = 'hello'
      mockAdapter.mockResponse = mockResponse
      const response = await adapter.post('path', 'some data', 5)
      expect(response).to.eql(mockResponse)

      expect(mockAdapter.lastPath).to.eql('path')
      expect(mockAdapter.lastData).to.eql('some data')
      expect(mockAdapter.lastTimeout).to.eql(5)
    })

    it('logs error', async () => {
      mockAdapter.mockError = new Error('mock error')
      await captureAsyncError(() => adapter.post('path'))
      expect(mockStringLogger.logs).to.eql([
        {
          level: 'info',
          message: 'Error: mock error'
        }
      ])
    })
  })

  describe('.delete', () => {
    it('delegates call to passed adapter', async () => {
      const mockResponse = 'hello'
      mockAdapter.mockResponse = mockResponse
      const response = await adapter.delete('path', 5)
      expect(response).to.eql(mockResponse)

      expect(mockAdapter.lastPath).to.eql('path')
      expect(mockAdapter.lastTimeout).to.eql(5)
    })

    it('logs error', async () => {
      mockAdapter.mockError = new Error('mock error')
      await captureAsyncError(() => adapter.delete('path'))
      expect(mockStringLogger.logs).to.eql([
        {
          level: 'info',
          message: 'Error: mock error'
        }
      ])
    })
  })

  describe('.put', () => {
    it('delegates call to passed adapter', async () => {
      const mockResponse = 'hello'
      mockAdapter.mockResponse = mockResponse
      const response = await adapter.put('path', 'some data', 5)
      expect(response).to.eql(mockResponse)

      expect(mockAdapter.lastPath).to.eql('path')
      expect(mockAdapter.lastData).to.eql('some data')
      expect(mockAdapter.lastTimeout).to.eql(5)
    })

    it('logs error', async () => {
      mockAdapter.mockError = new Error('mock error')
      await captureAsyncError(() => adapter.put('path'))
      expect(mockStringLogger.logs).to.eql([
        {
          level: 'info',
          message: 'Error: mock error'
        }
      ])
    })
  })
})
