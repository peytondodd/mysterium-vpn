// @flow

import { after, before, describe, expect, it } from '../../../helpers/dependencies'
import readFeatures from '../../../../src/app/features/read-features'
import { writeFileSync, unlinkSync  } from 'fs'

describe('.readFeatures', () => {
  const filename = 'filename'

  after(() => {
    unlinkSync(filename)
  })

  describe('with JSON file', () => {
    before(() => {
      writeFileSync(filename, '{"test": true}')
    })

    it('returns parsed object', () => {
      expect(readFeatures(filename)).to.eql({ test: true })
    })
  })

  describe('with custom file', () => {
    before(() => {
      writeFileSync(filename, 'some text')
    })

    it('returns null', () => {
      expect(readFeatures(filename)).to.be.null
    })
  })

  it('returns null when file does not exist', () => {
    expect(readFeatures('does-not-exist')).to.be.null
  })
})
