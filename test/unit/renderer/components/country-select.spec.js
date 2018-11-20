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

import { createLocalVue, mount } from '@vue/test-utils'
import CountrySelect from '@/components/country-select'
import DIContainer from '../../../../src/app/di/vue-container'
import FakeMessageBus from '../../../helpers/fake-message-bus'
import { beforeEach, describe, expect, it } from '../../../helpers/dependencies'
import BugReporterMock from '../../../helpers/bug-reporter-mock'
import { buildRendererCommunication } from '../../../../src/app/communication/renderer-communication'
import type { BugReporter } from '../../../../src/app/bug-reporting/interface'

const countryList = [
  {
    id: '0x1',
    code: 'lt',
    name: 'Lithuania',
    trusted: true
  },
  {
    id: '0x2',
    code: 'gb',
    name: 'United Kingdom',
    trusted: true
  },
  {
    id: '0x3',
    code: 'unknown',
    name: 'N/A',
    trusted: true
  },
  {
    id: '0x4',
    code: 'unknown',
    name: 'N/A',
    trusted: true
  },
  {
    id: '0x4',
    name: 'N/A',
    trusted: true
  }
]

function mountWith (countryList, rendererCommunication, bugReporterMock: BugReporter) {
  const vue = createLocalVue()

  const dependencies = new DIContainer(vue)
  dependencies.constant('rendererCommunication', rendererCommunication)
  dependencies.constant('bugReporter', bugReporterMock)

  return mount(CountrySelect, {
    localVue: vue,
    propsData: {
      countryList: countryList,
      fetchCountries: () => {},
      countriesAreLoading: false
    }
  })
}

describe('CountrySelect', () => {
  let wrapper
  let fakeMessageBus
  let bugReporterMock

  beforeEach(() => {
    fakeMessageBus = new FakeMessageBus()
    bugReporterMock = new BugReporterMock()
  })

  describe('when getting list of proposals', () => {
    beforeEach(async () => {
      wrapper = mountWith(countryList, buildRendererCommunication(fakeMessageBus), bugReporterMock)
      fakeMessageBus.clean()
    })

    it('renders a list item for each proposal', async () => {
      expect(wrapper.vm.countryList).to.have.lengthOf(5)

      const multiselectOptions = wrapper.findAll('.multiselect__option-title')
      expect(multiselectOptions).to.have.lengthOf(5)

      const flags = wrapper.find('.countries__multiselect').findAll('.country-flag__svg')
      expect(flags.wrappers).to.have.lengthOf(5)

      // country code is known
      expect(multiselectOptions.wrappers[0].text()).to.contain('Lithuania (0x1)')
      expect(flags.wrappers[0].element.src).to.contain('/lt.svg')

      // country code is known
      expect(multiselectOptions.wrappers[1].text()).to.contain('United Kingdom (0x2)')
      expect(flags.wrappers[1].element.src).to.contain('/gb.svg')

      // country code is not defined
      expect(multiselectOptions.wrappers[2].text()).to.contain('N/A un.. (0x3)')
      expect(flags.wrappers[2].element.src).to.contain('/world.svg')

      // country code is not resolved
      expect(multiselectOptions.wrappers[3].text()).to.contain('N/A un.. (0x4)')
      expect(flags.wrappers[3].element.src).to.contain('/world.svg')
    })

    it('clicking an item changes v-model', async () => {
      const countryExpected = {
        id: '0x1',
        code: 'lt',
        name: 'Lithuania'
      }

      // TODO: do this instead of vm.onChange() when https://github.com/vuejs/vue-test-utils/issues/754 is resolved
      // wrapper.find('.multiselect__option').trigger('click')

      wrapper.vm.onChange(countryExpected)
      expect(wrapper.emitted().selected).to.be.ok
      expect(wrapper.emitted().selected[0]).to.eql([countryExpected])
    })
  })

  describe('selectedCountryLabel()', () => {
    beforeEach(() => {
      wrapper = mountWith([], buildRendererCommunication(fakeMessageBus), bugReporterMock)
      fakeMessageBus.clean()
    })

    it('returns truncated long country name label', () => {
      const country = {
        name: 'The Democratic Republic of the Congo',
        id: '0x1234567890',
        code: 'cd'
      }

      const label = wrapper.vm.selectedCountryLabel(country)
      expect(label).to.be.eql('The Democr.. (0x1234567..)')
    })

    it('returns truncated short country name label', () => {
      const country = {
        name: 'Lithuania',
        id: '0x1234567890',
        code: 'lt'
      }

      const label = wrapper.vm.selectedCountryLabel(country)
      expect(label).to.be.eql('Lithuania (0x1234567..)')
    })

    it('cleans all message bus callbacks after being destroyed', async () => {
      wrapper.destroy()
      expect(fakeMessageBus.noRemainingCallbacks()).to.be.true
    })
  })
})
