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
import externalDB from './externalMongoDB'
import handleError from './errorTracker'

const POLL_INTERVAL = 1000
const COLLECTION_NAME = "wild"
const Wild = new Mongo.Collection(COLLECTION_NAME)



Meteor.publish(COLLECTION_NAME, function publishWild() {
  // `this` is a Subscription object
  // Documentation: https://docs.meteor.com/api/pubsub.html
  // 
  // It has the format:
  //  { userId: <may be null>
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
  //  , ... more private properties
  //  }
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
  const dataSource    = externalDB.getDataSource()
  let ready           = false

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


    const trackError = (error) => {
      if (ready && /^Server.*unavailable$/.test(error.message)) {
        ready = false
      }

      handleError(error, COLLECTION_NAME)
    }


    const promise = dataSource(COLLECTION_NAME)
    promise.then(documentsReceived, trackError)
  }

  // Refresh the publication now and on a regular basis.
  poll()
  const interval = Meteor.setInterval(poll, POLL_INTERVAL)

  this.onStop(() => {
    Meteor.clearInterval(interval)
  })
})


// Utility

function removeFrom(array, item) {
  const index = array.indexOf(item)

  if (index < 0) {
    // The item is not in the array
  } else {
    array.splice(index, 1)
  }
}
