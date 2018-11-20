<!--
  - Copyright (C) 2017 The "mysteriumnetwork/mysterium-vpn" Authors.
  -
  - This program is free software: you can redistribute it and/or modify
  - it under the terms of the GNU General Public License as published by
  - the Free Software Foundation, either version 3 of the License, or
  - (at your option) any later version.
  -
  - This program is distributed in the hope that it will be useful,
  - but WITHOUT ANY WARRANTY; without even the implied warranty of
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  - GNU General Public License for more details.
  -
  - You should have received a copy of the GNU General Public License
  - along with this program.  If not, see <http://www.gnu.org/licenses/>.
  -->

<template>
  <div class="countries">
    <multiselect
      class="countries__multiselect"
      :max-height="120"
      v-model="country"
      track-by="id"
      :custom-label="selectedCountryLabel"
      placeholder="Choose country"
      :options="filteredCountries"
      :loading="countriesAreLoading"
      :searchable="true"
      :show-labels="false"
      :show-pointer="false"
      @open="fetchCountries()"
      @input="onChange">
      <template
        slot="option"
        slot-scope="props">
        <span
          class="multiselect__option-star"
          v-if='props.option.isFavorite'>
          ★
        </span>
        <country-flag :code="props.option.code"/>
        <div
          class="multiselect__option-title"
          v-text="countryLabel(props.option)"/>
      </template>
      <template slot="afterList">
        <div class="country-filter">
          <a
            @click="toggleShowMore()"
            v-text="filterText" />
        </div>
      </template>
    </multiselect>

    <country-flag
      :code="countryCode"
      class="country-flag--dropdown"/>
  </div>
</template>

<script>
import { getCountryLabel } from '../../app/countries'
import Multiselect from 'vue-multiselect'
import IconWorld from '@/assets/img/icon--world.svg'
import CountryFlag from './country-flag'

export default {
  name: 'CountrySelect',
  dependencies: ['rendererCommunication'],
  props: {
    countryList: {
      type: Array,
      required: true
    },
    countriesAreLoading: {
      type: Boolean,
      required: false,
      default: false
    },
    fetchCountries: {
      type: Function,
      required: true
    }
  },
  components: {
    CountryFlag,
    Multiselect,
    IconWorld
  },
  data () {
    return {
      country: null,
      showMore: false,
      unresolvedCountryList: []
    }
  },
  methods: {
    onChange (country) {
      this.$emit('selected', country)
    },
    selectedCountryLabel (country) {
      if (typeof country !== 'object') {
        return
      }

      return getCountryLabel(country, 10)
    },
    countryLabel (country) {
      if (typeof country !== 'object') {
        return
      }

      return getCountryLabel(country)
    },
    onConnectionRequest (proposal) {
      const selectedCountry = this.countryList.find((country) => country.id === proposal.providerId)

      this.country = selectedCountry
      this.$emit('selected', selectedCountry)
    },
    toggleShowMore () {
      this.showMore = !this.showMore
    }
  },
  computed: {
    countryCode () {
      if (this.country == null) {
        return null
      }
      return this.country.code
    },
    filterText () {
      if (this.showMore) {
        return 'Show less'
      }
      return 'Show more'
    },
    filteredCountries () {
      if (this.showMore) {
        return this.countryList
      }
      return this.countryList.filter(c => c.trusted)
    }
  },
  mounted () {
    this.rendererCommunication.connectionRequest.on(this.onConnectionRequest)
  },
  beforeDestroy () {
    this.rendererCommunication.connectionRequest.removeCallback(this.onConnectionRequest)
  }
}
</script>
