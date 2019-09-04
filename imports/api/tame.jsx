/** imports/api/tame.jsx **
 * 
 * USE:
 * 
 * Called from two locations:
 * 
 * • imports/ui/Tame.jsx calls...
 *
 *     import { Tame } from 'imports/api/tame'
 *   
 *   ... in order to be able to subscribe to Tame on the client and
 *   serve the data to a UI component.
 * 
 * • server/main.js calls...
 * 
 *     import '/imports/api/tame'
 * 
 *   ... in order simply to run this script and make it publish the
 * collection.
 *   
 * ACTION:
 * 
 * Publishes a "tame" collection, natively managed by the meteor
 * mongo database.
 * 
 * MANAGEMENT:
 * 
 * While the Meteor app is running, you can open a Terminal window,
 * cd to the root folder of the application and type `meteor mongo`
 * 
 * meteor:PRIMARY> show collections
 * links
 * meteor_accounts_loginServiceConfiguration
 * tame   <<<< The stored copy of the data
 * users
 * 
 * To see the contents of the database, you can run
 * meteor:PRIMARY> db.tame.find()
 * { "_id" : "01" }
 * { "_id" : "02" }
 * { "_id" : "03" }
 * { "_id" : "04" }
 *
 * If you modify the collection while the app is running, you will
 * see the changes appear in almost-real-time in the app running in
 * the browser. 
**/



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
