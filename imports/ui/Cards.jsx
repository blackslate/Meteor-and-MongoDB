import { Meteor } from 'meteor/meteor';

import React, { Component } from 'react'
import { withTracker } from 'meteor/react-meteor-data';

import { Cards } from '../api/cards' // Mongo collection


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