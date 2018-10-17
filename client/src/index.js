import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import registerServiceWorker from './registerServiceWorker';
import ApolloClient from "apollo-client";
import { ApolloConsumer, ApolloProvider } from "react-apollo";
import { createPersistedQueryLink } from "apollo-link-persisted-queries";
import { createHttpLink } from "apollo-link-http";
import { InMemoryCache } from "apollo-cache-inmemory";
import gql from "graphql-tag";
import { Query } from 'react-apollo';

const link = createPersistedQueryLink({ 
    useGETForHashedQueries: true 
}).concat(createHttpLink({ uri: "http://localhost:4200/graphql" }));

const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: link
});


const GET_TODO = gql`
  query {
    todo(id: "1") {
      id
      content
    }
  }
`

const App = () => (
    <ApolloProvider client={client}>
        <ApolloConsumer>
            {(client) => (
                <div style={{textAlign: 'center'}}>                                        
                    <Query query={GET_TODO}>
                        {({ loading, error, data }) => {
                        if (loading) return <div>Loading...</div>;
                        if (error) return <div>Error :(</div>;
                        return (
                            <div>
                            ID: {data.todo.id}
                            <br/>
                            Content: {data.todo.content}
                            </div>
                        )
                        }}
                    </Query>
                </div>
            )}    
        </ApolloConsumer>
    </ApolloProvider>
);

ReactDOM.render(<App />, document.getElementById("root"));

registerServiceWorker();
