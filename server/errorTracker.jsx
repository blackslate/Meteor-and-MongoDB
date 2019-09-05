/** server/errorTracker.jsx **
 * 
 * Exports a `handleError` function for a singleton instance of the
 * ErrorTracker class. The purpose is to reduce clutter in the
 * Terminal window, by logging only errors that have not occurred
 * recently, and providing a regular batch log of those that occur
 * more than once per minute.
 * 
 * When you call...
 * 
 *   handleError(<error || object with .message property>, <string>)
 *   
 * ... the first such error is displayed, but subsequent errors are
 * stored and shown at the end of a 60s  period.
 * 
 * Messages sent directly to stderr by node modules are not
 * surpressed.
 */


class ErrorTracker {
  constructor() {
    this.handleError = this.handleError.bind(this)
    this.logErrors   = this.logErrors.bind(this)

    this.batchDuration = 60000 // 1 minute
    this.batchStart    = {}
    this.batches       = {}
    this.errors        = {}
  }


  handleError(error, source) {
    const message    = error.message
    const errors     = this.errors[source]
                    || {}; this.errors[source] = errors
    const batch      = this.batches[source]
                    || []; this.batches[source] = batch
    const batchStart = this.batchStart[source]
                    || 0; this.batchStart[source] = batchStart

    if (!batchStart) {
      this.batchStart[source] = new Date().toUTCString()
      this.setTimeout(source)

      console.log(error)

    } else {
      const index = batch.indexOf(message)

      if (index < 0) {
        // This error has not occurred yet in the current streak
        console.log(error)
        batch.push(message)
      }

    }

    const count = errors[message]
    errors[message] = count ? count + 1 : 1
  }


  logErrors(source) {
    if (!Object.keys(this.errors[source]).length) {
      // A whole batch cycle has gone past with no errors
      // Report new errors immediately as they occur
      this.batchStart[source] = 0
      this.batches[source].length = 0
      return
    }

    console.log(
      "Errors for \""+source+"\" since "+this.batchStart[source]
    )
    console.log(this.errors[source])
    console.log()

    this.errors[source] = {}
    this.batchStart[source] = new Date().toUTCString()
    this.setTimeout(source)
  }


  setTimeout(source) {
    setTimeout(
      () => {this.logErrors(source)}
    , this.batchDuration
    )
  }
}



export default new ErrorTracker().handleError