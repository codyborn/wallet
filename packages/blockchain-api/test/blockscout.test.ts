import { BlockscoutAPI } from '../src/blockscout'
import mockTokenTxs from './mockTokenTxs'

const mockDataSourcePost = jest.fn(() => mockTokenTxs)

jest.mock('apollo-datasource-rest', () => {
  class MockRESTDataSource {
    baseUrl = ''
    post = mockDataSourcePost
  }

  return {
    RESTDataSource: MockRESTDataSource,
  }
})

jest.mock('../src/config.ts', () => {
  return {
    ...(jest.requireActual('../src/config.ts') as any),
    FAUCET_ADDRESS: '0x0000000000000000000000000000000000f40c37',
  }
})

jest.mock('../src/utils.ts', () => {
  const contractGetter = jest.fn()
  const tokenAddressMapping: { [key: string]: string } = {
    ['0x000000000000000000000000000000000000gold']: 'Celo Gold',
    ['0x0000000000000000000000000000000000dollar']: 'Celo Dollar',
  }
  contractGetter.mockReturnValue({
    tokenAddressMapping,
    goldTokenAddress: '0x000000000000000000000000000000000000gold',
    stableTokenAddress: '0x0000000000000000000000000000000000dollar',
    Attestations: '0x0000000000000000000000000000000000a77357',
    Escrow: '0x0000000000000000000000000000000000a77327',
    Exchange: '0xf1235cb0d3703e7cc2473fb4e214fbc7a9ff77cc',
    ExchangeEUR: '0xd1235cb0d3703e7cc2473fb4e214fbc7a9ff77cc',
    Governance: '0xa12a699c641cc875a7ca57495861c79c33d293b4',
    Reserve: '0x6a61e1e693c765cbab7e02a500665f2e13ee46df',
  })
  return {
    ...(jest.requireActual('../src/utils.ts') as any),
    getContractAddresses: contractGetter,
  }
})

jest.mock('../src/helpers/KnownAddressesCache.ts', () => {
  return {
    startListening: {},
    getDisplayInfoFor: jest.fn().mockImplementation((address: string) => {
      switch (address) {
        case '0xf4314cb9046bece6aa54bb9533155434d0c76909':
          return { name: 'Test Name', imageUrl: 'Test Image' }
        case '0xa12a699c641cc875a7ca57495861c79c33d293b4':
          return { name: 'Test Only Name' }
        default:
          return {}
      }
    }),
  }
})

describe('Blockscout', () => {
  let blockscoutAPI: BlockscoutAPI

  beforeEach(() => {
    blockscoutAPI = new BlockscoutAPI()
    mockDataSourcePost.mockClear()
  })

  it('should get dollar transactions and label them properly', async () => {
    const result = await blockscoutAPI.getTokenTransactions({
      address: '0x0000000000000000000000000000000000007E57',
      token: 'cUSD',
      localCurrencyCode: 'MXN',
    })

    // Reversing for convenience to match the order in mock data
    const transactions = result.reverse()

    expect(transactions).toMatchInlineSnapshot(`
      Array [
        Object {
          "amount": Object {
            "currencyCode": "cUSD",
            "impliedExchangeRates": Object {
              "cGLD/cUSD": "10",
            },
            "timestamp": 1566345797000,
            "value": "-10",
          },
          "block": "90608",
          "fees": Array [
            Object {
              "amount": Object {
                "currencyCode": "cUSD",
                "timestamp": 1566345797000,
                "value": "0",
              },
              "type": "GATEWAY_FEE",
            },
            Object {
              "amount": Object {
                "currencyCode": "cUSD",
                "timestamp": 1566345797000,
                "value": "0.010091957572465625",
              },
              "type": "SECURITY_FEE",
            },
          ],
          "hash": "0xba620de2d812f299d987155eb5dca7abcfeaf154f5cfd99cb1773452a7df3d7a",
          "makerAmount": Object {
            "currencyCode": "cUSD",
            "impliedExchangeRates": Object {
              "cGLD/cUSD": "10",
            },
            "timestamp": 1566345797000,
            "value": "10",
          },
          "takerAmount": Object {
            "currencyCode": "cGLD",
            "impliedExchangeRates": Object {
              "cGLD/cUSD": "10",
            },
            "timestamp": 1566345797000,
            "value": "1",
          },
          "timestamp": 1566345797000,
          "type": "EXCHANGE",
        },
        Object {
          "amount": Object {
            "currencyCode": "cUSD",
            "impliedExchangeRates": Object {
              "cGLD/cUSD": "10",
            },
            "timestamp": 1566345926000,
            "value": "10",
          },
          "block": "90637",
          "fees": Array [
            Object {
              "amount": Object {
                "currencyCode": "cUSD",
                "timestamp": 1566345926000,
                "value": "0",
              },
              "type": "GATEWAY_FEE",
            },
            Object {
              "amount": Object {
                "currencyCode": "cUSD",
                "timestamp": 1566345926000,
                "value": "0.01102543453093182",
              },
              "type": "SECURITY_FEE",
            },
          ],
          "hash": "0x961403536006f9c120c23900f94da59dbf43edf10eb3569b448665483bab77b2",
          "makerAmount": Object {
            "currencyCode": "cGLD",
            "impliedExchangeRates": Object {
              "cGLD/cUSD": "10",
            },
            "timestamp": 1566345926000,
            "value": "1",
          },
          "takerAmount": Object {
            "currencyCode": "cUSD",
            "impliedExchangeRates": Object {
              "cGLD/cUSD": "10",
            },
            "timestamp": 1566345926000,
            "value": "10",
          },
          "timestamp": 1566345926000,
          "type": "EXCHANGE",
        },
        Object {
          "account": "0x8b7649116f169d2d2aebb6ea1a77f0baf31f2811",
          "address": "0x8b7649116f169d2d2aebb6ea1a77f0baf31f2811",
          "amount": Object {
            "currencyCode": "cUSD",
            "timestamp": 1566346276000,
            "value": "-0.15",
          },
          "block": "90719",
          "comment": "",
          "defaultImage": undefined,
          "defaultName": undefined,
          "fees": Array [
            Object {
              "amount": Object {
                "currencyCode": "cUSD",
                "timestamp": 1566346276000,
                "value": "0.01",
              },
              "type": "GATEWAY_FEE",
            },
            Object {
              "amount": Object {
                "currencyCode": "cUSD",
                "timestamp": 1566346276000,
                "value": "0.0056589",
              },
              "type": "SECURITY_FEE",
            },
          ],
          "hash": "0x21dd2c18ae6c80d61ffbddaa073f7cde7bbfe9436fdf5059b506f1686326a2fb",
          "timestamp": 1566346276000,
          "type": "SENT",
        },
        Object {
          "account": "0xa12a699c641cc875a7ca57495861c79c33d293b4",
          "address": "0xa12a699c641cc875a7ca57495861c79c33d293b4",
          "amount": Object {
            "currencyCode": "cUSD",
            "timestamp": 1566346336000,
            "value": "-0.15",
          },
          "block": "90791",
          "comment": "",
          "defaultImage": undefined,
          "defaultName": "Test Only Name",
          "fees": Array [
            Object {
              "amount": Object {
                "currencyCode": "cUSD",
                "timestamp": 1566346336000,
                "value": "0.01",
              },
              "type": "GATEWAY_FEE",
            },
            Object {
              "amount": Object {
                "currencyCode": "cUSD",
                "timestamp": 1566346336000,
                "value": "0.0056589",
              },
              "type": "SECURITY_FEE",
            },
          ],
          "hash": "0x21dd2c18ae6c80d61ffbddaa073f7cde7bbfe9436fdf5059b506f1686326a2ff",
          "timestamp": 1566346336000,
          "type": "SENT",
        },
        Object {
          "account": "0x6a0edf42f5e618bee697e7718fa05efb1ea5d11c",
          "address": "0x6a0edf42f5e618bee697e7718fa05efb1ea5d11c",
          "amount": Object {
            "currencyCode": "cUSD",
            "timestamp": 1566346396000,
            "value": "-0.15",
          },
          "block": "90792",
          "comment": "",
          "defaultImage": undefined,
          "defaultName": undefined,
          "fees": Array [
            Object {
              "amount": Object {
                "currencyCode": "cUSD",
                "timestamp": 1566346396000,
                "value": "0.01",
              },
              "type": "GATEWAY_FEE",
            },
            Object {
              "amount": Object {
                "currencyCode": "cUSD",
                "timestamp": 1566346396000,
                "value": "0.0056589",
              },
              "type": "SECURITY_FEE",
            },
          ],
          "hash": "0x21dd2c18ae6c80d61ffbddaa073f7cde7bbfe9436fdf5059b506f1686326afff",
          "timestamp": 1566346396000,
          "type": "SENT",
        },
        Object {
          "account": "0xf4314cb9046bece6aa54bb9533155434d0c76910",
          "address": "0xf4314cb9046bece6aa54bb9533155434d0c76909",
          "amount": Object {
            "currencyCode": "cUSD",
            "timestamp": 1566479946000,
            "value": "10",
          },
          "block": "117453",
          "comment": "",
          "defaultImage": "Test Image",
          "defaultName": "Test Name",
          "hash": "0xe70bf600802bae7a0d42d89d54b8cdb977a8c5a34a239ec73597c7abcab74536",
          "timestamp": 1566479946000,
          "type": "RECEIVED",
        },
        Object {
          "account": "0x0000000000000000000000000000000000a77327",
          "address": "0x0000000000000000000000000000000000a77327",
          "amount": Object {
            "currencyCode": "cUSD",
            "timestamp": 1566483998000,
            "value": "-0.118829058457955309",
          },
          "block": "117451",
          "comment": "",
          "defaultImage": undefined,
          "defaultName": undefined,
          "fees": Array [
            Object {
              "amount": Object {
                "currencyCode": "cUSD",
                "timestamp": 1566483998000,
                "value": "0.0005911869963022",
              },
              "type": "SECURITY_FEE",
            },
          ],
          "hash": "0xf0592e026656f84cc17672fb08f5723deb8426787c2865aa763e859d10e85234",
          "timestamp": 1566483998000,
          "type": "ESCROW_SENT",
        },
        Object {
          "account": "0x0000000000000000000000000000000000a77327",
          "address": "0x0000000000000000000000000000000000a77327",
          "amount": Object {
            "currencyCode": "cUSD",
            "timestamp": 1618593019000,
            "value": "20",
          },
          "block": "6203333",
          "comment": "",
          "defaultImage": undefined,
          "defaultName": undefined,
          "hash": "0x8323ad9ea0961221e146aa086b9cda858acbf7a4058a23061c9e0d52a0e2d9b1",
          "timestamp": 1618593019000,
          "type": "ESCROW_RECEIVED",
        },
        Object {
          "account": "0x0000000000000000000000000000000000a77357",
          "address": "0x0000000000000000000000000000000000a77357",
          "amount": Object {
            "currencyCode": "cUSD",
            "timestamp": 1618593079000,
            "value": "-0.2",
          },
          "block": "117451",
          "comment": "",
          "defaultImage": undefined,
          "defaultName": undefined,
          "fees": Array [
            Object {
              "amount": Object {
                "currencyCode": "cUSD",
                "timestamp": 1618593079000,
                "value": "0.00795255",
              },
              "type": "SECURITY_FEE",
            },
          ],
          "hash": "0xcc2120e5d050fd68284dc01f6464b2ed8f7358ca80fccb20967af28eb7d79160",
          "timestamp": 1618593079000,
          "type": "VERIFICATION_FEE",
        },
        Object {
          "account": "0x0000000000000000000000000000000000007E57",
          "address": "0x0000000000000000000000000000000000007E57",
          "amount": Object {
            "currencyCode": "cUSD",
            "timestamp": 1621185010000,
            "value": "-1",
          },
          "block": "1487877",
          "comment": "",
          "defaultImage": undefined,
          "defaultName": undefined,
          "fees": Array [
            Object {
              "amount": Object {
                "currencyCode": "cUSD",
                "timestamp": 1621185010000,
                "value": "0.000051519",
              },
              "type": "SECURITY_FEE",
            },
            Object {
              "amount": Object {
                "currencyCode": "cUSD",
                "timestamp": 1621185010000,
                "value": "0.000094212",
              },
              "type": "ONE_TIME_ENCRYPTION_FEE",
            },
          ],
          "hash": "0x34e6e74bc01c7112817e669a8057ae7f4c1ed49d8de824bea8ecbdb945b41345",
          "timestamp": 1621185010000,
          "type": "SENT",
        },
      ]
    `)
  })

  it('should get gold transactions and label them properly', async () => {
    const result = await blockscoutAPI.getTokenTransactions({
      address: '0x0000000000000000000000000000000000007E57',
      token: 'cGLD',
      localCurrencyCode: 'MXN',
    })

    // Reversing for convenience to match the order in mock data
    const transactions = result.reverse()

    expect(transactions).toMatchInlineSnapshot(`
      Array [
        Object {
          "amount": Object {
            "currencyCode": "cGLD",
            "impliedExchangeRates": Object {
              "cGLD/cUSD": "10",
            },
            "timestamp": 1566345797000,
            "value": "1",
          },
          "block": "90608",
          "fees": Array [
            Object {
              "amount": Object {
                "currencyCode": "cUSD",
                "timestamp": 1566345797000,
                "value": "0",
              },
              "type": "GATEWAY_FEE",
            },
            Object {
              "amount": Object {
                "currencyCode": "cUSD",
                "timestamp": 1566345797000,
                "value": "0.010091957572465625",
              },
              "type": "SECURITY_FEE",
            },
          ],
          "hash": "0xba620de2d812f299d987155eb5dca7abcfeaf154f5cfd99cb1773452a7df3d7a",
          "makerAmount": Object {
            "currencyCode": "cUSD",
            "impliedExchangeRates": Object {
              "cGLD/cUSD": "10",
            },
            "timestamp": 1566345797000,
            "value": "10",
          },
          "takerAmount": Object {
            "currencyCode": "cGLD",
            "impliedExchangeRates": Object {
              "cGLD/cUSD": "10",
            },
            "timestamp": 1566345797000,
            "value": "1",
          },
          "timestamp": 1566345797000,
          "type": "EXCHANGE",
        },
        Object {
          "amount": Object {
            "currencyCode": "cGLD",
            "impliedExchangeRates": Object {
              "cGLD/cUSD": "10",
            },
            "timestamp": 1566345926000,
            "value": "-1",
          },
          "block": "90637",
          "fees": Array [
            Object {
              "amount": Object {
                "currencyCode": "cUSD",
                "timestamp": 1566345926000,
                "value": "0",
              },
              "type": "GATEWAY_FEE",
            },
            Object {
              "amount": Object {
                "currencyCode": "cUSD",
                "timestamp": 1566345926000,
                "value": "0.01102543453093182",
              },
              "type": "SECURITY_FEE",
            },
          ],
          "hash": "0x961403536006f9c120c23900f94da59dbf43edf10eb3569b448665483bab77b2",
          "makerAmount": Object {
            "currencyCode": "cGLD",
            "impliedExchangeRates": Object {
              "cGLD/cUSD": "10",
            },
            "timestamp": 1566345926000,
            "value": "1",
          },
          "takerAmount": Object {
            "currencyCode": "cUSD",
            "impliedExchangeRates": Object {
              "cGLD/cUSD": "10",
            },
            "timestamp": 1566345926000,
            "value": "10",
          },
          "timestamp": 1566345926000,
          "type": "EXCHANGE",
        },
        Object {
          "account": "0xf4314cb9046bece6aa54bb9533155434d0c76910",
          "address": "0xf4314cb9046bece6aa54bb9533155434d0c76909",
          "amount": Object {
            "currencyCode": "cGLD",
            "timestamp": 1566481000000,
            "value": "-1",
          },
          "block": "117451",
          "comment": "",
          "defaultImage": "Test Image",
          "defaultName": "Test Name",
          "fees": Array [
            Object {
              "amount": Object {
                "currencyCode": "cGLD",
                "timestamp": 1566481000000,
                "value": "0.00023713",
              },
              "type": "SECURITY_FEE",
            },
          ],
          "hash": "0xc6689ed516e8b114e875d682bbf7ba318ea16841711d97ce473f20da289435be",
          "timestamp": 1566481000000,
          "type": "SENT",
        },
        Object {
          "account": "0xf4314cb9046bece6aa54bb9533155434d0c76909",
          "address": "0xf4314cb9046bece6aa54bb9533155434d0c76909",
          "amount": Object {
            "currencyCode": "cGLD",
            "timestamp": 1566481060000,
            "value": "-1",
          },
          "block": "117451",
          "comment": "",
          "defaultImage": "Test Image",
          "defaultName": "Test Name",
          "fees": Array [
            Object {
              "amount": Object {
                "currencyCode": "cGLD",
                "timestamp": 1566481060000,
                "value": "0.00000001",
              },
              "type": "GATEWAY_FEE",
            },
            Object {
              "amount": Object {
                "currencyCode": "cGLD",
                "timestamp": 1566481060000,
                "value": "0.00023713",
              },
              "type": "SECURITY_FEE",
            },
          ],
          "hash": "0xc6689ed516e8b114e875d682bbf7ba318ea16841711d97ce473f20da289435bd",
          "timestamp": 1566481060000,
          "type": "SENT",
        },
        Object {
          "account": "0xf4314cb9046bece6aa54bb9533155434d0c76909",
          "address": "0xf4314cb9046bece6aa54bb9533155434d0c76909",
          "amount": Object {
            "currencyCode": "cGLD",
            "timestamp": 1566482000000,
            "value": "10",
          },
          "block": "117451",
          "comment": "",
          "defaultImage": "Test Image",
          "defaultName": "Test Name",
          "hash": "0xe8fe81f455eb34b672a8d8dd091472f1ae8d4d204817f0bcbb7a13486b9b5605",
          "timestamp": 1566482000000,
          "type": "RECEIVED",
        },
        Object {
          "account": "0x0000000000000000000000000000000000f40c37",
          "address": "0x0000000000000000000000000000000000f40c37",
          "amount": Object {
            "currencyCode": "cGLD",
            "timestamp": 1566483000000,
            "value": "5",
          },
          "block": "117451",
          "comment": "",
          "defaultImage": undefined,
          "defaultName": undefined,
          "hash": "0xf6856169eb7bf78211babc312028cddf3dad2761799428ab6e4fcf297a27fe09",
          "timestamp": 1566483000000,
          "type": "FAUCET",
        },
      ]
    `)
  })

  it('should get all transactions and label them properly', async () => {
    const result = await blockscoutAPI.getTokenTransactions({
      address: '0x0000000000000000000000000000000000007E57',
      token: null,
      localCurrencyCode: 'MXN',
    })

    // Reversing for convenience to match the order in mock data
    const transactions = result.reverse()

    expect(transactions).toMatchInlineSnapshot(`
      Array [
        Object {
          "amount": Object {
            "currencyCode": "cUSD",
            "impliedExchangeRates": Object {
              "cGLD/cUSD": "10",
            },
            "timestamp": 1566345797000,
            "value": "-10",
          },
          "block": "90608",
          "fees": Array [
            Object {
              "amount": Object {
                "currencyCode": "cUSD",
                "timestamp": 1566345797000,
                "value": "0",
              },
              "type": "GATEWAY_FEE",
            },
            Object {
              "amount": Object {
                "currencyCode": "cUSD",
                "timestamp": 1566345797000,
                "value": "0.010091957572465625",
              },
              "type": "SECURITY_FEE",
            },
          ],
          "hash": "0xba620de2d812f299d987155eb5dca7abcfeaf154f5cfd99cb1773452a7df3d7a",
          "makerAmount": Object {
            "currencyCode": "cUSD",
            "impliedExchangeRates": Object {
              "cGLD/cUSD": "10",
            },
            "timestamp": 1566345797000,
            "value": "10",
          },
          "takerAmount": Object {
            "currencyCode": "cGLD",
            "impliedExchangeRates": Object {
              "cGLD/cUSD": "10",
            },
            "timestamp": 1566345797000,
            "value": "1",
          },
          "timestamp": 1566345797000,
          "type": "EXCHANGE",
        },
        Object {
          "amount": Object {
            "currencyCode": "cUSD",
            "impliedExchangeRates": Object {
              "cGLD/cUSD": "10",
            },
            "timestamp": 1566345926000,
            "value": "10",
          },
          "block": "90637",
          "fees": Array [
            Object {
              "amount": Object {
                "currencyCode": "cUSD",
                "timestamp": 1566345926000,
                "value": "0",
              },
              "type": "GATEWAY_FEE",
            },
            Object {
              "amount": Object {
                "currencyCode": "cUSD",
                "timestamp": 1566345926000,
                "value": "0.01102543453093182",
              },
              "type": "SECURITY_FEE",
            },
          ],
          "hash": "0x961403536006f9c120c23900f94da59dbf43edf10eb3569b448665483bab77b2",
          "makerAmount": Object {
            "currencyCode": "cGLD",
            "impliedExchangeRates": Object {
              "cGLD/cUSD": "10",
            },
            "timestamp": 1566345926000,
            "value": "1",
          },
          "takerAmount": Object {
            "currencyCode": "cUSD",
            "impliedExchangeRates": Object {
              "cGLD/cUSD": "10",
            },
            "timestamp": 1566345926000,
            "value": "10",
          },
          "timestamp": 1566345926000,
          "type": "EXCHANGE",
        },
        Object {
          "account": "0x8b7649116f169d2d2aebb6ea1a77f0baf31f2811",
          "address": "0x8b7649116f169d2d2aebb6ea1a77f0baf31f2811",
          "amount": Object {
            "currencyCode": "cUSD",
            "timestamp": 1566346276000,
            "value": "-0.15",
          },
          "block": "90719",
          "comment": "",
          "defaultImage": undefined,
          "defaultName": undefined,
          "fees": Array [
            Object {
              "amount": Object {
                "currencyCode": "cUSD",
                "timestamp": 1566346276000,
                "value": "0.01",
              },
              "type": "GATEWAY_FEE",
            },
            Object {
              "amount": Object {
                "currencyCode": "cUSD",
                "timestamp": 1566346276000,
                "value": "0.0056589",
              },
              "type": "SECURITY_FEE",
            },
          ],
          "hash": "0x21dd2c18ae6c80d61ffbddaa073f7cde7bbfe9436fdf5059b506f1686326a2fb",
          "timestamp": 1566346276000,
          "type": "SENT",
        },
        Object {
          "account": "0xa12a699c641cc875a7ca57495861c79c33d293b4",
          "address": "0xa12a699c641cc875a7ca57495861c79c33d293b4",
          "amount": Object {
            "currencyCode": "cUSD",
            "timestamp": 1566346336000,
            "value": "-0.15",
          },
          "block": "90791",
          "comment": "",
          "defaultImage": undefined,
          "defaultName": "Test Only Name",
          "fees": Array [
            Object {
              "amount": Object {
                "currencyCode": "cUSD",
                "timestamp": 1566346336000,
                "value": "0.01",
              },
              "type": "GATEWAY_FEE",
            },
            Object {
              "amount": Object {
                "currencyCode": "cUSD",
                "timestamp": 1566346336000,
                "value": "0.0056589",
              },
              "type": "SECURITY_FEE",
            },
          ],
          "hash": "0x21dd2c18ae6c80d61ffbddaa073f7cde7bbfe9436fdf5059b506f1686326a2ff",
          "timestamp": 1566346336000,
          "type": "SENT",
        },
        Object {
          "account": "0x6a0edf42f5e618bee697e7718fa05efb1ea5d11c",
          "address": "0x6a0edf42f5e618bee697e7718fa05efb1ea5d11c",
          "amount": Object {
            "currencyCode": "cUSD",
            "timestamp": 1566346396000,
            "value": "-0.15",
          },
          "block": "90792",
          "comment": "",
          "defaultImage": undefined,
          "defaultName": undefined,
          "fees": Array [
            Object {
              "amount": Object {
                "currencyCode": "cUSD",
                "timestamp": 1566346396000,
                "value": "0.01",
              },
              "type": "GATEWAY_FEE",
            },
            Object {
              "amount": Object {
                "currencyCode": "cUSD",
                "timestamp": 1566346396000,
                "value": "0.0056589",
              },
              "type": "SECURITY_FEE",
            },
          ],
          "hash": "0x21dd2c18ae6c80d61ffbddaa073f7cde7bbfe9436fdf5059b506f1686326afff",
          "timestamp": 1566346396000,
          "type": "SENT",
        },
        Object {
          "account": "0xf4314cb9046bece6aa54bb9533155434d0c76910",
          "address": "0xf4314cb9046bece6aa54bb9533155434d0c76909",
          "amount": Object {
            "currencyCode": "cUSD",
            "timestamp": 1566479946000,
            "value": "10",
          },
          "block": "117453",
          "comment": "",
          "defaultImage": "Test Image",
          "defaultName": "Test Name",
          "hash": "0xe70bf600802bae7a0d42d89d54b8cdb977a8c5a34a239ec73597c7abcab74536",
          "timestamp": 1566479946000,
          "type": "RECEIVED",
        },
        Object {
          "account": "0xf4314cb9046bece6aa54bb9533155434d0c76910",
          "address": "0xf4314cb9046bece6aa54bb9533155434d0c76909",
          "amount": Object {
            "currencyCode": "cGLD",
            "timestamp": 1566481000000,
            "value": "-1",
          },
          "block": "117451",
          "comment": "",
          "defaultImage": "Test Image",
          "defaultName": "Test Name",
          "fees": Array [
            Object {
              "amount": Object {
                "currencyCode": "cGLD",
                "timestamp": 1566481000000,
                "value": "0.00023713",
              },
              "type": "SECURITY_FEE",
            },
          ],
          "hash": "0xc6689ed516e8b114e875d682bbf7ba318ea16841711d97ce473f20da289435be",
          "timestamp": 1566481000000,
          "type": "SENT",
        },
        Object {
          "account": "0xf4314cb9046bece6aa54bb9533155434d0c76909",
          "address": "0xf4314cb9046bece6aa54bb9533155434d0c76909",
          "amount": Object {
            "currencyCode": "cGLD",
            "timestamp": 1566481060000,
            "value": "-1",
          },
          "block": "117451",
          "comment": "",
          "defaultImage": "Test Image",
          "defaultName": "Test Name",
          "fees": Array [
            Object {
              "amount": Object {
                "currencyCode": "cGLD",
                "timestamp": 1566481060000,
                "value": "0.00000001",
              },
              "type": "GATEWAY_FEE",
            },
            Object {
              "amount": Object {
                "currencyCode": "cGLD",
                "timestamp": 1566481060000,
                "value": "0.00023713",
              },
              "type": "SECURITY_FEE",
            },
          ],
          "hash": "0xc6689ed516e8b114e875d682bbf7ba318ea16841711d97ce473f20da289435bd",
          "timestamp": 1566481060000,
          "type": "SENT",
        },
        Object {
          "account": "0xf4314cb9046bece6aa54bb9533155434d0c76909",
          "address": "0xf4314cb9046bece6aa54bb9533155434d0c76909",
          "amount": Object {
            "currencyCode": "cGLD",
            "timestamp": 1566482000000,
            "value": "10",
          },
          "block": "117451",
          "comment": "",
          "defaultImage": "Test Image",
          "defaultName": "Test Name",
          "hash": "0xe8fe81f455eb34b672a8d8dd091472f1ae8d4d204817f0bcbb7a13486b9b5605",
          "timestamp": 1566482000000,
          "type": "RECEIVED",
        },
        Object {
          "account": "0x0000000000000000000000000000000000f40c37",
          "address": "0x0000000000000000000000000000000000f40c37",
          "amount": Object {
            "currencyCode": "cGLD",
            "timestamp": 1566483000000,
            "value": "5",
          },
          "block": "117451",
          "comment": "",
          "defaultImage": undefined,
          "defaultName": undefined,
          "hash": "0xf6856169eb7bf78211babc312028cddf3dad2761799428ab6e4fcf297a27fe09",
          "timestamp": 1566483000000,
          "type": "FAUCET",
        },
        Object {
          "account": "0x0000000000000000000000000000000000a77327",
          "address": "0x0000000000000000000000000000000000a77327",
          "amount": Object {
            "currencyCode": "cUSD",
            "timestamp": 1566483998000,
            "value": "-0.118829058457955309",
          },
          "block": "117451",
          "comment": "",
          "defaultImage": undefined,
          "defaultName": undefined,
          "fees": Array [
            Object {
              "amount": Object {
                "currencyCode": "cUSD",
                "timestamp": 1566483998000,
                "value": "0.0005911869963022",
              },
              "type": "SECURITY_FEE",
            },
          ],
          "hash": "0xf0592e026656f84cc17672fb08f5723deb8426787c2865aa763e859d10e85234",
          "timestamp": 1566483998000,
          "type": "ESCROW_SENT",
        },
        Object {
          "account": "0x0000000000000000000000000000000000a77327",
          "address": "0x0000000000000000000000000000000000a77327",
          "amount": Object {
            "currencyCode": "cUSD",
            "timestamp": 1618593019000,
            "value": "20",
          },
          "block": "6203333",
          "comment": "",
          "defaultImage": undefined,
          "defaultName": undefined,
          "hash": "0x8323ad9ea0961221e146aa086b9cda858acbf7a4058a23061c9e0d52a0e2d9b1",
          "timestamp": 1618593019000,
          "type": "ESCROW_RECEIVED",
        },
        Object {
          "account": "0x0000000000000000000000000000000000a77357",
          "address": "0x0000000000000000000000000000000000a77357",
          "amount": Object {
            "currencyCode": "cUSD",
            "timestamp": 1618593079000,
            "value": "-0.2",
          },
          "block": "117451",
          "comment": "",
          "defaultImage": undefined,
          "defaultName": undefined,
          "fees": Array [
            Object {
              "amount": Object {
                "currencyCode": "cUSD",
                "timestamp": 1618593079000,
                "value": "0.00795255",
              },
              "type": "SECURITY_FEE",
            },
          ],
          "hash": "0xcc2120e5d050fd68284dc01f6464b2ed8f7358ca80fccb20967af28eb7d79160",
          "timestamp": 1618593079000,
          "type": "VERIFICATION_FEE",
        },
        Object {
          "account": "0x0000000000000000000000000000000000007E57",
          "address": "0x0000000000000000000000000000000000007E57",
          "amount": Object {
            "currencyCode": "cUSD",
            "timestamp": 1621185010000,
            "value": "-1",
          },
          "block": "1487877",
          "comment": "",
          "defaultImage": undefined,
          "defaultName": undefined,
          "fees": Array [
            Object {
              "amount": Object {
                "currencyCode": "cUSD",
                "timestamp": 1621185010000,
                "value": "0.000051519",
              },
              "type": "SECURITY_FEE",
            },
            Object {
              "amount": Object {
                "currencyCode": "cUSD",
                "timestamp": 1621185010000,
                "value": "0.000094212",
              },
              "type": "ONE_TIME_ENCRYPTION_FEE",
            },
          ],
          "hash": "0x34e6e74bc01c7112817e669a8057ae7f4c1ed49d8de824bea8ecbdb945b41345",
          "timestamp": 1621185010000,
          "type": "SENT",
        },
      ]
    `)
  })
})
