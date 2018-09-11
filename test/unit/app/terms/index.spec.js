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

import fs from 'fs'
import path from 'path'
import mock from 'mock-fs'
import { beforeEach, describe, it, expect, afterEach } from '../../../helpers/dependencies'
import Terms from '../../../../src/app/terms'
import { captureError } from '../../../helpers/utils'

const TERMS_SOURCE_PATH = '/TERMS_SOURCE_PATH'
const TERMS_EXPORT_PATH = '/TERMS_EXPORT_PATH'
const TERMS_HTML = '<html>SOME_TERMS</html>'

describe('Terms', () => {
  let terms: Terms

  beforeEach(() => {
    mock({
      [TERMS_SOURCE_PATH]: {
        'terms.html': TERMS_HTML
      },
      [TERMS_EXPORT_PATH]: {
        'terms.html': mock.file()
      }
    })

    terms = new Terms(TERMS_SOURCE_PATH, TERMS_EXPORT_PATH)
  })

  afterEach(() => {
    mock.restore()
  })

  describe('.load', () => {
    it('loads terms html from file', () => {
      terms.load()
      expect(terms.termsHtml).to.be.eql(TERMS_HTML)
    })

    it('throws exception when terms file is not found', () => {
      mock.restore()
      const error = captureError(() => terms.load())
      expect(error).to.be.an('error')
      expect(terms.termsHtml).to.be.undefined
    })
  })

  describe('.isAccepted', () => {
    it('returns true after loading and accepting terms', () => {
      terms.load()
      terms.accept()

      const accepted = terms.isAccepted()
      expect(accepted).to.be.true
    })

    it('returns true when accepted contents matches terms', () => {
      mock.restore()
      mock({
        [TERMS_EXPORT_PATH]: {
          'terms.html': TERMS_HTML
        }
      })
      terms.termsHtml = TERMS_HTML

      const accepted = terms.isAccepted()
      expect(accepted).to.be.true
    })

    it('returns false when accepted contents file is not found', () => {
      mock.restore()
      captureError(() => terms.load())
      const accepted = terms.isAccepted()
      expect(accepted).to.be.false
    })

    it('returns false when accepted contents does not matches terms', () => {
      mock.restore()
      mock({
        [TERMS_EXPORT_PATH]: {
          'terms.html': TERMS_HTML + '1'
        }
      })
      terms.termsHtml = TERMS_HTML + '2'
      const accepted = terms.isAccepted()
      expect(accepted).to.be.false
    })
  })

  describe('.accept', () => {
    it('successfully writes terms to the file', () => {
      terms.load()
      terms.accept()

      const writtenFileData = fs.readFileSync(
        path.join(TERMS_EXPORT_PATH, 'terms.html')
      ).toString()

      expect(writtenFileData).to.be.eql(TERMS_HTML)
    })
  })

  describe('getContent', () => {
    it('returns terms HTML', () => {
      terms.termsHtml = TERMS_HTML
      const content = terms.getContent()
      expect(content).to.be.eql(TERMS_HTML)
    })

    it('throws exception then terms was not loaded', () => {
      expect(terms.termsHtml).to.be.undefined
      let content
      const error = captureError(() => {
        content = terms.getContent()
      })
      expect(error).to.be.an('error')
      expect(content).to.be.undefined

      if (!error) {
        throw new Error('No error was returned')
      }
      expect(error.message).to.be.eql('Trying to get terms content, but termsHtml is undefined. Must do load() first')
    })
  })
})
