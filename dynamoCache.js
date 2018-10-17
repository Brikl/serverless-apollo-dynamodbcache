import { KeyValueCache } from 'apollo-server-caching';
// TODO add option for DAX here
// import AmazonDaxClient = require('aws-sdk/clients/dax');

import DynamoDB from 'aws-sdk/clients/dynamodb'

export class DynamoDBCache{
  // client;
  // tableOptions;
  // defaultSetOptions = {
  //   ttl: 300,
  //   tableName: 'apollo-persisted-queries',
  // };

  // TODO extend to support dax and other options and define new type instead of any
  // future options
  // x-ray support e.g.
  // daxClusterUrl > for DAX users
  // cosistentRead > for strongly consistent read
  // createTable > to create table on first request
  // ttlAttributeName > in case ttl is not used
  constructor(
    serviceConfigOptions,
    tableOptions,
  ) {
    this.client = new DynamoDB(serviceConfigOptions);

    // TODO for DAX
    // dax = new AmazonDaxClient(serviceConfigOptions)
    // this.daxClient = new DynamoDB.DocumentClient({service: dax });

    this.tableOptions = tableOptions;
    this.client.get = this.client.query.bind(this.client);
    this.client.set = this.client.putItem.bind(this.client);
  }

  async set(
    id,
    data,
    options
  ) {
    // need dynamodb table as per
    // aws dynamodb update-time-to-live --table-name TTLExample --time-to-live-specification "Enabled=true, AttributeName=ttl"
    const { ttl, tableName } = Object.assign(
      {},
      this.defaultSetOptions,
      this.tableOptions,
      options,
    );
    let item =
      ttl !== 0
        ? {
            id: { S: id.toString() },
            data: { S: data.toString() },
            ttl: { S: ttl.toString() },
          }
        : {
            id: { S: id.toString() },
            data: { S: data.toString() },
          };
    // TODO mind 400kb limit per item here for for full query cache?
    // TODO encrypt queries?
    await this.client
      .putItem({
        TableName: tableName,
        Item: item,
      })
      .promise();
  }

  async get(id){
    const { tableName } = Object.assign(
      {},
      this.defaultSetOptions,
      this.tableOptions,
    );
    const reply = await this.client
      .query({
        TableName: tableName,
        KeyConditionExpression: '#id = :value',
        ExpressionAttributeNames: {
          '#id': 'id',
        },
        ExpressionAttributeValues: {
          ':value': { S: id },
        },
      })
      .promise();
    // reply is null if key is not found
    if (
      reply &&
      reply.Items &&
      reply.Items[0] &&
      reply.Items[0].data &&
      reply.Items[0].data.S
    ) {
      return reply.Items[0].data.S;
    }
    return;
  }
}