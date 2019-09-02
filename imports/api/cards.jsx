import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

export const Cards = new Mongo.Collection('cards');

if (Meteor.isServer) {
  Meteor.publish('cards', function publishCards() {
    return Cards.find({})
  })
}