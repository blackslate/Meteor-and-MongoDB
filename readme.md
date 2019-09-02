# Mongo-Test

Purpose: to create a proof-of-concept connection between Meteor and and external MongoDB database.

---
### 1. Create a new React project with all the dependencies that we will need
```bash
meteor create --react mongo-test && cd mongo-test
meteor npm install --save react react-dom classnames bcrypt mongodb

meteor remove blaze-html-templates
meteor remove autopublish
meteor remove insecure

meteor add static-html react-meteor-data accounts-ui accounts-password meteortesting:mocha
meteor npm install --save-dev chai
```

---
### 2. Remove all the placeholder code for the Links and the Click feature
* Delete `imports/api/links.js`
* Reduce `imports/ui/App.jsx` to:
```javascript
    import React from 'react'

    const App = () => (
       <div>
       <h1>Mongo Test</h1>
      </div>
    )

export default App;
```
* Delete `imports/ui/Hello.jsx` and `imports/ui/Info.jsx`
* Reduce (and rename) `/server/main.jsx` to:
```javascript
    import { Meteor } from 'meteor/meteor'


    Meteor.startup(() => {

    })
```
* Rename `tests/main.js` to  `tests/main.jsx`
* Update `package.json` to reflect the changes to the file names:

```json
    ...
    , "meteor": {
        "mainModule": {
          "client": "client/main.jsx"
        , "server": "server/main.jsx"
        }
      , "testModule": "tests/main.jsx"
      }
    ...
```
---
### 3. From the Terminal, check that the bare-bones app works
```bash
meteor
```
In the broswer, you should see:
# Mongo Test
---

### 4. Display a list of items read in from the internal `meteor mongo` database

**In **`imports/api/cards.jsx`**, create a `Cards` collection and publish it:**

```javascript
  import { Meteor } from 'meteor/meteor';
  import { Mongo } from 'meteor/mongo';

  export const Cards = new Mongo.Collection('cards');

  if (Meteor.isServer) {
    Meteor.publish('cards', function publishCards() {
      return Cards.find({})
    })
  }
```

**In **`server/main.js`**, ensure that there are already some cards available:**
```javascript
  import { Meteor } from 'meteor/meteor'
  import { Cards } from '/imports/api/cards';

  Meteor.startup(() => {
    if (Cards.find().count() === 0) {
      const cards = [
        { _id: "01"
        , audio: "01.mp3"
        , ru: "Здравствуйте, Мир!"
        , en: "Hello World!"
        , fr: "Bonjour le Monde !"
        }
      , { _id: "02"
        , audio: "02.mp3"
        , ru: "Меня зовут..."
        , en: "My name is..."
        , fr: "Je m'appelle..."
        }
      , { _id: "03"
        , audio: "03.mp3"
        , ru: "Как тебя зовут?"
        , en: "What is your inf name?"
        , fr: "Comment t'appelles-tu ?"
        }
      ]

      cards.forEach( card => {
        Cards.insert(card)
      })
    }
  })
```


**In **`imports/ui/Cards.jsx`**, read in the cards from the **`Cards`** collection, and render them in a list:**

```javascript
  import { Meteor } from 'meteor/meteor';

  import React, { Component } from 'react'
  import { withTracker } from 'meteor/react-meteor-data';

  import { Cards } from '../api/cards.js' // Mongo collection


  class CardsComponent extends Component {
    _getListItem(card) {
      return (
        <li key={card._id}>{card.ru}</li>
      )
    }

    render() {
      const cards = this.props.cards.map(
        card => this._getListItem(card)
      )

      return <ul>{ cards }</ul>
    }
  }


  const getMeteorData = () => {
    Meteor.subscribe('cards')

    return {
      cards: Cards.find({}, { sort: { _id: 1 } }).fetch()
    }
  }

  const wrapperFunction = withTracker(getMeteorData)

  const WrappedComponent = wrapperFunction(CardsComponent)


  export default WrappedComponent
```

**In **`imports/ui/App.jsx`**, display the component created in **`Cards.jsx`**:**
```javascript
  import React from 'react';
  import Cards from './Cards.jsx'

  const App = () => (
    <div>
      <h1>Mongo Test</h1>
      <Cards />
    </div>
  )

  export default App
```
---
### 5. In the browser, you should now see:

# Mongo Test

####* Здравствуйте, Мир!
####* Меня зовут...
####* Как тебя зовут?
---

### 6. Install MongoDB Community Edition

### [Official Guide](https://docs.mongodb.com/manual/administration/install-community/)

Steps for Ubuntu 16.04 LTS, as of 2019-09-01:

See [https://askubuntu.com/a/884652/426741](https://askubuntu.com/a/884652/426741)

```bash
wget -qO - https://www.mongodb.org/static/pgp/server-4.2.asc | sudo apt-key add -

echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/4.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.2.list

sudo apt update
sudo apt-get install -y mongodb-org=4.2.0 mongodb-org-server=4.2.0 mongodb-org-shell=4.2.0 mongodb-org-mongos=4.2.0 mongodb-org-tools=4.2.0

sudo systemctl start mongodb
sudo systemctl enable mongodb
```

Check `/var/log/mongodb/mongod.log` for a line that says:

`[initandlisten] waiting for connections on port 27017`


### Stop
`sudo service mongod stop`

### Restart 
`sudo service mongod restart`

### Start a mongo shell
`mongo`

---

### 7. Add some data to the external MongoDB database
In a Terminal window:

**`mongo`**
```bash
MongoDB shell version v4.2.0
connecting to: mongodb://127.0.0.1:27017/?compressors=disabled&gssapiServiceName=mongodb
Implicit session: session { "id" : UUID("b7233950-873b-4e89-9bc6-f9cbcf41b5b1") }
MongoDB server version: 4.2.0
```
**`> db.test.insertMany([{ _id: "04" , audio: "04.mp3" , ru: "говорить" , en: "to speak" , fr: "parler" } , { _id: "05" , audio: "05.mp3" , ru: "работать" , en: "to work" , fr: "travailler" } , { _id: "06" , audio: "06.mp3" , ru: "жить" , en: "to live" , fr: "vivre" }])`**

```bash
{ "acknowledged" : true, "insertedIds" : [ "04", "05", "06" ] }
```
**`> db.test.find()`**

```bash
{ "_id" : "04", "audio" : "04.mp3", "ru" : "говорить", "en" : "to speak", "fr" : "parler" }
{ "_id" : "05", "audio" : "05.mp3", "ru" : "работать", "en" : "to work", "fr" : "travailler" }
{ "_id" : "06", "audio" : "06.mp3", "ru" : "жить", "en" : "to live", "fr" : "vivre" }
>
```

---
### 8. Connect to the external MongoDB database from the Meteor app

Add a new script at `server/mongo-test.js`, with the following content:

```bash
// Adapted from https://mongodb.github.io/node-mongodb-native/3.3/quick-start/quick-start/

  import { MongoClient } from 'mongodb'

  console.log("*** mongo-test.js is being loaded ***")


  class MongoTest {
    constructor({
      host   = "localhost"
    , port   = 3001
    , dbName = "meteor"
    }) {
      console.log("+++ MongoTest is being instanciated +++")

      this.dbName = dbName
      this.url    = `mongodb://${host}:${port}`

      // Ensure DeprecationWarnings are not shown in the Terminal 
      const options = {
        useNewUrlParser:    true
      , useUnifiedTopology: true
      }
      this.client = new MongoClient(this.url, options)

      this.client.connect(this.connectionCallback.bind(this))
    }


    connectionCallback(error, result) {
      if (error) {
        return console.log(error)
      }

      console.log(`--- Connected successfully to ${this.url} ---`)

      this.db = this.client.db(this.dbName)

      this.runSmokeTests()
    }


    runSmokeTests() {
      const collectionName = this.collName = "droptest"

      new Promise(( resolve, reject ) => {
        return this.dropCollection( collectionName, resolve )

      }).then(() => {
        return this.insertTest( collectionName )

      }).then( commandResult => {
        return this.findTest( commandResult, collectionName )

      }).then( cursor => {
        return this.showDocuments(cursor, collectionName)

      }).then( () => {
        return this.listCollections()

      }).catch(
        error => console.log(error)

      ).then (() => this.closeConnection())
    }


    dropCollection(collectionName, resolve, reject) {
      const promise = this.db.dropCollection(collectionName)

      promise.then(
        () => console.log("Collection '"+collectionName+"' dropped")

      ).catch (
        reason => {
          console.log(
            "Collection '"+collectionName+"' not dropped:"
          , reason.codeName
          )
          return resolve(false)
        }
      ).then(() => resolve())
    }


    insertTest(collectionName) {
      const collection = this.db.collection(collectionName);
      const document = { hello: "world" }

      // Return a promise that will either be:
      // - resolved with a CommandResult object as the value
      // - or rejected with a MongoError
      return collection.insertOne(document)
    }


    findTest(commandResult, collectionName) {
      // // Expected:
      // commandResult.result = { n: 1, ok: 1 }
      // commandResult.ops  = [ { hello: 'world', _id: <hex number> } ]

      const error = commandResult.result.n !== 1
                  ? "WARNING! insertOne error: result.n should be 1"
                  : commandResult.ops.length !== 1
                    ? "WARNING! insertOne error: ops.length should be 1"
                    : null

      if (error) {
        console.log(error)
      }

      const collection = this.db.collection(collectionName);

      // Return a promise that will either be:
      // - resolved with a Cursor object as the value
      // - or rejected
      return collection.find()
    }


    showDocuments(cursor, collectionName) {
      console.log(
        `\nShowing all documents in collection '${collectionName}'...`
      )

      // https://mongodb.github.io/node-mongodb-native/3.3/api/Cursor.html#forEach
      // MongoDB's cursor.forEach can take two arguments
      // 1. An iterator callback, executed for each document in the
      //    cursor
      // 2, An `end`  callback, which is called after the iteration 
      //    has finished

      return new Promise(
        (resolve) => {
          cursor.forEach(
            // Iterate through documents...
            document => {console.log(document)}

            // ... and finally resolve the promise so that the next
            // chained method can be called
          , () => resolve()
          )
        }
      )
    }


    listCollections() {
      console.log("\nShowing all collections...")
      const collectionsCursor = this.db.listCollections()

      return new Promise(
        (resolve, reject) => {
          collectionsCursor.forEach (
            // Iterate through collections...
            (collection) => {
              console.log(collection ? collection.name : collection)
            }

            // ... and finally resolve the promise so that the next
            // chained method can be called
          , () => resolve()
        )
      })
    }


    closeConnection() {
      console.log("\nTests complete. Closing connection to MongoDB\n")
      this.client.close()
    }

  }


  const mongoTest = new MongoTest({
    host:   "localhost"
  , port:   27017
  , dbName: "flashcards"
  })


  export { mongoTest }
```

In the Terminal window where you launched Meteor, you should see:

```bash
                         
  *** mongo-test.js is being loaded ***
  +++ MongoTest is being instanciated +++
  ••• MongoClient {
   domain: null,
   _events: {},
   _eventsCount: 0,
   _maxListeners: undefined,
   s: 
    { url: 'mongodb://localhost:27017',
      options: { useNewUrlParser: true, useUnifiedTopology: true },
      promiseLibrary: 
       { [Function: Promise]
         Fiber: [Object],
         awaitAll: [Function],
         await: [Function],
         async: [Function],
         asyncApply: [Function] },
      dbCache: Map {},
      sessions: Set {},
      writeConcern: undefined,
      namespace: MongoDBNamespace { db: 'admin', collection: undefined } } }
  --- Connected successfully to mongodb://localhost:27017 ---
  Collection 'droptest' not dropped: NamespaceNotFound
  => Started your app.

  => App running at: http://localhost:3000/

  Showing all documents in collection 'droptest'...
  { _id: 5d6cd9a7e43ecd5fd6de590e, hello: 'world' }

  Showing all collections...
  droptest
  test

  Tests complete. Closing connection to MongoDB

```

---
### 9. Replace `minimongo` with an external MongoDB database



