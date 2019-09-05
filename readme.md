# Flashcards

### *Creating a Meteor app that connects to an external MongoDB database.*

This tutorial will walk you through creating a Meteor app which uses two Mongo collection. First, you'll create a "Tame" collection, which uses the standard Meteor practices, and saves its data to the internal `meteor` Mongo database. Then you will create a "Wild" collection, which lives only in the in-memory `minimongo` system. You will discover how to use the official `mongodb` driver to connect to any MongoDB database anywhere on the network.

I'll be using the React frontend rendering library rather than the proprietary Blaze library, because I find this results in more straightforward code.

In this tutorial, you'll be making a language-learning app. The app will show you flashcards with your language on one side and the language you are learning on the other. It will show you these cards using spaced repetition. The first time you see a new card, you will see it again soon after, but gradually the intervals between repetitions will get longer. You will be able to dismiss a card so that it will not appear again, and you will be able to review all the cards in a deck, arranged in a scrollable list, so that you can toggle the `dismissed` state of any card.

The data for the cards will be stored on an external MongoDB database, while your user data (which cards you have seen recently, which you have dismissed, and so on) will be stored in the internal `meteor` database.

### Data management
Why use a separate database for a project like Flashcards?

The answer is in two parts. One, the structure of a MongoDB database works best with documents which have very shallow nesting of data. And two, Meteor only allows you to work with one assigned `db`.

#### Nested data
A MongoDB installation stores data at two levels: `db` (for database) and `collection`. A collection stores documents in BSON (Binary javaScript Object Notation) format, and these documents can have any level of nesting. They can be as simple as ` _id: <unique value>, data: <any value> }`, or they can have properties which store objects with properties which store objects ... and so on, to any depth.

For example, to store several sets of flashcards in a single MongoDB collection, you could create a document with two levels for each set, like this:

```json

    { "_id":   "NAME OF FLASHCARD SET"
    , "type":  "flashcard set"
    , "icon":  <image filepath or blob>
    , cards: [
        { "index": <number>
        , "en":    <string in English>
        , "es":    <string in Spanish>
        , "zh":    <string in Chinese>
        , "audio": <mp3 filepath or blob>
        , "image": <image filepath or blob>
        }
      , { ... }
      ]
    }
```
However, when the value of any property or sub-property in a document is altered, the whole document needs to be updated in the MongoDB database. This means that if you added, deleted or modified a single property of a single card, then the whole document would need to be rewritten.

It therefore makes sense to minimize the nesting depth. To do this, you could store each flashcard set as a separate collection, so that each card is a distinct document. A Flashcard collection could look like this:

```json

  Collection NAME_OF_FLASHCARD_SET:
  
    [ // Deck data
      { "_id":   "NAME OF FLASHCARD SET"
      , "name":  <string>
      }
    , { "_id":   "icon"
      , "icon":  <image filepath>
      }

      // Flash card data
    , { "_id":   <unique string>
      , "en":    <string in English>
      , "es":    <string in Spanish>
      , "zh":    <string in Chinese>
      , "audio": <mp3 filepath>
      , "image": <image filepath>
      }
    , { ... }
    ]
```
Now, if you change a single property of a single card, only the document for that card needs to be rewritten on the MongoDB database. If you know the name of the collection, you have access to the deck of flashcards.

[ASIDE: It is possible to get information about all available connections using a server-side method:
```javascript
  function getCollectionNames(callback) {
    const driver = MongoInternals.defaultRemoteCollectionDriver()
    const db     = driver.mongo.db

    db.collections() // returns a promise if there is no callback
      .then( collectionArray => {
        const collectionNames = collectionArray.map(
          collection => collection.s.name
        )

        if (typeof callback === "function") {
          return callback(collectionNames)
        } else {
          console.log(collectionNames)
        }
      })
  }
```
So it would be possible to create a Flashcard app within the confines of the built-in `meteor` database. However, the list of collection names will also include administrative collections, such as `meteor_accounts_loginServiceConfiguration` and `users`, and you would have to filter these out so that you are left with a list only of flashcard collections.]

#### Multiple `db`s
Using an external MongoDB server means that you can dedicate an entire `db` to flashcard collections. And you are not limited to using only one `db`. You could have different `db`s on the same server, each for flashcards on different topics.

---
### 1. Create a new React project with all the dependencies that we will need
```bash
meteor create --react mongo-test && cd flashcards
meteor npm install --save react react-dom classnames bcrypt mongodb

meteor remove blaze-html-templates
meteor remove autopublish
meteor remove insecure

meteor add static-html react-meteor-data accounts-ui accounts-password meteortesting:mocha
meteor npm install --save-dev chai
```

You'll notice that the `autopublish` and `insecure` modules have already been removed. This means that you will 

---
### 2. Remove all the placeholder code for the Links and the Click feature
* Delete `imports/api/links.js`
* Reduce `imports/ui/App.jsx` to:
```javascript
    import React from 'react'

    const App = () => (
      <div>
        <h1>Flashcards</h1>
      </div>
    )

    export default App
```
* Delete `imports/ui/Hello.jsx` and `imports/ui/Info.jsx`
* Reduce (and rename) `/server/main.jsx` to:
```javascript
    import { Meteor } from 'meteor/meteor'

    Meteor.startup(() => {

    })
```
* For consistency, rename `tests/main.js` to `tests/main.jsx`
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
# Flashcards
---

### 4. Display a list of items read in from the internal `meteor mongo` database

Now it's time to add a "Tame" collection, which follows the standard Meteor pattern. You can find full details of the Publication/Subscription feature [here](https://guide.meteor.com/data-loading.html#publications-and-subscriptions).

**Create a file at **`imports/api/tame.jsx`**, to create a **`Tame`** collection and publish it:**

```javascript
  import { Meteor } from 'meteor/meteor'
  import { Mongo } from 'meteor/mongo'

  export const Tame = new Mongo.Collection('tame')


  if (Meteor.isServer) {
    if (!Tame.find().count()) {
      console.log("Initializing Tame collection")

      const tame = [
        { _id: "01" }
      , { _id: "02" }
      ]

      tame.forEach( card => {
        Tame.insert(card)
      })
    } else {
      console.log("Tame collection is already populated")
    }

    Meteor.publish('tame', function publishTame() {
      return Tame.find({})
    })
  }
```
This script will be run on both the Client and the Server, so the "Tame" `Mongo.Collection` will be available in both places. The first time the script runs on the Server, it will add a couple of dummy entries which will be stored permanently in the `meteor mongo` database. You'll see in a moment how to use the  `meteor mongo` Command Line Interface (CLI) to modify this permanent storage.

The call to `Meteor.publish('tame', [function])` is the standard way of creating a collection and making it available in the client. It tells Meteor to create a new collection in the native database, and to use this database collection to keep track of all changes made to the in-memory collection in the Meteor app.

**In **`server/main.js`**, ensure that the **`tame.jsx`** is loaded and run:**
```javascript
  import { Meteor } from 'meteor/meteor'
  import '/imports/api/tame'

  Meteor.startup(() => {

  })
```

**Create a file at **`imports/ui/Tame.jsx`**, to read in the cards from the **`Tame`** collection, and render them in a list:**

```javascript
  import { Meteor } from 'meteor/meteor'
  import React, { Component } from 'react'
  import { withTracker } from 'meteor/react-meteor-data'

  import { Tame } from '../api/tame' // Mongo collection


  class TameComponent extends Component {
    _getListItem(document) {
      return (
        <li key={document._id}>{document._id}</li>
      )
    }


    render() {
      const layout = this.props.tame.map(
        document => this._getListItem(document)
      )

      return <ul>{ layout }</ul>
    }
  }


  const getMeteorData = () => {
    Meteor.subscribe('tame')

    return {
      tame: Tame.find({}, { sort: { _id: 1 } }).fetch()
    }
  }

  const wrapperFunction = withTracker(getMeteorData)

  const WrappedComponent = wrapperFunction(TameComponent)


  export default WrappedComponent
```
This script creates a `TameComponent` class that is used to render components created with the `<Tame />` tag. In essence, this will be a `<ul>` list where each item simply shows the `_id` of one of the documents stored in the `tame` collection.

In order to get React to feed the right data to the `this.props` property of the `TameComponent` class, the `react-meteor-data` module needs to wrap the class to provide its own secret sauce. When React sees a `<Tame />` component, it will communicate details of the `tame` collection to an instance of the `TameComponent` class through this wrapper.

[NOTE: The official [ToDo App with React](https://www.meteor.com/tutorials/react/temporary-ui-state#onemorefeatureshowingacountofincompletetasks) tutorial proposes a much more succinct version of the last four statements. Using the denser version, you could replace all the final lines, starting with ` const getMeteorData = () => {` with this:
`
```javascript
  export default withTracker(() => {
    Meteor.subscribe('tame')

    return {
      tame: Tame.find({}, { sort: { _id: 1 } }).fetch()
    }
  })(TameComponent)
```
While this version is shorter, I find that is easier to understand what the code does if it is broken down into its discrete steps as I showed above.]


**In **`imports/ui/App.jsx`**, display the component created in **`Tame.jsx`**:**
```javascript
  import React from 'react'
  import Tame from './Tame.jsx'

  const App = () => (
    <div>
      <h1>Flashcards</h1>
      <Tame />
    </div>
  )

  export default App
```
---
### 5. In the browser, you should now see:

# Flashcards

###* 01
###* 02
---

### 6. Use `meteor mongo` to add more documents to the `Tame` collection
While your Meteor app is running, open a Terminal window and `cd` to the folder that contains your Meteor project. In the Terminal, type:

**`meteor mongo`**
```bash
MongoDB shell version v4.0.6
connecting to: mongodb://127.0.0.1:3001/meteor?gssapiServiceName=mongodb
Implicit session: session { "id" : UUID("f417f1b7-179c-43c0-a4f6-80a22b1657d8") }
MongoDB server version: 4.0.6
```
Check that Meteor is using a `db` called `meteor`, by default:

**`meteor:PRIMARY> db`**
```bash
meteor
```
Check the names of the collections held in the `meteor` `db`:

**`meteor:PRIMARY> show collections`**
```bash
links
meteor_accounts_loginServiceConfiguration
tame
users
```
Here's how you can see the documents in the `meteor.tame` collection:

**`meteor:PRIMARY> db.tame.find()`**
```bash
{ "_id" : "01" }
{ "_id" : "02" }
```

You can add more documents as follows:

**`meteor:PRIMARY> db.tame.insertMany([ { "_id": "03" }, { "_id": "04" } ])`**
```bash
{ "acknowledged" : true, "insertedIds" : [ "03", "04" ] }
```
Look in the browser window. You should see that there are now two more entries showing:

# Flashcards

###* 01
###* 02
###* 03
###* 04

This demonstrates that the connection between your Meteor app and the Mongo database is active.

---
### 7. Create a collection that will not be saved to `meteor mongo`
To tell Meteor to create a standard collection, you ran the following code on the Server:
```javascript
    export const Tame = new Mongo.Collection('tame')

    Meteor.publish('tame', function publishTame() {
      return Tame.find({})
    })
```
To create a collection that is not connected to `meteor mongo` you need to write code that has a similar structure...
```javascript
    const Wild = new Mongo.Collection("wild")

    Meteor.publish("wild", function publishWild() {
      // More code goes here
    }
```
... but the contents of the function passed to the `Meteor.publish` method will not include a call to a MongoDB `find()` method. This means that the method will not return a live `Collection.Cursor` object, which in turn means that you must deal with updating the contents of the collection manually.

In a future step, you will be creating a connection to an external database. To begin with, you can simulate a remote connection by using a reliable synchronous function. Later, you can simulate an unreliable asynchronous connection, and when all the pieces are working, you can set up a real asyncrhonous connection. When you proceed step by step like this, you introduce only a limited source of bugs at each step. If your code breaks, it will be simpler to find the cause and fix it.

Here's the basic structure of the `publishWild` function:

```
  const POLL_INTERVAL = 1000

  Meteor.publish("wild", function publishWild() {
    const dataSource = FauxServer()

    const poll = () => {
      // Code to get data from the FauxServer goes here
    }

    // Refresh the publication on a regular basis.
    poll()
    this.ready()

    const interval = Meteor.setInterval(poll, POLL_INTERVAL)

    this.onStop(() => {
      Meteor.clearInterval(interval)
    })
  })
```
In the simplest terms, you set up a way to connect to the data source, and then poll the source at regular intervals. I suggest using a short interval for now (1000 milliseconds), so that any problems will be immediately obvious. When everything is working well, you can choose an interval that is more appropriate for the expected rate of change of the data on the remote database.

When Meteor calls the `Meteor.publish` method, it provides a `this` value which is a Subscription object. You can find the documentation for the Subscription object [here](https://docs.meteor.com/api/pubsub.html). The Subscription object has a number of methods that you will need to use:

* **`ready`**: When you are handling the flow of data yourself, you need to tell the client that the first batch of data has arrived.
* **`onStop`**: Meteor will call this method whenever there are no more users subscribed to the collection.
* **`added`**, **`changed`**, **`deleted`**: These are the methods that you will use to update the collection each time a new batch of data becomes available.

Here's a simple synchronous technique that uses these methods to refresh the collection on each `poll` cycle.

```javascript
    const poll = () => {
      const documents = dataSource()

      // Check for deleted items. Their _ids will still be in 
      // publishedKeys from the last update, even if they are not in
      // documents this time.
      const missing_ids = Object.keys(publishedKeys)

      // Update the collection manually to reflect changes
      documents.forEach((doc) => {
        if (publishedKeys[doc._id]) {
          this.changed("wild", doc._id, doc)
          removeFrom(missing_ids, doc._id)

        } else {
          publishedKeys[doc._id] = true
          this.added("wild", doc._id, doc)
        }
      })

      // Remove any items whose _ids were not present this time
      missing_ids.forEach( _id => {
        delete publishedKeys[_id]
        this.removed("wild", _id)
      })
    }
```
The `poll` function needs access to the `this` property passed in from 
`Meteor.publish`; the easiest way to do this is to use the fat arrow syntax. The function iterates through all the incoming documents: it adds new documents to the collection and checks whether any previously available documents has changed internally. It also checks whether any documents which ere available on the previous `poll` iteration are no longer present, and if so, it deletes them from the collection.

The `poll` function relies on calls to two external functions: `dataSource()` and `removeFrom(array, item)`

The `removeFrom` function simply looks for the first occurrence of an item in a given array, and removes it:
```javascript
  function removeFrom(array, item) {
    const index = array.indexOf(item)

    if (index < 0) {/* No action needed */} else {
      array.splice(index, 1)
    }
  }
```

The `dataSource` function was returned by the initial call to `FauxServer()`. I'll start with a simple synchronous version, and soon you can update it so that it will work asynchronously.
```javascript
  function FauxServer() {
    // Create some data to cycle through
    const data = [
      { "_id": "0" }
    , { "_id": "1" }
    , { "_id": "2" }
    , { "_id": "3" }
    , { "_id": "4" }
    , { "_id": "5" }
    , { "_id": "6" }
    , { "_id": "7" }
    , { "_id": "8" }
    , { "_id": "9" }
    ]

    return function getData() {
      // Change the contents of the collection on every update to
      // simulate a remote source of changing data, available through
      // a REST API.
      const documents = data.filter((doc, index) => index < 4)
      data.push(data.shift())

      return documents
    }
  }

```
The `FauxServer` function provides a closure for a `data` array, then returns the `getData` function. Each call to the `getData` function will return the first 4 items from the array, and then move the first item to the end, so that the returned items will change cyclically. This will allow you to see that the data flow is live.

For reference, here is the entire first version of the script. Save it to a file at `server/wild.js`.

```javascript
  import { Meteor } from 'meteor/meteor'
  import { Mongo } from 'meteor/mongo'

  const POLL_INTERVAL = 1000
  const Wild = new Mongo.Collection("wild")


  Meteor.publish("wild", function publishWild() {
    const publishedKeys = {}
    const dataSource = FauxServer()

    const poll = () => {
      const documents = dataSource()

      // Check for deleted items. Their _ids will still be in 
      // publishedKeys from the last update, even if they are not in
      // documents this time.
      const missing_ids = Object.keys(publishedKeys)

      // Update the collection manually to reflect changes
      documents.forEach((doc) => {
        if (publishedKeys[doc._id]) {
          this.changed("wild", doc._id, doc)
          removeFrom(missing_ids, doc._id)

        } else {
          publishedKeys[doc._id] = true
          this.added("wild", doc._id, doc)
        }
      })

      // Remove any items whose _ids were not present this time
      missing_ids.forEach( _id => {
        delete publishedKeys[_id]
        this.removed("wild", _id)
      })
    }

    // Refresh the publication on a regular basis.
    poll()
    this.ready() // < in the offical docs, but apparently not needed

    const interval = Meteor.setInterval(poll, POLL_INTERVAL)

    this.onStop(() => {
      Meteor.clearInterval(interval)
    })
  })


  // Simulated server

  function FauxServer() {
    // Create some data to cycle through
    const data = [
      { "_id": "0" }
    , { "_id": "1" }
    , { "_id": "2" }
    , { "_id": "3" }
    , { "_id": "4" }
    , { "_id": "5" }
    , { "_id": "6" }
    , { "_id": "7" }
    , { "_id": "8" }
    , { "_id": "9" }
    ]

    return function getData() {
      // Change the contents of the collection on every update to
      // simulate a remote source of changing data, available through
      // a REST API.
      const documents = data.filter((doc, index) => index < 4)
      data.push(data.shift())
      return documents
    }
  }


  // Utility

  function removeFrom(array, item) {
    const index = array.indexOf(item)

    if (index < 0) {} else {
      array.splice(index, 1)
    }
  }
```
To make the `wild.jsx` script run when your Meteor app starts up, you should edit the `server/main.jsx` script so that it looks like this:
```javascript
  import { Meteor } from 'meteor/meteor'

  // Ensure that the scripts that publish collections are run on the
  // server
  import '/imports/api/tame'
  import './wild'


  Meteor.startup(() => {

  })
```
### 8. Add a component to display the data from the `wild` collection

To see the changing contents of the `wild` collection, you need to create a new component script. Create a new file at `imports/ui/Wild.jsx`, and copy the following script into it:

```javascript
  import { Meteor } from 'meteor/meteor'
  import React, { Component } from 'react'
  import { withTracker } from 'meteor/react-meteor-data'

  const Wild = new Mongo.Collection('wild')


  class WildComponent extends Component {
    _getListItem(document) {
      return (
        <li key={document._id}>{document._id}</li>
      )
    }

    render() {
      const layout = this.props.wild.map(
        document => this._getListItem(document)
      )

      return <ul>{ layout }</ul>
    }
  }


  function getMeteorData() {
    Meteor.subscribe('wild')

    return {
      wild: Wild.find({}, { sort: { _id: 1 } }).fetch()
    }
  }

  const wrapperFunction = withTracker(getMeteorData)

  const WrappedComponent = wrapperFunction(WildComponent)


  export default WrappedComponent
```
You'll notice that this is currently almost identical to the `imports/ui/Tame.jsx` script. There are two differences:
* The references to `tame` and `Tame` have been replaced by `wild` and `Wild`
* `const Wild = new Mongo.Collection('wild')` is used instead of `import { Tame } from '../api/tame' // Mongo collection`. This is because there is no need to populate the collection with any dummy data. So it's enough just to create a new `Mongo.Collection` with the name `wild` on the Client, and Meteor will provide a blackbox connection to the collection with the same name that you defined on the server.

** Tell the App to display the `Wild` component **
To get the changing data to appear in the browser, you'll need to make one more change, to the `imports/ui/App.jsx` file:

```javascript
  import React from 'react'
  import Tame from './Tame'
  import Wild from './Wild'
  
  const App = () => (
    <div>
      <h1>Mongo Test</h1>
      <Tame />
      <Wild />
    </div>
  )

  export default App
```
### 9. Check that the `Wild` collection appears in the browser
In the browser window, you should now see:


# Flashcards

###* 01
###* 02
###* 03
###* 04
```
```
###* *2*
###* *3*
###* *4*
###* *5*

The first set of numbers (with double digits) should remain the same. These were created once and stored in the `Tame` database. The second set of numbers (with single digits) should change once every second, as the `poll` function displays the new data received from the `getData`/`dataSource` function.

### 10. Check that the `Wild` collection is not being saved in the MongoDB database run by Meteor
While your Meteor app is running, open a Terminal window and cd to the folder that contains your Meteor project. In the Terminal, type:

**`meteor mongo`**
Check the names of the collections held in the meteor db:
**`meteor:PRIMARY> show collections`**
```bash
links
meteor_accounts_loginServiceConfiguration
tame
users
```
The collection names have not changed. If you like you can check that the other databases stored on the MongoDB server have do not have a `wild` collection either:
```bash
show databases
admin
config
local
meteor

meteor:PRIMARY> use admin
switched to db admin
meteor:PRIMARY> show collections

meteor:PRIMARY> use config
switched to db config
meteor:PRIMARY> show collections
transactions

meteor:PRIMARY> use local
switched to db local
meteor:PRIMARY> show collections
oplog.rs
replset.election
replset.minvalid
replset.oplogTruncateAfterPoint
startup_log
```
### 11. Modify the `FauxServer` so that it is asynchronous and unreliable
If the `wild` collection is now publishing a continually changing set of numbers to the browser, then you are ready to make the simulated data source more realistic. Here's a version of the `getData()` handler in the `FauxServer` that delivers a `Promise` which will take up to 1 second to `resolve` to a new packet of data ... or alternatively, will fail to deliver any data at all once every 10 times.

```javascript
    return function getData() {
      // Change the contents of the collection on every update to
      // simulate a remote source of changing data, available through
      // a REST API.
      const documents = data.filter((doc, index) => index < 4)
      data.push(data.shift())

      return new Promise((resolve, reject) => {
        // Fail to deliver on average once every 10 times
        const reliable = Math.floor(Math.random() * 10)   // 0 - 9
        // Take a variable time to respond
        const delay = Math.floor(Math.random()*900) + 100 // up to 1s

        setTimeout(respond, delay)

        function respond() {
          if (reliable) { // 9 times out of 10
            resolve(documents)

          } else {
            reject(new Error(
              "Data randomly lost.\n" 
            + "See RFC 748: TELNET RANDOMLY-LOSE Option\n"
            + "https://tools.ietf.org/html/rfc748\n")
            )
          }
        }
      })
    }
```
If you replace the existing `getData` function with this, the `poll` function inside `publishWild` will fail, because it is expecting an array of data and not a promise. Here's a new version of the `poll` function that solves this issue:
```javascript
...
    const publishedKeys = {}
    const dataSource = FauxServer()
    let ready = false

    const poll = () => {

      const documentsReceived = (documents) => {
        // Check for deleted items. Their _ids will still be in 
        // publishedKeys from the last update, even if they are not in
        // documents this time.
        const missing_ids = Object.keys(publishedKeys)

        // Update the collection manually to reflect changes
        documents.forEach((doc) => {
          if (publishedKeys[doc._id]) {
            this.changed("wild", doc._id, doc)
            removeFrom(missing_ids, doc._id)

          } else {
            publishedKeys[doc._id] = true
            this.added("wild", doc._id, doc)
          }
        })

        // Remove any items whose _ids were not present this time
        missing_ids.forEach( _id => {
          delete publishedKeys[_id]
          this.removed("wild", _id)
        })

        if (!ready) {
          this.ready()
          ready = true
        }
      }


      function transientNetworkFailure(error) {
        console.log(error)
        console.log("Keep calm and carry on\n")
      }


      const promise = dataSource()
      promise.then(documentsReceived, transientNetworkFailure)
    }
...
```
There are a couple of things to notice here:

* There is now a `ready` flag that is set to `true` after the first packet of data is received
* The call to `this.onReady` has been moved inside the `poll` function, where it is called only once, after the first packet of data is received
* The `poll` function now expects a `Promise` from the `dataSource()` call, and waits for it to resolve to an array of data, or be rejected, before it handles the result.

[ASIDE: If you are unfamiliar with Promises, then you might find Jake Archibald's article [JavaScript Promises: an Introduction](https://developers.google.com/web/fundamentals/primers/promises) useful and amusing. In essence, Promises provide a wrapper for asynchronous calls that require a callback. The syntax for a `Promise` is this:

```
const promise = new Promise(functionThatContainsAsynchronousCode)

function functionThatContainsAsynchronousCode(resolve, reject) {
  result doSomethingAsynchronous(with, these, parameters, callback)
  
  function asynchronousCallback(error, result) {
    if (error !== null) {
      reject(error)
    } else {
      resolve(result)
    }
  }
}
```
The trick is that the `resolve` and `reject` arguments of the `functionThatContainsAsynchronousCode` don't have any value yet. The `Promise` instance uses these as placeholders for functions that it will receive some time in the future.

The `Promise` instance also has a `then` method. You can call the `then` method and provide two functions as the arguments to the call. The order of these function arguments is important. They correspond to the `resolve` and `reject` arguments that you used when you created the `functionThatContainsAsynchronousCode`. You can call the `then` method many times, and so create a whole array of callbacks that will be triggered when the `asynchronousCallback` is itself triggered.

The `Promise` remains in RAM and will save these functions until the 'asynchronousCallback` function is called back. Depending on whether the callback signals an error or not, either the `reject` functions or the `resolve` functions will be called, once only.

If you call the `then` method of a `Promise` *after* the `asynchronousCallback` has been triggered, either the `resolve` or the `reject` function that you sent with your `then()` call will be triggered immediately.

One final piece of magic (which isn't used in the current example) is that the result returned by a `resolve` callback may itself be a `Promise`. As [Jake Archibald's article](https://developers.google.com/web/fundamentals/primers/promises) explains, this allows you to set up a whole series of asynchronous functions that either run in series (each one using the result of the previous one as input) or in parallel, allowing you to download a set of assets all at the same time.]

### 12. Check that the asynchronous `FauxServer` is working
In the browser window, you should see the list displayed by the `<Wild />` component updating as before, but now the updates will not be so regular, because of the random `delay` used by the timeout in the `getData` function.

In the Terminal window where you launched Meteor, you should see plenty of output like this:
```bash
I20190904-09:58:42.305(3)? Error: Data randomly lost.
I20190904-09:58:42.305(3)? See RFC 748: TELNET RANDOMLY-LOSE Option
I20190904-09:58:42.306(3)? https://tools.ietf.org/html/rfc748
I20190904-09:58:42.306(3)? 
I20190904-09:58:42.306(3)?     at Timeout.respond [as _onTimeout] (server/wild.jsx:174:18)
I20190904-09:58:42.307(3)?     at ontimeout (timers.js:498:11)
I20190904-09:58:42.307(3)?     at tryOnTimeout (timers.js:323:5)
I20190904-09:58:42.307(3)?     at Timer.listOnTimeout (timers.js:290:5)
I20190904-09:58:42.308(3)? Keep calm and carry on
```
In this case, that's good news. It means that your `poll` function is gracefully handling the cases where the `FauxServer` fails to deliver any goods.

### 13. Connecting the `wild` collection to a real MongoDB server
[ASIDE: MongoDB provides a free [MongoDB Community Edition](https://docs.mongodb.com/manual/administration/install-community/) server. Setting it up and testing that Meteor can connect to it takes a number of steps which I have described in a [separate tutorial](/). You might like to work through that tutorial and then come back here, or you might prefer to skip that step and simply connect to the MongoDB server that Meteor is already running for you. In either case, the only difference in what follows will be the URL and the port number that you use to connect to the "external" MongoDB server. Please replace the values in the code below with your own values.]

Create a new script at `server/externalMongoDB.jsx`, and paste the following code:
```javascript
    import { MongoClient } from 'mongodb'


  class ExternalMongoDB {
    constructor({ // Connect to local meteor mongo by default
      host   = "localhost"
    , port   = 3001
    , dbName = "meteor"
    }) {
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

      console.log(`Connected successfully to ${this.url}`)

      this.db = this.client.db(this.dbName)

      this.runSmokeTest()
    }


    runSmokeTest() {
      this.closeConnection()
    }


    closeConnection() {
      const promise = this.client.close()
      promise.then(
        () => console.log(`Connection to ${this.url} closed\n`)
      , (reason) => console.log(
          `Error closing connection to ${this.url}\n`
        , reason
        )
      )
    }
  }


  const externalDB = new ExternalMongoDB({
    dbName: "testing_only"
  // , host:   "localhost"
  // , port:   27017
  })


  export default externalDB
```
[[WARNING: This script assumes that you ran `meteor npm install --save mongodb` in step 1, and that the `mongodb` module is correctly installed]]

[NOTE: The command that instanciates `externalDB` at the end of the code above connects by default to the MongoDB server installed by Meteor. If you have launched your own MongoDB server and wish to connect to that, uncomment the `host` and `port` lines, and set the values as appropriate for your setup. For example:
```javascript
  const externalDB = new ExternalMongoDB({
    dbName: "testing_only"
  , host:   "192.168.1.50"
  , port:   "27017"
  })
```]

In the `server/main.jsx` script, add a line to import this `externalMongoDB.jsx` script:
```
import { Meteor } from 'meteor/meteor'

  // Ensure that the scripts that publish collections are run on the
  // server
  import '/imports/api/tame'
  import './externalMongoDB'
  import './wild'


  Meteor.startup(() => {

  })


