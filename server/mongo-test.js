import { MongoClient } from 'mongodb'


class MongoTest {
  constructor({
    host       = "localhost"
  , port       = 3001
  , dbName     = "meteor"
  , collection = ""
  }) {
    this.dbName = dbName
    this.url    = `mongodb://${host}:${port}`

    // Ensure DeprecationWarnings are not shown in the Terminal 
    const options = {
      useNewUrlParser:    true
    , useUnifiedTopology: true
    }
    this.client = new MongoClient(this.url, options)

    this.client.connect(this.connectionCallback.bind(this))
  }


  connectionCallback(error, result) {
    if (error) {
      return console.log(error)
    }

    console.log(`Connection to ${this.url} opened`)

    this.db = this.client.db(this.dbName)

    this.closeConnection()
  }


  closeConnection() {
    this.client
        .close()
        .then(() => console.log(`Connection to ${this.url} closed`))
        .catch((error) => (console.log(
          `ERROR closing connection to ${this.url}:\n>> ${error}`)
        ))   
  }
}



const mongoTest = new MongoTest({
  host:       "localhost"
, port:       27017
, dbName:     "flashcards"
, collection: "test"
})



export { mongoTest }