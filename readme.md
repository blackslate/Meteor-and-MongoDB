# Mongo-Test

Purpose: to create a proof-of-concept connection between Meteor and and external MongoDB database.

### 1. Create a new React project with all the dependencies that we will need
```bash
meteor create --react mongo-test && cd mongo-test
meteor npm install --save react react-dom classnames bcrypt mongodb

meteor remove blaze-html-templates
meteor remove autopublish
meteor remove insecure

meteor add static-html react-meteor-data accounts-ui accounts-password meteortesting:mocha
meteor npm install --save-dev chai
```
Optional (the MongoDB driver uses a pure JavaScript BSON parser by default. `bson-ext` is written in C++)
```bash
meteor npm install --save bson-ext
```

### 2. Remove all the placeholder code for the Links and the Click feature
* Delete `imports/api/links.js`
* Reduce `imports/ui/App.jsx` to:
```javascript
    import React from 'react'

    const App = () => (
       <div>
       <h1>Mongo Test</h1>
      </div>
    )

export default App;
```
* Delete `imports/ui/Hello.jsx` and `imports/ui/Info.jsx`
* Reduce (and rename) `/server/main.jsx` to:
```javascript
    import { Meteor } from 'meteor/meteor'


    Meteor.startup(() => {

    })
```
* Rename `tests/main.js` to  `tests/main.jsx`
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

### 3. From the Terminal, check that the bare-bones app works
```bash
meteor
```
In the broswer, you should see:
# Mongo Test

### 4. Display a list of items read in from the internal `meteor mongo` database

**In **`imports/api/cards.jsx`**, create a `Cards` collection and publish it:**

```javascript
  import { Meteor } from 'meteor/meteor';
  import { Mongo } from 'meteor/mongo';

  export const Cards = new Mongo.Collection('cards');

  if (Meteor.isServer) {
    Meteor.publish('cards', function publishCards() {
      return Cards.find({})
    })
  }
```

**In **`server/main.js`**, ensure that there are already some cards available:**
```javascript
  import { Meteor } from 'meteor/meteor'
  import { Cards } from '/imports/api/cards';

  Meteor.startup(() => {
    if (Cards.find().count() === 0) {
      const cards = [
        { _id: "01"
        , audio: "01.mp3"
        , ru: "Здравствуйте, Мир!"
        , en: "Hello World!"
        , fr: "Bonjour le Monde !"
        }
      , { _id: "02"
        , audio: "02.mp3"
        , ru: "Меня зовут..."
        , en: "My name is..."
        , fr: "Je m'appelle..."
        }
      , { _id: "03"
        , audio: "03.mp3"
        , ru: "Как тебя зовут?"
        , en: "What is your inf name?"
        , fr: "Comment t'appelles-tu ?"
        }
      ]

      cards.forEach( card => {
        Cards.insert(card)
      })
    }
  })
```


**In **`imports/ui/Cards.jsx`**, read in the cards from the **`Cards`** collection, and render them in a list:**

```javascript
  import { Meteor } from 'meteor/meteor';

  import React, { Component } from 'react'
  import { withTracker } from 'meteor/react-meteor-data';

  import { Cards } from '../api/cards.js' // Mongo collection


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
```

**In **`imports/ui/App.jsx`**, display the component created in **`Cards.jsx`**:**
```javascript
  import React from 'react';
  import Cards from './Cards.jsx'

  const App = () => (
    <div>
      <h1>Mongo Test</h1>
      <Cards />
    </div>
  )

  export default App
```

### 5. Replace minimongo with an external MongoDB database





```





```bash
meteor remove insecure
```

```bash
meteor mongo

db.tasks.insert({ text: "Hello world!", createdAt: new Date() });
```



[Running on Android](https://www.meteor.com/tutorials/react/running-on-mobile)

```bash
meteor install-sdk android

meteor add-platform android

meteor run android

meteor run android-device
```