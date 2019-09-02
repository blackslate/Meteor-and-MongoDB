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
