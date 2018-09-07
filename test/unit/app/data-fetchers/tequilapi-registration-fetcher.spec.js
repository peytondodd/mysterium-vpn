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
import { describe, it, expect, before, beforeEach, after } from '../../../helpers/dependencies'
import lolex from 'lolex'
import { capturePromiseError, nextTick } from '../../../helpers/utils'
import EmptyTequilapiClientMock from '../../renderer/store/modules/empty-tequilapi-client-mock'
import logger from '../../../../src/app/logger'
import IdentityRegistrationDTO from '../../../../src/libraries/mysterium-tequilapi/dto/identity-registration'
import TequilapiRegistrationFetcher from '../../../../src/app/data-fetchers/tequilapi-registration-fetcher'

const IDENTITY_ID = 'identity-id-123'
const REGISTRATION = {
  registered: true,
  publicKey: {
    part1: '0xfb22c62ed2ddc65eb2994a8af5b1094b239aacc04a6505fd2bc581f55547175a',
    part2: '0xef3156a0d95c3832b191c03c272a5900e3e30484b9c8a65a0387f1f8d436867f'
  },
  signature: {
    r: '0xb48616d33aba008f687d500cac9e9f2ca2b3c275fab6fc21318b81e09571d993',
    s: '0x49c0d7e1445389dbc805275f0aeb0b7f23e50e26a772b5a3bc4b2cc39f1bb3aa',
    v: 28
  }
}

class IdentityTequilapiClientMock extends EmptyTequilapiClientMock {
  mockError: Error = new Error('Mock error')
  _registration: IdentityRegistrationDTO
  _willFail: boolean = false

  constructor (registration: IdentityRegistrationDTO) {
    super()
    this._registration = registration
  }

  async identityRegistration (id: string): Promise<IdentityRegistrationDTO> {
    if (!id) throw new Error('some tequilapi error here')
    if (this._willFail) {
      throw this.mockError
    }
    return this._registration
  }

  markToFail () {
    this._willFail = true
  }

  markToSucceed () {
    this._willFail = false
  }
}

describe('DataFetchers', () => {
  describe('TequilapiRegistrationFetcher', () => {
    let clock
    const interval = 1001
    const tequilapi = new IdentityTequilapiClientMock(new IdentityRegistrationDTO(REGISTRATION))
    let fetcher: TequilapiRegistrationFetcher

    before(() => {
      clock = lolex.install()
    })

    after(() => {
      clock.uninstall()
    })

    beforeEach(() => {
      fetcher = new TequilapiRegistrationFetcher(tequilapi, interval)
    })

    async function tickWithDelay (duration) {
      clock.tick(duration)
      await nextTick()
    }

    describe('.start', () => {
      it('triggers subscriber callbacks', async () => {
        let counter = 0

        fetcher.onFetchedRegistration(() => counter++)

        expect(counter).to.equal(0)
        fetcher.start(IDENTITY_ID)
        await nextTick()
        expect(counter).to.equal(1)

        await tickWithDelay(1000)
        expect(counter).to.equal(1)

        await tickWithDelay(1000)
        expect(counter).to.equal(2)
      })

      it('triggers subscriber callbacks with registration', async () => {
        let registration = []

        fetcher.onFetchedRegistration((fetchedRegistration) => {
          registration = fetchedRegistration
        })

        fetcher.start(IDENTITY_ID)

        await tickWithDelay(1000)

        expect(registration).to.deep.equal(REGISTRATION)
      })

      describe('when proposal fetching fails', () => {
        before(() => {
          tequilapi.markToFail()
        })

        after(() => {
          tequilapi.markToSucceed()
        })

        it('triggers failure callbacks with error', async () => {
          let error = null
          fetcher.onFetchingError((err) => {
            logger.info('ERROR!', err)
            error = err
          })

          fetcher.start(IDENTITY_ID)

          await tickWithDelay(1001)
          expect(error).to.eql(tequilapi.mockError)
        })
      })
    })

    describe('.stop', () => {
      it('stops fetching of registration', async () => {
        let counter = 0

        fetcher.onFetchedRegistration(() => counter++)
        fetcher.start(IDENTITY_ID)

        await tickWithDelay(1000)
        expect(counter).to.equal(1)

        const stopPromise = fetcher.stop()
        await tickWithDelay(1000)
        await stopPromise

        expect(counter).to.equal(1)
      })

      it('does not fail when invoked without starting', async () => {
        await fetcher.stop()
      })
    })

    describe('.fetch', () => {
      it('thows when invoked independently', async () => {
        const error = await capturePromiseError(fetcher.fetch())
        expect(error).to.be.instanceOf(Error)
        expect(error).to.have.property('message', 'some tequilapi error here')
      })
      it('resolves when invoked after start()', async () => {
        fetcher.start('some identity')
        const reg = await fetcher.fetch()
        expect(reg).to.eql(REGISTRATION)
      })
    })
  })
})
