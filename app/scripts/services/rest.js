'use strict'

module.exports = function ($resource) {
  var server = 'http://localhost:3447'

  return {
    Patients: $resource(server + '/fhir/Patient/:id', { id: '@id' })
  }
}
