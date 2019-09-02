import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

export const Polls = new Mongo.Collection('polls');

if (Meteor.isServer) {
  Meteor.publish('polls', function publishPolls() {
    console.log("Publishing polls")
    return Polls.find({})
  })
}

if (Meteor.isClient) {
  console.log("Subscribing to polls")
  Meteor.subscribe('polls')
}