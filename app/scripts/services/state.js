'use strict'

module.exports = function () {
  var searchResults = null
  var eventsArray = []
  var partialPatientDemographics = null
  var searchType = null

  return {
    getSearchResults: function () {
      return searchResults
    },
    setSearchResults: function (results) {
      searchResults = results
    },
    getEventsArray: function () {
      return eventsArray
    },
    setEventsArray: function (events) {
      eventsArray = events
    },
    pushToEventsArray: function (event) {
      eventsArray.push(event)
    },
    setPartialPatientDemographics: function (partialPatient) {
      partialPatientDemographics = partialPatient
    },
    getPartialPatientDemographics: function () {
      return partialPatientDemographics
    },
    setSearchType: function (type) {
      searchType = type
    },
    getSearchType: function () {
      return searchType
    }
  }
}
