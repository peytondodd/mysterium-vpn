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
import sleep from './sleep'
import Publisher from './publisher'

type AsyncFunctionWithoutParams = () => Promise<any>

// Internal type for capturing duration and error of function
type ExecutionResult = {
  error: ?Error,
  duration: number
}

/**
 * Executes given function and sleeps for remaining time.
 * If .cancel() is invoked, than sleep is skipped after function finishes.
 */
class ThresholdExecutor {
  _func: AsyncFunctionWithoutParams
  _threshold: number
  _canceled: boolean
  _errorCallback: ?Function

  constructor (func: AsyncFunctionWithoutParams, threshold: number, errorCalback?: Function) {
    this._func = func
    this._threshold = threshold
    this._canceled = false
    this._errorCallback = errorCalback
  }

  /**
   * Executes given function and sleeps for remaining time, if .cancel() was not invoked.
   * @returns {Promise<void>}
   */
  async execute (): Promise<void> {
    const executionResult = await this._executeFunction()
    if (executionResult.error && this._errorCallback) {
      this._errorCallback(executionResult.error)
    }
    await this._sleepRemainingTime(executionResult.duration)
  }

  /**
   * Forces currently function execution to skip sleep.
   */
  cancel () {
    this._canceled = true
  }

  async _executeFunction (): Promise<ExecutionResult> {
    const start = Date.now()
    let error = null
    try {
      await this._func()
    } catch (err) {
      error = err
    }
    const end = Date.now()
    return { duration: end - start, error }
  }

  async _sleepRemainingTime (duration: number): Promise<void> {
    const sleepTime = this._remainingSleepTime(duration)
    if (sleepTime > 0) {
      await sleep(sleepTime)
    }
  }

  _remainingSleepTime (duration: number): number {
    if (this._canceled || duration >= this._threshold) {
      return 0
    }
    return this._threshold - duration
  }
}

/**
 * Executes given function infinitely.
 * Ensures that time between function executions is above given threshold.
 * @constructor
 * @param {!function} func - Function to be executed
 * @param {!number} threshold - Minimum sleep between function executions (in milliseconds).
 */
class FunctionLooper {
  _func: AsyncFunctionWithoutParams
  _threshold: number
  _running: boolean = false
  _errorPublisher: Publisher<Error> = new Publisher()
  _currentExecutor: ?ThresholdExecutor
  _currentPromise: ?Promise<void>

  constructor (func: AsyncFunctionWithoutParams, threshold: number) {
    this._func = func
    this._threshold = threshold
  }

  start (): void {
    if (this.isRunning()) {
      return
    }
    this._running = true

    const loop = async () => {
      // eslint-disable-next-line no-unmodified-loop-condition
      while (this._running) {
        this._currentExecutor = new ThresholdExecutor(
          this._func,
          this._threshold,
          (err) => this._errorPublisher.publish(err)
        )
        this._currentPromise = this._currentExecutor.execute()
        await this._currentPromise
      }
    }
    loop()
  }

  async stop (): Promise<void> {
    this._running = false
    await this._waitForStartedPromise()
  }

  isRunning (): boolean {
    return this._running
  }

  onFunctionError (callback: (Error) => void) {
    this._errorPublisher.addSubscriber(callback)
  }

  async _waitForStartedPromise (): Promise<void> {
    if (!this._currentExecutor) {
      return
    }
    this._currentExecutor.cancel()
    await this._currentPromise
  }
}

export { FunctionLooper, ThresholdExecutor }
