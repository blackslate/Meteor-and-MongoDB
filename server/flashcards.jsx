import { Meteor } from 'meteor/meteor'
import { MongoClient } from 'mongodb'



const POLL_INTERVAL = 2000
const COLLECTION_NAME = "test"
let counter = 2



function publishFlashcards() {
  // `this` is a Subscription object
  console.log("using publishFlashcards", this)
  let active = false // set to true when connection to MongoDB is open

  const publishedKeys = {}
  const interval      = Meteor.setInterval(poll, POLL_INTERVAL)
  const mongoTest = new MongoTest({
    host:   "localhost"
  , port:   27017
  , dbName: "flashcards"
  , callback: startPolling
  })


  function startPolling() {
    mongoTest.openCollection(COLLECTION_NAME)
    active = true
    poll()

    this.ready();
  }
  

  function poll () {
    if (!active) {
      return
    }

    console.log("Polling...", counter)

    const promise = mongoTest.findInCollection({})
    promise.then(
      checkForChanges
    ).catch((error) => console.log("ERROR", error))

    if (!counter--) {    
      Meteor.clearInterval(interval)
      console.log("DONE")
    }
  }


  const checkForChanges = (documents) => {
    const missing_ids = Object.keys(publishedKeys)

    documents.forEach(doc => {
      if (publishedKeys[doc._id]) {
        this.changed(COLLECTION_NAME, doc._id, doc)
        console.log("Checking _id", doc._id)
        removeFromArray(missing_ids, doc._id)

      } else {
        publishedKeys[doc._id] = true;
        this.added(COLLECTION_NAME, doc._id, doc);
        console.log("Adding _id", doc._id)
      }
    })

    console.log("\nBefore", missing_ids, publishedKeys)

    missing_ids.forEach(_id => delete publishedKeys[_id])
    console.log("After", missing_ids, publishedKeys)
  }


  function removeFromArray(array, item) {
    const index = array.indexOf(item)

    console.log("removing", item, "from", array)

    if (index < 0) { /* item is not present */   
    } else {
      array.splice(index, 1)
    }

    console.log("removed?", array)
    return array // for chaining
  }

  this.onStop(() => {
    Meteor.clearInterval(interval);
  });
}



class MongoTest {
  constructor({
    host   = "localhost"
  , port   = 3001
  , dbName = "meteor"
  , callback = function() {
      console.log("WARNING: No connection callback set")
    }
  }) {
    this.dbName   = dbName
    this.url      = `mongodb://${host}:${port}`
    this.callback = callback

    // Ensure DeprecationWarnings are not shown in the Terminal 
    const options = {
      useNewUrlParser:    true
    , useUnifiedTopology: true
    }
    this.client = new MongoClient(this.url, options)

    // Start an asynchronous process
    this.client.connect(this.connectionCallback.bind(this))
  }


  connectionCallback(error, client) {
    if (error) {
      return console.log(error)
    }

    console.log(`Connection to ${this.url} opened`)

    this.db = this.client.db(this.dbName)

    this.callback()
  }


  openCollection(collectionName) {
    this.collection = this.db.collection(collectionName)
    console.log(
      "openCollection("+collectionName+")"
    )
  }


  findInCollection(options) {
    const cursor = this.collection.find(options)
    const documents = []

    return new Promise(
      (resolve, reject) => {
        cursor.forEach(
          // Iterate through documents...
          document => documents.push(document)

          // ... and finally resolve the promise so that the next
          // chained method can be called
        , () => resolve(documents)
        )
      }
    )
  }


  closeConnection() {
    this.client
        .close()
        .then(() => console.log(`Connection to ${this.url} closed`))
        .catch((error) => (console.log(
          `ERROR closing connection to ${this.url}:\n>> ${error}`)
        ))   
  }
}



Meteor.publish("flashcards", publishFlashcards)