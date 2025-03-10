import Button from '@celo/react-components/components/Button'
import ListItem from '@celo/react-components/components/ListItem'
import TextButton from '@celo/react-components/components/TextButton'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import AccountNumber from 'src/components/AccountNumber'
import BackButton from 'src/components/BackButton'
import { EXCHANGE_PROVIDER_LINKS } from 'src/config'
import SendBar from 'src/home/SendBar'
import i18n from 'src/i18n'
import LinkArrow from 'src/icons/LinkArrow'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { CURRENCIES, Currency } from 'src/utils/currencies'
import { navigateToURI } from 'src/utils/linking'
import { currentAccountSelector } from 'src/web3/selectors'

export const externalExchangesScreenOptions = () => {
  const eventName = FiatExchangeEvents.cico_external_exchanges_back

  return {
    ...emptyHeader,
    headerLeft: () => <BackButton eventName={eventName} />,
    headerTitle: i18n.t('fiatExchangeFlow:exchanges'),
  }
}

export interface ExternalExchangeProvider {
  name: string
  link: string
  currencies: Currency[]
}

type Props = StackScreenProps<StackParamList, Screens.ExternalExchanges>

function ExternalExchanges({ route }: Props) {
  const account = useSelector(currentAccountSelector)
  const isCashIn = route.params?.isCashIn ?? true

  const goToExchange = (provider: ExternalExchangeProvider) => {
    const { name, link } = provider
    return () => {
      ValoraAnalytics.track(FiatExchangeEvents.external_exchange_link, {
        name,
        link,
      })
      navigateToURI(link)
    }
  }

  const supportOnPress = () => navigate(Screens.SupportContact)

  const switchCurrencyOnPress = () => navigate(Screens.FiatExchangeOptions, { isCashIn: false })

  const goToCashOut = () => {
    navigate(Screens.WithdrawCeloScreen, { isCashOut: true })
    ValoraAnalytics.track(FiatExchangeEvents.cico_celo_exchange_send_bar_continue)
  }
  const { t } = useTranslation('fiatExchangeFlow')

  // TODO Dynamically fetch exchange provider links so they can be updated between releases
  const providers: ExternalExchangeProvider[] = EXCHANGE_PROVIDER_LINKS.filter(
    (provider) => provider.currencies.indexOf(route.params.currency) >= 0
  )

  return (
    <SafeAreaView style={styles.container}>
      {providers.length === 0 ? (
        <View style={styles.noExchangesContainer}>
          <Text testID="NoExchanges" style={styles.noExchanges}>
            {t('noExchanges', { digitalAsset: CURRENCIES[route.params.currency].cashTag })}
          </Text>
          <TextButton
            testID={'SwitchCurrency'}
            style={styles.switchCurrency}
            onPress={switchCurrencyOnPress}
          >
            {t('switchCurrency')}
          </TextButton>
          <TextButton
            testID={'ContactSupport'}
            style={styles.contactSupport}
            onPress={supportOnPress}
          >
            {t('global:contactSupport')}
          </TextButton>
        </View>
      ) : isCashIn ? (
        <>
          <Text style={styles.pleaseSelectExchange}>
            {t('youCanTransferIn', {
              digitalAsset: CURRENCIES[route.params.currency].cashTag,
            })}
          </Text>
          <View testID="accountBox" style={styles.accountBox}>
            <Text style={styles.accountLabel}>{t('sendFlow7:accountNumberLabel')}</Text>
            <AccountNumber address={account || ''} location={Screens.ExternalExchanges} />
          </View>
        </>
      ) : (
        <Text style={styles.pleaseSelectExchange}>
          {t('youCanTransferOut', {
            digitalAsset: CURRENCIES[route.params.currency].cashTag,
          })}
        </Text>
      )}

      <ScrollView style={styles.exchangesContainer}>
        {providers.map((provider) => {
          return (
            <ListItem key={provider.name} onPress={goToExchange(provider)}>
              <View testID={provider.name} style={styles.providerListItem}>
                <Text style={styles.optionTitle}>{provider.name}</Text>
                <LinkArrow />
              </View>
            </ListItem>
          )
        })}
      </ScrollView>
      {!isCashIn && providers.length ? (
        route.params.currency === Currency.Dollar || route.params.currency === Currency.Euro ? (
          <SendBar skipImport={true} selectedCurrency={route.params.currency} />
        ) : (
          <View style={styles.buttonContainer}>
            <Button
              testID="WithdrawCeloButton"
              style={styles.celoOutButton}
              text={t('sendFlow7:withdrawToken', {
                token: CURRENCIES[route.params.currency].cashTag,
              })}
              onPress={() => goToCashOut()}
            />
          </View>
        )
      ) : (
        <></>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: variables.contentPadding,
  },
  pleaseSelectExchange: {
    ...fontStyles.regular,
    paddingHorizontal: variables.contentPadding,
    paddingBottom: variables.contentPadding,
  },
  accountBox: {
    borderRadius: 4,
    backgroundColor: colors.gray2,
    flexDirection: 'column',
    padding: variables.contentPadding,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  accountLabel: {
    ...fontStyles.label,
    color: colors.gray5,
  },
  providerListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 4,
  },
  exchangesContainer: {
    paddingRight: variables.contentPadding,
  },
  optionTitle: {
    flex: 3,
    ...fontStyles.regular,
  },
  noExchangesContainer: {
    alignItems: 'center',
    padding: 24,
  },
  noExchanges: {
    ...fontStyles.regular,
    padding: variables.contentPadding,
    textAlign: 'center',
  },
  switchCurrency: {
    ...fontStyles.large500,
    color: colors.greenUI,
    padding: 8,
  },
  contactSupport: {
    ...fontStyles.large500,
    color: colors.gray4,
    padding: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: variables.contentPadding,
    paddingVertical: 12,
    borderTopColor: colors.gray2,
    borderTopWidth: 1,
  },
  celoOutButton: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
})

export default ExternalExchanges
