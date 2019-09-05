// Adapted from https://mongodb.github.io/node-mongodb-native/3.3/quick-start/quick-start/
"use strict"

import { MongoClient } from 'mongodb'
import handleError from './errorTracker'



class ExternalMongoDB {
  constructor({ // Connect to local meteor mongo by default
    host   = "localhost"
  , port   = 3001
  , dbName = "meteor"
  }) {
    this.dbName = dbName
    this.url    = `mongodb://${host}:${port}`

    // Dealing with lack of connection
    this.connectionCallback = this.connectionCallback.bind(this)
    this.connectionClosed   = this.connectionClosed.bind(this)
    this.connect            = this.connect.bind(this)

    this.connected  = false
    this.minDelay   = 100
    this.maxDelay   = 102400 // 1 minute, 42 seconds
    this.retryDelay = 100
    this.timeout    = 0
    this.cache      = {}

    // Ensure DeprecationWarnings are not shown in the Terminal 
    const options = {
      useNewUrlParser:    true
    , useUnifiedTopology: true
    }
    this.client = new MongoClient(this.url, options)

    this.connect()
  }


  connect() {
    const message = `Attempting to connect to ${this.url}...`
    if ( this.retryDelay === this.maxDelay ) {
      console.log(message)
    }

    handleError({ message }, "ExternalMongoDB")

    this.client.connect(this.connectionCallback)
  }


  connectionCallback(error, result) {
    if (error) {
      if (this.retryDelay === this.minDelay) {
        // Show the full error only the first time
        console.log(error)
        // { Error: connect ECONNREFUSED 127.0.0.1:27017
        //   at TCPConnectWrap.afterConnect [as oncomplete]
        //   (net.js:1191:14)
        //   
        //   name: 'MongoNetworkError',
        // , errorLabels: [ 'TransientTransactionError' ]
        // , [Symbol(mongoErrorContextSymbol)]: {}
        // }
      }

      this.timeout = setTimeout(this.connect, this.retryDelay)
      this.retryDelay = Math.min(this.retryDelay * 2, this.maxDelay)

    } else {
      console.log(`Connected successfully to ${this.url}`)

      this.connected  = true
      this.retryDelay = this.minDelay

      this.db = this.client.db(this.dbName)
      this.db.on("close", this.connectionClosed)

      this.runSmokeTest()
    }
  }


  runSmokeTest() {
    // this.closeConnection()


    // const insertDocument = () => {
    //   const document = { "name": "test document" }
    //   // A unique "_id" property will be inserted into the document
    //   // so multiple calls will produce multiple documents with
    //   // identical properties (apart from "_id")
    //   const promise = this.collection.insertOne(document)
    //   return promise
    // }


    // const showAllDocuments = (cursor) => {
    //   return new Promise((resolve, reject) => {
    //     cursor.forEach(
    //       document => console.log(document)
    //     , () => resolve(true)
    //     )
    //   })
    // }


    // if (this.db && this.db.databaseName) {
    //   console.log(`Database: ${this.db.databaseName}`)
    // } else { 
    //   console.log("Unexpected value for this.db:\n", this.db)
    // }

    // const promise = this.db.createCollection("smokeTest")

    // promise.then(
    //   collection => {
    //     console.log("insertDocument into", collection.namespace)
    //     this.collection = collection
    //     return insertDocument()
    //   }
    // ).then(
    //   result => {
    //     console.log(`doc inserted with _id: ${result.insertedId}`)
    //     return this.collection.find()
    //   }
    // ).then(
    //   cursor => {
    //     return showAllDocuments(cursor)
    //   }
    // ).catch(
    //   reason => console.log("smokeTest failed", reason)
    // ).then(
    //   () => this.closeConnection()
    // )
  }

  
  promiseToFind(collectionName, query = {}, options = {}) {
    const documents = []

    // Prepare to cache results of the query, or to use the cache
    const seed = collectionName + JSON.stringify(query)
                                + JSON.stringify(options)
    const hash = cyrb53(seed)
    let cache = this.cache[hash]

    // Deal with when MongoDB database is not currently available
    if (!this.db) {
      if (cache) {
        // console.log("Using cache", cache)
        return Promise.resolve(cache)

      } else {
        const reason = `Server at ${this.url} unavailable`
        return Promise.reject(new Error(reason))
      }
    }

    // If we get here, the MongoDB connection is active 

    const cacheResultAnd = (resolve, documents) => {
      // Cache the result, in case the server fails
      cache = documents.slice()
      cache.unshift( { "_id": "__WARNING__ – from cache" } )
      this.cache[hash] = cache

      // console.log("Caching", cache)

      resolve(documents)
    }

    // Synchronous operations...
    const cursor = this.db.collection(collectionName)
                          .find(query, options)

    // Asynchronous reading of found results
    const promise = new Promise((resolve, reject) => {
      cursor.forEach(
        document => documents.push(document)

        // Called after the last document has been treated
      , () => cacheResultAnd(resolve, documents)
      )
    })

    return promise
  }


  getDataSource() {
    return this.promiseToFind.bind(this)
  }


  closeConnection() {
    this.connected = false
    const promise = this.client.close()

    promise.then(
      () => console.log(`Connection to ${this.url} closed\n`)
    , (reason) => console.log(
        `Error closing connection to ${this.url}\n`
      , reason
      )
    )
  }


  connectionClosed() {
    console.log("connectionClosed event")

    this.db = null

    if (this.connected) {
      // The connection broke. (It was not deliberately shut down by
      // closeConnection). Try to reopen the connection.
      this.connected = false
      this.connect()
    }
  }
}


const externalDB = new ExternalMongoDB({
  dbName: "testing_only"
, host:   "localhost"
, port:   27017
})


export default externalDB


// UTILITY

// https://stackoverflow.com/a/52171480/1927589
const cyrb53 = function(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ h1>>>16, 2246822507)
       ^ Math.imul(h2 ^ h2>>>13, 3266489909);
    h2 = Math.imul(h2 ^ h2>>>16, 2246822507)
       ^ Math.imul(h1 ^ h1>>>13, 3266489909);

    return 4294967296 * (2097151 & h2) + (h1>>>0);
};