import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { throwError } from 'redux-saga-test-plan/providers'
import { call, select } from 'redux-saga/effects'
import {
  fetchCurrentRate,
  fetchCurrentRateFailure,
  fetchCurrentRateSuccess,
  selectPreferredCurrency,
} from 'src/localCurrency/actions'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import {
  fetchExchangeRate,
  watchFetchCurrentRate,
  watchSelectPreferredCurrency,
} from 'src/localCurrency/saga'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { Currency } from 'src/utils/currencies'

const now = Date.now()
Date.now = jest.fn(() => now)

describe(watchFetchCurrentRate, () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('fetches the local currency rate and dispatches the success action', async () => {
    await expectSaga(watchFetchCurrentRate)
      .provide([
        [select(getLocalCurrencyCode), LocalCurrencyCode.MXN],
        [call(fetchExchangeRate, Currency.Dollar, LocalCurrencyCode.MXN), '1.33'],
        [call(fetchExchangeRate, Currency.Euro, LocalCurrencyCode.MXN), '2.12'],
        [call(fetchExchangeRate, Currency.Celo, LocalCurrencyCode.MXN), '3.543'],
      ])
      .put(
        fetchCurrentRateSuccess(
          LocalCurrencyCode.MXN,
          { [Currency.Dollar]: '1.33', [Currency.Euro]: '2.12', [Currency.Celo]: '3.543' },
          now
        )
      )
      .dispatch(fetchCurrentRate())
      .run()
  })

  it('fetches the local currency rate and dispatches the failure action when it fails', async () => {
    await expectSaga(watchFetchCurrentRate)
      .provide([
        [select(getLocalCurrencyCode), LocalCurrencyCode.MXN],
        [matchers.call.fn(fetchExchangeRate), throwError(new Error('test error'))],
      ])
      .put(fetchCurrentRateFailure())
      .dispatch(fetchCurrentRate())
      .run()
  })
})

describe(watchSelectPreferredCurrency, () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('fetches the local currency rate when the preferred currency changes', async () => {
    await expectSaga(watchSelectPreferredCurrency)
      .put(fetchCurrentRate())
      .dispatch(selectPreferredCurrency(LocalCurrencyCode.MXN))
      .run()
  })
})
