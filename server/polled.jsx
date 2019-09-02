Meteor.publish('polled-publication', function() {

  const publishedKeys = {};

  const poll = () => {
    // Let's assume the data comes back as an array of JSON 
    // documents, with an _id field
    const data = [{ "json": {"with": "some data"}}]

    data.forEach((doc) => {
      if (publishedKeys[doc._id]) {
        this.changed(COLLECTION_NAME, doc._id, doc);
      } else {
        publishedKeys[doc._id] = true;
        this.added(COLLECTION_NAME, doc._id, doc);
      }
    });
  };

  poll();
  this.ready();

  const interval = Meteor.setInterval(poll, POLL_INTERVAL);

  this.onStop(() => {
    Meteor.clearInterval(interval);
  });
});