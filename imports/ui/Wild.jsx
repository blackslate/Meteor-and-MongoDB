/** imports/ui/Wild.jsx **
 *
 * This script and ports/ui/Tame.jsx are very similar. The difference
 * is that the Tame Mongo collection is imported here from...
 * 
 *     import { Tame } from '../api/tame'
 *   
 * ... which is also imprted by the server in order to initialize the
 * collection and publish it.
 *   
 * The Wild collection, however, is not initialized internally
 * by the app, so this client-side script can simply declare that
 * it exists:
 *   
 *     const Wild = new Mongo.Collection('wild')
**/

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