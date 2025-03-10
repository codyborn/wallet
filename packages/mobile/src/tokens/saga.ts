import { CeloTransactionObject } from '@celo/connect'
import { CeloContract, StableToken } from '@celo/contractkit'
import { GoldTokenWrapper } from '@celo/contractkit/lib/wrappers/GoldTokenWrapper'
import { StableTokenWrapper } from '@celo/contractkit/lib/wrappers/StableTokenWrapper'
import { retryAsync } from '@celo/utils/lib/async'
import BigNumber from 'bignumber.js'
import { all, call, put, select, spawn, take } from 'redux-saga/effects'
import { showErrorOrFallback } from 'src/alert/actions'
import { AppEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { TokenTransactionType } from 'src/apollo/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { WALLET_BALANCE_UPPER_BOUND } from 'src/config'
import { FeeInfo } from 'src/fees/saga'
import { readOnceFromFirebase } from 'src/firebase/firebase'
import { WEI_PER_TOKEN } from 'src/geth/consts'
import { setTokenBalances, Token } from 'src/tokens/reducer'
import { addStandbyTransaction, removeStandbyTransaction } from 'src/transactions/actions'
import { sendAndMonitorTransaction } from 'src/transactions/saga'
import { TransactionContext, TransactionStatus } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
import { getContractKitAsync } from 'src/web3/contracts'
import { getConnectedAccount, getConnectedUnlockedAccount } from 'src/web3/saga'
import { walletAddressSelector } from 'src/web3/selectors'
import * as utf8 from 'utf8'
import * as erc20 from './IERC20.json'

const TAG = 'tokens/saga'

// The number of wei that represent one unit in a contract
const contractWeiPerUnit: Record<Currency, BigNumber> = {
  [Currency.Celo]: WEI_PER_TOKEN,
  [Currency.Dollar]: WEI_PER_TOKEN,
  [Currency.Euro]: WEI_PER_TOKEN,
}

function* getWeiPerUnit(token: Currency) {
  let weiPerUnit = contractWeiPerUnit[token]
  if (!weiPerUnit) {
    const contract: GoldTokenWrapper | StableTokenWrapper = yield call(getTokenContract, token)
    const decimals: number = yield call(contract.decimals)
    weiPerUnit = new BigNumber(10).pow(decimals)
    contractWeiPerUnit[token] = weiPerUnit
  }
  return weiPerUnit
}

export function* convertFromContractDecimals(value: BigNumber, token: Currency) {
  const weiPerUnit: BigNumber = yield call(getWeiPerUnit, token)
  return value.dividedBy(weiPerUnit)
}

export function* convertToContractDecimals(value: BigNumber, token: Currency) {
  const weiPerUnit: BigNumber = yield call(getWeiPerUnit, token)
  return weiPerUnit.multipliedBy(value)
}

export async function getTokenContract(token: Currency) {
  Logger.debug(TAG + '@getTokenContract', `Fetching contract for ${token}`)
  const contractKit = await getContractKitAsync(false)
  switch (token) {
    case Currency.Celo:
      return contractKit.contracts.getGoldToken()
    case Currency.Dollar:
      return contractKit.contracts.getStableToken(StableToken.cUSD)
    case Currency.Euro:
      return contractKit.contracts.getStableToken(StableToken.cEUR)
    default:
      throw new Error(`Could not fetch contract for unknown token ${token}`)
  }
}

export async function getTokenContractFromAddress(tokenAddress: string) {
  Logger.debug(TAG + '@getTokenContract', `Fetching contract for address ${tokenAddress}`)
  const contractKit = await getContractKitAsync(false)
  const contracts = await Promise.all([
    contractKit.contracts.getGoldToken(),
    contractKit.contracts.getStableToken(StableToken.cUSD),
    contractKit.contracts.getStableToken(StableToken.cEUR),
  ])
  return contracts.find((contract) => contract.address === tokenAddress)
}

// TODO: To avoid making three requests each time this function is called, we should store the token
// addresses in the redux store. We will have to do this while working on multi-token support, so that
// is a good moment to clean this up.
export async function getStableCurrencyFromAddress(tokenAddress: string): Promise<Currency | null> {
  const contractKit = await getContractKitAsync(false)
  const [celoContract, cUsdContract, cEurContract] = await Promise.all([
    contractKit.contracts.getGoldToken(),
    contractKit.contracts.getStableToken(StableToken.cUSD),
    contractKit.contracts.getStableToken(StableToken.cEUR),
  ])
  if (celoContract.address === tokenAddress) {
    return Currency.Celo
  } else if (cUsdContract.address === tokenAddress) {
    return Currency.Dollar
  } else if (cEurContract.address === tokenAddress) {
    return Currency.Euro
  }
  return null
}

export function* fetchToken(token: Currency, tag: string) {
  try {
    Logger.debug(tag, `Fetching ${token} balance`)
    const account = yield call(getConnectedAccount)
    const tokenContract = yield call(getTokenContract, token)
    const balanceInWei: BigNumber = yield call([tokenContract, tokenContract.balanceOf], account)
    const balance: BigNumber = yield call(convertFromContractDecimals, balanceInWei, token)
    const balanceLogObject = { [`${token}Balance`]: balance.toString() }

    // Only update balances when it's less than the upper bound
    if (balance.lt(WALLET_BALANCE_UPPER_BOUND)) {
      ValoraAnalytics.track(AppEvents.fetch_balance, balanceLogObject)
      return balance.toString()
    } else {
      ValoraAnalytics.track(AppEvents.fetch_balance_error, balanceLogObject)
    }
  } catch (error) {
    Logger.error(tag, 'Error fetching balance', error)
  }
}

export interface BasicTokenTransfer {
  recipientAddress: string
  amount: BigNumber.Value
  comment: string
}

export interface TokenTransfer {
  recipientAddress: string
  amount: string
  currency: Currency
  comment: string
  feeInfo?: FeeInfo
  context: TransactionContext
}

export type TokenTransferAction = { type: string } & TokenTransfer

interface TokenTransferFactory {
  actionName: string
  tag: string
}

// TODO(martinvol) this should go to the SDK
export async function createTokenTransferTransaction(
  currency: Currency,
  transferAction: BasicTokenTransfer
) {
  const { recipientAddress, amount, comment } = transferAction
  const contract = await getTokenContract(currency)

  const decimals = await contract.decimals()
  const decimalBigNum = new BigNumber(decimals)
  const decimalFactor = new BigNumber(10).pow(decimalBigNum.toNumber())
  const convertedAmount = new BigNumber(amount).multipliedBy(decimalFactor).toFixed(0)

  const tx = contract.transferWithComment(
    recipientAddress,
    convertedAmount.toString(),
    utf8.encode(comment)
  )

  return tx
}

export async function fetchTokenBalanceInWeiWithRetry(token: Currency, account: string) {
  Logger.debug(TAG + '@fetchTokenBalanceInWeiWithRetry', 'Checking account balance', account)
  const tokenContract = await getTokenContract(token)
  // Retry needed here because it's typically the app's first tx and seems to fail on occasion
  // TODO consider having retry logic for ALL contract calls and txs. ContractKit should have this logic.
  const balanceInWei = await retryAsync(tokenContract.balanceOf, 3, [account])
  Logger.debug(
    TAG + '@fetchTokenBalanceInWeiWithRetry',
    `Account ${account} ${token} balance: ${balanceInWei.toString()}`
  )
  return balanceInWei
}

export function tokenTransferFactory({ actionName, tag }: TokenTransferFactory) {
  return function* () {
    while (true) {
      const transferAction: TokenTransferAction = yield take(actionName)
      const { recipientAddress, amount, currency, comment, feeInfo, context } = transferAction

      Logger.debug(
        tag,
        'Transferring token',
        context.description ?? 'No description',
        context.id,
        currency,
        amount,
        feeInfo ? JSON.stringify(feeInfo) : 'undefined'
      )

      yield put(
        addStandbyTransaction({
          context,
          type: TokenTransactionType.Sent,
          comment,
          status: TransactionStatus.Pending,
          value: amount.toString(),
          currency,
          timestamp: Math.floor(Date.now() / 1000),
          address: recipientAddress,
        })
      )

      try {
        const account: string = yield call(getConnectedUnlockedAccount)

        const tx: CeloTransactionObject<boolean> = yield call(
          createTokenTransferTransaction,
          currency,
          {
            recipientAddress,
            amount,
            comment,
          }
        )

        yield call(
          sendAndMonitorTransaction,
          tx,
          account,
          context,
          currency,
          feeInfo?.currency,
          feeInfo?.gas?.toNumber(),
          feeInfo?.gasPrice
        )
      } catch (error) {
        Logger.error(tag, 'Error transfering token', error)
        yield put(removeStandbyTransaction(context.id))
        yield put(showErrorOrFallback(error, ErrorMessages.TRANSACTION_FAILED))
      }
    }
  }
}

export async function getCurrencyAddress(currency: Currency) {
  const contractKit = await getContractKitAsync(false)
  switch (currency) {
    case Currency.Celo:
      return contractKit.registry.addressFor(CeloContract.GoldToken)
    case Currency.Dollar:
      return contractKit.registry.addressFor(CeloContract.StableToken)
    case Currency.Euro:
      return contractKit.registry.addressFor(CeloContract.StableTokenEUR)
  }
}

export async function getERC20TokenContract(tokenAddress: string) {
  const kit = await getContractKitAsync(false)
  //@ts-ignore
  return new kit.web3.eth.Contract(erc20.abi, tokenAddress)
}

export async function getERC20TokenBalance(token: Token, address: string) {
  let balance = null
  try {
    const contract = await getERC20TokenContract(token.address)
    balance = await contract.methods.balanceOf(address).call()
  } catch (error) {
    Logger.error(TAG, `error fetching balance for ${token.name}`, error)
  }
  return balance
}

export function* fetchReadableTokenBalance(address: string, token: Token) {
  let balance = yield call(getERC20TokenBalance, token, address)
  if (balance) {
    balance = balance / Math.pow(10, token.decimals)
  }
  return { [token.address]: { ...token, balance } }
}

export function* importTokenInfo() {
  const tokens: Token[] = yield call(readOnceFromFirebase, 'tokensInfo')
  const address: string = yield select(walletAddressSelector)
  const balances = yield all(
    tokens.map((token: Token) => call(fetchReadableTokenBalance, address, token))
  )
  yield put(setTokenBalances(Object.assign({}, ...balances)))
}

export function* tokensSaga() {
  yield spawn(importTokenInfo)
}
