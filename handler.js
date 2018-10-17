import 'babel-polyfill';
const { ApolloServer, gql } = require('apollo-server-lambda');
const { DynamoDBCache } = require('./dynamoCache');
const typeDefs = gql`
  type Todo @cacheControl(maxAge: 120){
    id: String!
    content: String!
  }
  type Query {
    todo(id: String!): Todo
  }  
`;

// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    todo: async (_, { id }, {  }) => {
      switch (id) {
        case "1":
          return {
            id: id,
            content: "HAHA1"
          }
      
        default:
          return {
            id: id,
            content: "HAHAX"
          }
      }     
    }    
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  tracing: true,
  cacheControl: {
    defaultMaxAge: 5,
    stripFormattedExtensions: false,
    calculateCacheControlHeaders: false,
  },
  persistedQueries: {
    cache: new DynamoDBCache({
      region: 'us-east-1',      
      endpoint: 
        process.env.IS_OFFLINE==='true' 
        ?
        'http://localhost:8000'
        :
        ''    
    },
    {
      tableName: 'psq',
      ttl: 0
    }
    ),
  },
  // cache: new DynamoDBCache({
  //   region: 'local',
  //   endpoint: 
  //     process.env.IS_OFFLINE==='true' 
  //     ?
  //     'http://localhost:8000'
  //     :
  //     ''    
  // }),
  context: ({ event, context }) => ({
    headers: event.headers,
    functionName: context.functionName,
    event,
    context,
  })
});

exports.graphqlHandler = (event, context, callback) => {
  const handler = server.createHandler({  
      cors: {
        origin: '*',
        credentials: true,
      },
  });
  return handler(event, context, callback);
}