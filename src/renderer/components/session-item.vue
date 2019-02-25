<!--
  - Copyright (C) 2018 The "mysteriumnetwork/mysterium-vpn" Authors.
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
  <tr>
    <td>
      <CountryFlag :code="this.value.countryCode"/>
      {{ shortIdentity }}
    </td>
    <td>{{ this.value.startDate }}<br>{{ this.value.startTime }}</td>
    <td>{{ this.value.duration }}</td>
    <td>⇩{{ received }}<br>⇧{{ sent }}</td>
  </tr>
</template>

<script>
import CountryFlag from './country-flag'
import { limitedLengthString } from '../../app/strings'

export default {
  name: 'SessionItem',
  components: { CountryFlag },
  props: {
    value: {
      type: Object,
      required: true
    }
  },
  computed: {
    sent () {
      const sent = this.value.sent
      return sent.amount + sent.units
    },
    received () {
      const received = this.value.received
      return received.amount + received.units
    },
    shortIdentity () {
      return limitedLengthString(this.value.identity, 11)
    }
  }
}
</script>
