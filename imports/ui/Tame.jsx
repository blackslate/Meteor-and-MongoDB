/** imports/ui/Tame.jsx **
 *
 * This script and ports/ui/Wild.jsx are very similar. The differences * is:
 * 
 * • The native Mongo collection is imported here from:
 * 
 *     import { Tame } from '../api/tame'
 *   
 *   The server also imports 'imports/api/tame', in order to
 *   initialize the Tame collection and publish it.
 *   
 *   The Wild collection, however, is not initialized internally
 *   by the app. The client-side Wild.jsx script simply declares that
 *   it exists:
 *   
 *     const Wild = new Mongo.Collection('wild')
**/


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

// export default withTracker(() => {
//   Meteor.subscribe('tame')

//   return {
//     tame: Tame.find({}, { sort: { _id: 1 } }).fetch()
//   }
// })(TameComponent)

const getMeteorData = () => {
  Meteor.subscribe('tame')

  return {
    tame: Tame.find({}, { sort: { _id: 1 } }).fetch()
  }
}

const wrapperFunction = withTracker(getMeteorData)

const WrappedComponent = wrapperFunction(TameComponent)


export default WrappedComponent

