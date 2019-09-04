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