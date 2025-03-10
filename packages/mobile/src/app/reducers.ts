import { Platform } from 'react-native'
import { Actions, ActionTypes, AppState } from 'src/app/actions'
import { FEATURE_FLAG_DEFAULTS } from 'src/firebase/featureFlagDefaults'
import i18n from 'src/i18n'
import { Screens } from 'src/navigator/Screens'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { RootState } from 'src/redux/reducers'

export interface State {
  loggedIn: boolean
  numberVerified: boolean
  language: string | null
  analyticsEnabled: boolean
  requirePinOnAppOpen: boolean
  appState: AppState
  locked: boolean
  lastTimeBackgrounded: number
  sessionId: string
  minVersion: string | null
  celoEducationUri: string | null
  celoEuroEnabled: boolean
  shortVerificationCodesEnabled: boolean
  inviteModalVisible: boolean
  activeScreen: Screens
  hideVerification: boolean
  showRaiseDailyLimitTarget: string | undefined
  walletConnectEnabled: boolean
  rewardsPercent: number
  rewardsStartDate: number
  rewardsMax: number
  rewardsMin: number
  rewardsABTestThreshold: string
  // In 1.13 we had a critical error which requires a migration to fix. See |verificationMigration.ts|
  // for the migration code. We can remove all the code associated with this after some time has passed.
  ranVerificationMigrationAt: number | null | undefined
  googleMobileServicesAvailable: boolean | undefined
  huaweiMobileServicesAvailable: boolean | undefined
  pincodeUseExpandedBlocklist: boolean
  rewardPillText?: {
    [lang: string]: string
  }
  cashInButtonExpEnabled: boolean
}

const initialState = {
  loading: false,
  loggedIn: false,
  numberVerified: false,
  language: null,
  analyticsEnabled: true,
  requirePinOnAppOpen: false,
  appState: AppState.Active,
  locked: false,
  lastTimeBackgrounded: 0,
  sessionId: '',
  minVersion: null,
  shortVerificationCodesEnabled: FEATURE_FLAG_DEFAULTS.shortVerificationCodesEnabled,
  celoEducationUri: null,
  celoEuroEnabled: FEATURE_FLAG_DEFAULTS.celoEuroEnabled,
  inviteModalVisible: false,
  activeScreen: Screens.Main,
  hideVerification: FEATURE_FLAG_DEFAULTS.hideVerification,
  showRaiseDailyLimitTarget: undefined,
  walletConnectEnabled: FEATURE_FLAG_DEFAULTS.walletConnectEnabled,
  rewardsPercent: FEATURE_FLAG_DEFAULTS.rewardsPercent,
  rewardsStartDate: FEATURE_FLAG_DEFAULTS.rewardsStartDate,
  rewardsMax: FEATURE_FLAG_DEFAULTS.rewardsMax,
  rewardsMin: FEATURE_FLAG_DEFAULTS.rewardsMin,
  rewardsABTestThreshold: FEATURE_FLAG_DEFAULTS.rewardsABTestThreshold,
  ranVerificationMigrationAt: null,
  googleMobileServicesAvailable: undefined,
  huaweiMobileServicesAvailable: undefined,
  pincodeUseExpandedBlocklist: FEATURE_FLAG_DEFAULTS.pincodeUseExpandedBlocklist,
  rewardPillText: JSON.parse(FEATURE_FLAG_DEFAULTS.rewardPillText),
  cashInButtonExpEnabled: false,
}

export const currentLanguageSelector = (state: RootState) => state.app.language || i18n.language

export const appReducer = (
  state: State | undefined = initialState,
  action: ActionTypes | RehydrateAction
): State => {
  switch (action.type) {
    case REHYDRATE: {
      // Ignore some persisted properties
      const rehydratePayload = getRehydratePayload(action, 'app')
      return {
        ...state,
        ...rehydratePayload,
        appState: initialState.appState,
        locked: rehydratePayload.requirePinOnAppOpen ?? initialState.locked,
        sessionId: '',
      }
    }
    case Actions.SET_APP_STATE:
      let { appState, lastTimeBackgrounded } = state
      switch (action.state) {
        case 'background':
          if (Platform.OS === 'android') {
            lastTimeBackgrounded = Date.now()
          }
          appState = AppState.Background
          break
        case 'inactive': // occurs only on iOS
          lastTimeBackgrounded = Date.now()
          appState = AppState.Inactive
          break
        case 'active':
          appState = AppState.Active
          break
      }
      return {
        ...state,
        appState,
        lastTimeBackgrounded,
      }
    case Actions.SET_LOGGED_IN:
      return {
        ...state,
        loggedIn: action.loggedIn,
      }
    case Actions.SET_NUMBER_VERIFIED:
      return {
        ...state,
        numberVerified: action.numberVerified,
      }
    case Actions.SET_LANGUAGE:
      return {
        ...state,
        language: action.language,
      }
    case Actions.RESET_APP_OPENED_STATE:
      return {
        ...state,
        loggedIn: false,
        numberVerified: false,
        language: null,
      }
    case Actions.SET_ANALYTICS_ENABLED:
      return {
        ...state,
        analyticsEnabled: action.enabled,
      }
    case Actions.SET_LOCK_WITH_PIN_ENABLED:
      return {
        ...state,
        requirePinOnAppOpen: action.enabled,
      }
    case Actions.LOCK:
      return {
        ...state,
        locked: true,
      }
    case Actions.UNLOCK:
      return {
        ...state,
        locked: false,
      }
    case Actions.SET_SESSION_ID:
      return {
        ...state,
        sessionId: action.sessionId,
      }
    case Actions.MIN_APP_VERSION_DETERMINED:
      return {
        ...state,
        minVersion: action.minVersion,
      }
    case Actions.UPDATE_FEATURE_FLAGS:
      return {
        ...state,
        hideVerification: action.flags.hideVerification,
        showRaiseDailyLimitTarget: action.flags.showRaiseDailyLimitTarget,
        celoEducationUri: action.flags.celoEducationUri,
        celoEuroEnabled: action.flags.celoEuroEnabled,
        shortVerificationCodesEnabled: action.flags.shortVerificationCodesEnabled,
        walletConnectEnabled: action.flags.walletConnectEnabled,
        rewardsPercent: action.flags.rewardsPercent,
        rewardsStartDate: action.flags.rewardsStartDate,
        rewardsMax: action.flags.rewardsMax,
        rewardsMin: action.flags.rewardsMin,
        rewardsABTestThreshold: action.flags.rewardsABTestThreshold,
        pincodeUseExpandedBlocklist: action.flags.pincodeUseExpandedBlocklist,
        rewardPillText: JSON.parse(action.flags.rewardPillText),
        cashInButtonExpEnabled: action.flags.cashInButtonExpEnabled,
      }
    case Actions.TOGGLE_INVITE_MODAL:
      return {
        ...state,
        inviteModalVisible: action.inviteModalVisible,
      }
    case Actions.ACTIVE_SCREEN_CHANGED:
      return {
        ...state,
        activeScreen: action.activeScreen,
      }
    case Actions.VERIFICATION_MIGRATION_RAN:
      return {
        ...state,
        ranVerificationMigrationAt: action.now,
        numberVerified: action.isVerified,
      }
    case Actions.ANDROID_MOBILE_SERVICES_AVAILABILITY_CHECKED:
      return {
        ...state,
        googleMobileServicesAvailable: action.googleIsAvailable,
        huaweiMobileServicesAvailable: action.huaweiIsAvailable,
      }
    default:
      return state
  }
}
