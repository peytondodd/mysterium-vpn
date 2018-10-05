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
      <CountryFlag :code="countryCode"/>
      {{ shortIdentity }}
    </td>
    <td>{{ startDate }}<br>{{ startTime }}</td>
    <td>{{ durationString }}</td>
    <td>⇩{{ received }}<br>⇧{{ sent }}</td>
  </tr>
</template>

<script>
import { bytesReadableOrDefault, timeDisplayOrDefault } from '../../libraries/unit-converter'
import { getReadableDate, getReadableTime } from '../../libraries/strings'
import CountryFlag from './country-flag'

export default {
  name: 'SessionItem',
  components: { CountryFlag },
  props: {
    session: {
      type: Object,
      required: true
    }
  },
  computed: {
    durationString: function () {
      return timeDisplayOrDefault(this.session.statistics.duration)
    },
    sent: function () {
      const sent = bytesReadableOrDefault(this.session.statistics.bytesSent)
      return sent.value + sent.units
    },
    received: function () {
      const received = bytesReadableOrDefault(this.session.statistics.bytesReceived)
      return received.value + received.units
    },
    shortIdentity: function () {
      return this.session.proposal.providerId.slice(0, 11) + '...'
    },
    startDate: function () {
      return getReadableDate(this.dateObject)
    },
    startTime: function () {
      return getReadableTime(this.dateObject)
    },
    dateObject: function () {
      return new Date(this.session.statistics.dateStart)
    },
    countryCode: function () {
      return this.session.location.country
    }
  }
}
</script>
