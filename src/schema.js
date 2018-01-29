// graphql-tools combines a schema string with resolvers.
import { makeExecutableSchema } from 'graphql-tools';
import fetch from 'node-fetch';
import _ from 'lodash';
import camelcaseKeys from 'camelcase-keys';

// Construct a schema, using GraphQL schema language
const typeDefs = `
  type Query {
    currencies: [Currency]
    rates(currency: String!): ExchangeRates
    stats(start: Int!, limit: Int!): [Stat]
    exchanges: [Exchange]
    assets: [Asset]
    getAssetExchange(market: String!, pair: String!): Price
    getMarketExchange(market: String!, currency: String): [MarketExchange]
  }

  type Stat {
    id: String,
    name: String,
    symbol: String,
    rank: String,
    priceUsd: String,
    priceBtc: String,
    marketCapUsd: String,
    availableSupply: String,
    totalSupply: String,
    maxSupply: String,
    twentyfourhVolumeUsd: String,
    percentChange1h: String,
    percentChange24h: String,
    percentChange7d: String,
    lastUpdated: String
  }

  type Currency {
    id: String
    name: String
    min_size: String
  }

	type ExchangeRates {
		currency: String
    rates: [ExchangeRate]
	}

	type ExchangeRate {
		currency: String
		rate: String
	}

  type Asset {
    id: Int,
    symbol: String,
    name: String,
    fiat: Boolean,
    route: String
  }

  type Exchange {
    symbol: String,
    name: String,
    route: String,
    active: Boolean
  }

  type Price {
    price: Float,
  }

  type MarketExchange {
    id: Int,
    exchange: String,
    pair: String,
    active: String,
    route: String
    price: Price
  }

`;

// Provide resolver functions for your schema fields
const resolvers = {
  MarketExchange: {
    price: async ({ exchange, pair }) => {
      try {
        const results = await fetch(`https://api.cryptowat.ch/markets/${exchange}/${pair}/price`).then( async(res) => {
          return await res.json()
        })
        console.log(`https://api.cryptowat.ch/markets/${exchange}/${pair}/price`);
        console.log(results);
        return results.result;
      } catch(e) {
        console.log(e)
      }
    }
  },
  Query: {
    currencies: async () => {
      console.log('foo')

      try {
        const results = await fetch('https://api.coinbase.com/v2/currencies')
        const response = await results.json()
        const data = response.data
        return data
      } catch(e) {
        console.log(e)
      }
    },
    rates: async (root, { currency }) => {
      try {
        const results = await fetch(`https://api.coinbase.com/v2/exchange-rates?currency=${currency}`)
        return results.json()
      } catch(e) {
        console.log(e)
      }
    },
    stats: async (root, { start, limit }) => {
      try {
        const results = await fetch(`https://api.coinmarketcap.com/v1/ticker/?start=${start}&limit=${limit}`).then( async(res) => {
          return await res.json()
        })
        let arr = camelcaseKeys(results);
        arr.forEach(function(obj){
          if(obj.hasOwnProperty('24hVolumeUsd')){
            obj.twentyfourhVolumeUsd = obj['24hVolumeUsd']
            delete obj['24hVolumeUsd']
          }
        });
        return arr;
      } catch(e) {
        console.log(e)
      }
    },
    exchanges: async (root, args) => {
      try {
        const results = await fetch(`https://api.cryptowat.ch/exchanges`).then( async(res) => {
          return await res.json()
        })
        return results.result;
      } catch(e) {
        console.log(e)
      }
    },
    assets: async (root, args) => {
      try {
        const results = await fetch(`https://api.cryptowat.ch/assets`).then( async(res) => {
          return await res.json()
        })
        return results.result;
      } catch(e) {
        console.log(e)
      }
    },
    getAssetExchange: async (root, { market, pair}) => {
      try {
        const results = await fetch(`https://api.cryptowat.ch/markets/${market}/${pair}/price`).then( async(res) => {
          return await res.json()
        })
        return results.result;
      } catch(e) {
        console.log(e)
      }
    },
    getMarketExchange: async (root, { market, currency }) => {
      try {
        const results = await fetch(`https://api.cryptowat.ch/markets/${market}`).then( async(res) => {
          return await res.json()
        })
        let objs = results.result
        if(currency){
          objs = objs.filter((obj) => {
            return obj.pair.includes(currency)
          })
        }
        return objs;
      } catch(e) {
        console.log(e)
      }
    }

  },
  ExchangeRates: {
    currency: (({ data: { currency }}) => currency),
    rates: ({ data: { rates }}) => {
      return _.map(rates, (rate, currency) => {
        return {
          currency,
          rate
        }
      })
    }
  }
};

// Required: Export the GraphQL.js schema object as "schema"
export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
