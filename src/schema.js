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
    stats(start: Int!, limit: Int!): Stat
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
`;

// Provide resolver functions for your schema fields
const resolvers = {
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
        const results = await fetch(`https://api.coinmarketcap.com/v1/ticker?start${start}&limit=${limit}`).then( async(res) => {
          return res.json()
        })
        console.log("------");
        console.log(camelcaseKeys(results));
        console.log("------");
        let arr = camelcaseKeys(results);
        arr.forEach(function(obj){
          if(obj.hasOwnProperty('24hVolumeUsd')){
            delete obj['24hVolumeUsd']
          }
        });
        console.log(arr);
        return arr;
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
