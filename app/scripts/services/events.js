'use strict'

module.exports = function (Api, $q) {
  const HIV_CONFIRMATION = 'hiv-confirmation'
  const FIRST_VIRAL_LOAD = 'first-viral-load'

  const isHIVEncounter = (event) => {
    return event.resourceType &&
      event.resourceType === 'Encounter' &&
      event.class &&
      event.class === 'HIVAIDS'
  }

  const isEventOfType = (eventTypeCode, event) => {
    return isHIVEncounter(event) &&
      event.type &&
      Array.isArray(event.type) &&
      event.type.some((typeElem) => {
        return typeElem.coding &&
          Array.isArray(typeElem.coding) &&
          typeElem.coding.some((codingElem) => {
            return codingElem.system &&
              codingElem.system === 'http://hearth.org/cbs/event-types' &&
              codingElem.code &&
              codingElem.code === eventTypeCode
          })
      })
  }

  return {
    sortEventsDesc: (events) => {
      return events.sort((a, b) => {
        if (!(a.eventDate instanceof Date)) { a.eventDate = new Date(a.eventDate) }
        if (!(b.eventDate instanceof Date)) { b.eventDate = new Date(b.eventDate) }
        return b.eventDate - a.eventDate
      })
    },

    getAllEncountersForPatient: (patientId, callback) => {
      Api.Encounters.get({ patient: patientId }, (res) => {
        callback(null, res.entry)
      }, (err) => {
        callback(err)
      })
    },

    addObservationsToEncounters: (encountersArray) => {
      const defer = $q.defer()

      const promises = []
      encountersArray.forEach((encounter) => {
        const resource = Api.Observations.get({'encounter.reference': { $eq: 'Encounter/' + encounter.id }})
        encounter._observations = resource.$resolved ? resource.entry : []
        promises.push(resource.$promise)
      })

      $q.all(promises).then(() => {
        defer.resolve(encountersArray)
      }).catch((err) => {
        console.error(err)
        defer.reject(err)
      })
    },

    isEventOfType: isEventOfType,

    formatEvents: (events) => {
      events.forEach((event) => {
        if (isEventOfType('linkage-to-care', event)) {
          // call format function
        } else if (isEventOfType('hiv-confirmation', event)) {
          // call format function
        } else if (isEventOfType('cd4-count', event)) {
          // call format function
        } else if (isEventOfType('viral-load', event)) {
          // call format function
        } else {
          console.error('Unknown event type found', event)
        }
      })
      return events
    },

    constructSimpleHIVConfirmationObject: (encounter, observations) => {
      let firstPositiveHivTestDate, partnerStatus

      observations.forEach((obs) => {
        switch (obs.code.coding[0].code) {
          case '33660-2': // HIV test
            firstPositiveHivTestDate = obs.effectiveDateTime
            break
          case 'partner-hiv-status':
            partnerStatus = obs.valueCodeableConcept.text
            break
        }
      })

      return {
        eventType: HIV_CONFIRMATION,
        eventDate: encounter.period.start,
        data: {
          partnerStatus: partnerStatus,
          firstPositiveHivTestLocation: encounter.location[0].location.display,
          firstPositiveHivTestDate: firstPositiveHivTestDate
        }
      }
    },

    constructSimpleFirstViralLoadObject: (encounter, observations) => {
      let providerName

      observations[0].contained.forEach((containedResource) => {
        if (containedResource.id === observations[0].performer[0].reference.substring(1)) {
          const providerGivenName = containedResource.name[0].given.join(' ')
          const providerFamilyName = containedResource.name[0].family.join(' ')
          providerName = providerGivenName + ' ' + providerFamilyName
        }
      })

      return {
        eventType: FIRST_VIRAL_LOAD,
        eventDate: encounter.period.start,
        data: {
          firstViralLoadDate: observations[0].effectiveDateTime,
          firstViralLoadResults: observations[0].valueQuantity,
          firstViralLoadLocation: encounter.location[0].location.display,
          firstViralLoadProvider: providerName
        }
      }
    }
  }
}
