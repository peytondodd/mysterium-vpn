/*
 * Copyright (C) 2018 The "MysteriumNetwork/mysterion" Authors.
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
import BugReporterAdapter from '../../../../../src/libraries/mysterium-tequilapi/adapters/bug-reporter-adapter'
import type { HttpInterface } from '../../../../../src/libraries/mysterium-tequilapi/adapters/interface'
import BugReporterMock from '../../../../helpers/bug-reporter-mock'
import { captureAsyncError } from '../../../../helpers/utils'
import { markErrorAsHttp } from '../../../../../src/libraries/mysterium-tequilapi/client-error'
import MockHttpAdapter from '../../../../helpers/adapters/MockHttpAdapter'

describe('BugReporterAdapter', () => {
  let adapter: HttpInterface
  let mockAdapter: MockHttpAdapter
  let bugReporter: BugReporterMock

  beforeEach(() => {
    bugReporter = new BugReporterMock()
    mockAdapter = new MockHttpAdapter()
    adapter = new BugReporterAdapter(mockAdapter, bugReporter)
  })

  describe('.get', () => {
    it('delegates call to passed adapter', async () => {
      const mockResponse = 'hello'
      mockAdapter.mockResponse = mockResponse
      const response = await adapter.get('path', { key: 'value' }, 5)
      expect(response).to.eql(mockResponse)

      expect(mockAdapter.lastPath).to.eql('path')
      expect(mockAdapter.lastQuery).to.eql({ key: 'value' })
      expect(mockAdapter.lastTimeout).to.eql(5)
    })

    it('captures and re-throws http error', async () => {
      const mockError = new Error('mock error')
      markErrorAsHttp(mockError)
      mockAdapter.mockError = mockError

      const err = await captureAsyncError(() => adapter.get('path'))

      expect(bugReporter.infoExceptions.length).to.eql(1)
      expect(bugReporter.infoExceptions[0].error).to.eql(mockError)

      expect(err).to.eql(mockAdapter.mockError)
    })

    it('does not capture but rethrows unknown error', async () => {
      const mockError = new Error('mock error')
      mockAdapter.mockError = mockError

      const err = await captureAsyncError(() => adapter.get('path'))

      expect(bugReporter.infoExceptions.length).to.eql(0)

      expect(err).to.eql(mockAdapter.mockError)
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

    it('captures and re-throws http error', async () => {
      const mockError = new Error('mock error')
      markErrorAsHttp(mockError)
      mockAdapter.mockError = mockError

      const err = await captureAsyncError(() => adapter.post('path'))

      expect(bugReporter.infoExceptions.length).to.eql(1)
      expect(bugReporter.infoExceptions[0].error).to.eql(mockError)

      expect(err).to.eql(mockAdapter.mockError)
    })

    it('does not capture but rethrows unknown error', async () => {
      const mockError = new Error('mock error')
      mockAdapter.mockError = mockError

      const err = await captureAsyncError(() => adapter.post('path'))

      expect(bugReporter.infoExceptions.length).to.eql(0)

      expect(err).to.eql(mockAdapter.mockError)
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

    it('captures and re-throws http error', async () => {
      const mockError = new Error('mock error')
      markErrorAsHttp(mockError)
      mockAdapter.mockError = mockError

      const err = await captureAsyncError(() => adapter.delete('path'))

      expect(bugReporter.infoExceptions.length).to.eql(1)
      expect(bugReporter.infoExceptions[0].error).to.eql(mockError)

      expect(err).to.eql(mockAdapter.mockError)
    })

    it('does not capture but rethrows unknown error', async () => {
      const mockError = new Error('mock error')
      mockAdapter.mockError = mockError

      const err = await captureAsyncError(() => adapter.delete('path'))

      expect(bugReporter.infoExceptions.length).to.eql(0)

      expect(err).to.eql(mockAdapter.mockError)
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

    it('captures and re-throws http error', async () => {
      const mockError = new Error('mock error')
      markErrorAsHttp(mockError)
      mockAdapter.mockError = mockError

      const err = await captureAsyncError(() => adapter.put('path'))

      expect(bugReporter.infoExceptions.length).to.eql(1)
      expect(bugReporter.infoExceptions[0].error).to.eql(mockError)

      expect(err).to.eql(mockAdapter.mockError)
    })

    it('does not capture but rethrows unknown error', async () => {
      const mockError = new Error('mock error')
      mockAdapter.mockError = mockError

      const err = await captureAsyncError(() => adapter.put('path'))

      expect(bugReporter.infoExceptions.length).to.eql(0)

      expect(err).to.eql(mockAdapter.mockError)
    })
  })
})
