import { localesList } from 'locales'
import * as React from 'react'
import 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import Language from 'src/language/Language'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

describe('Language', () => {
  it('renders correctly and sets the right language', () => {
    const store = createMockStore()
    const { getByText } = render(
      <Provider store={store}>
        <Language {...getMockStackScreenProps(Screens.Language)} />
      </Provider>
    )

    localesList.forEach(({ name }) => {
      expect(getByText(name)).toBeDefined()
    })

    fireEvent.press(getByText('Español'))
    jest.runAllTimers()
    expect(navigate).toHaveBeenCalledWith(Screens.OnboardingEducationScreen)
    expect(store.getActions()).toMatchInlineSnapshot(`
      Array [
        Object {
          "language": "es-419",
          "type": "APP/SET_LANGUAGE",
        },
      ]
    `)
  })
})
