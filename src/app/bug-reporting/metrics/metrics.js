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

/**
 * Used as default metric value in Sentry
 * Later metric value will be replaces using method 'set'
 * @type {string}
 */
const NOT_SET = 'N/A'

const TAGS = {
  IDENTITY_UNLOCKED: 'identity_unlocked',
  IDENTITY_REGISTERED: 'identity_registered',
  PROPOSALS_FETCHED_ONCE: 'proposals_fetched_once',
  CONNECTION_ACTIVE: 'connection_active',
  CLIENT_RUNNING: 'client_running',
  START_TIME: 'start_time',
  SESSION_ID: 'session_id'
}

const EXTRA = {
  HEALTH_CHECK_TIME: 'last_health_check',
  CONNECTION_STATUS: 'connection_status',
  CONNECTION_STATISTICS: 'connection_statistics',
  CONNECTION_IP: 'connection_ip'
}

const METRICS = {}
Object.assign(METRICS, TAGS)
Object.assign(METRICS, EXTRA)

// alternative to: type Metric = 'identity_unlocked' | 'proposals_fetched' | 'last_health_check' ...
type Metric = $Values<typeof METRICS>
type KeyValueMap = { [id: string]: mixed }
type RavenData = {
  tags: KeyValueMap,
  extra: KeyValueMap,
}

export { METRICS, NOT_SET, TAGS, EXTRA }
export type { RavenData, Metric, KeyValueMap }
