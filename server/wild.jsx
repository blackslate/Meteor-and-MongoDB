/** server/wild.jsx **
 *
 * USE:
 * 
 * Called only from server/main.js:
 * 
 *   import './wild'
 *   
 * ACTION:
 * 
 * Publishes a "wild" collection which is not stored in the
 * meteor mongo database. The FauxServer() function internally
 * generates a new set of documents each time it is called by the 
 * poll() method of publishWild(), to simulate changes that could come
 * from a remote data source.
 * 
 * This script is based on the official documentation at:
 * https://guide.meteor.com/data-loading.html#rest-interop
 * 
 * The treatment of deleted documents (using missing_ids) is not
 * covered in the official documentation.
**/


import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'

const POLL_INTERVAL = 1000
const Wild = new Mongo.Collection("wild")



Meteor.publish("wild", function publishWild() {
  // `this` is a Subscription object
  // Documentation: https://docs.meteor.com/api/pubsub.html
  // 
  // It has the format:
  //  { userId: <may beO null>
  //  , connection {
  //      id:            <hash string>
  //    , close:         [Function: close]
  //    , onClose:       [Function: onClose]
  //    , clientAddress: '127.0.0.1'
  //    , httpHeaders: 
  //      { 'x-forwarded-for':   '127.0.0.1'
  //      , 'x-forwarded-port':  '3000'
  //      , 'x-forwarded-proto': 'ws'
  //      , host:                'localhost:3000'
  //      , 'user-agent':        <user-agent string>
  //      , 'accept-language': 'en-US,enq=0.9,ruq=0.8,fr-FRq=0.7,frq=0.6'
  //      }
  //    }
  //  , _session: {
  //      id:     <hash string>
  //    , userId: <may be null>
  //    , ... lots of other properties
  //    }
  //  , _handler:            <pointer to this function itself>
  //  , _subscriptionId:     <hash string>
  //  , _name:               <the name of the collection to publish>
  //  , _params:             <array>
  //  , _subscriptionHandle: <hash string>
  //  , _deactivated:        <boolean (false)>
  //  }

  // console.log(getAllMethodNames(this))
  // 
  // It possesses the following collection-specific public methods:
  //  
  // added
  // changed
  // error
  // onStop
  // ready
  // removed
  // stop

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

  // Refresh the publication on a regular basis.
  poll()

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
    // a REST API.
    const documents = data.filter((doc, index) => index < 4)
    data.push(data.shift())
    
    return new Promise((resolve, reject) => {
      // Fail to deliver on average once every 10 times
      const reliable = Math.floor(Math.random() * 100)   // 0 - 99
      // Take a variable time to respond
      const delay = Math.floor(Math.random()*900) + 100 // up to 1s

      setTimeout(respond, delay)

      function respond() {
        if (reliable) { // 99 times out of 100
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
}



// Utilities

  function removeFrom(array, item) {
    const index = array.indexOf(item)

    if (index < 0) {
      // The item is not in the array
    } else {
      array.splice(index, 1)
    }
  }


// Source: https://stackoverflow.com/a/40577337/1927589
function getAllMethodNames(obj) {
  let methods = new Set()
  while (obj = Reflect.getPrototypeOf(obj)) {
    let keys = Reflect.ownKeys(obj)
    keys.forEach((k) => methods.add(k))
  }
  return methods
}


function getCollectionNames(callback) {
  const driver = MongoInternals.defaultRemoteCollectionDriver()
  const db     = driver.mongo.db

  const a = db.listCollections()
  console.log(a)

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

// getCollectionNames()
