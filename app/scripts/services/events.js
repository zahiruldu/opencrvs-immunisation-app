'use strict'

module.exports = function (Api, $q) {
  const BIRTH = 'birth-notification'

  const isImmunisationEncounter = (event) => {
    return event.resourceType &&
      event.resourceType === 'Encounter' &&
      event.class &&
      event.class === 'Immunisation'
  }

  const isEventOfType = (eventTypeCode, event) => {
    return isImmunisationEncounter(event) &&
      event.type &&
      Array.isArray(event.type) &&
      event.type.some((typeElem) => {
        return typeElem.coding &&
          Array.isArray(typeElem.coding) &&
          typeElem.coding.some((codingElem) => {
            return codingElem.system &&
              codingElem.system === 'http://hearth.org/crvs/event-types' &&
              codingElem.code &&
              codingElem.code === eventTypeCode
          })
      })
  }

  const constructSimpleBirthNotificationObject = (encounter, location) => {
    let encounterType

    encounter.type.forEach((type) => {
      if (type.coding[0].system === 'http://hearth.org/crvs/event-types') {
        encounterType = type.coding[0].display
      }
    })

    return {
      eventTitle: 'Birth Notification',
      eventType: BIRTH,
      eventDate: encounter.period.start,
      data: {
        encounterType: encounterType,
        birthPlace: location.name,
        birthDate: encounter.period.start
      }
    }
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
      Api.Encounters.get({ patient: patientId, _count: 0 }, (res) => {
        callback(null, res.entry)
      }, (err) => {
        callback(err)
      })
    },

    resolveReferences: (encountersArray) => {
      const defer = $q.defer()

      const promises = []
      encountersArray.forEach((encounter) => {
        const observation = Api.Observations.get({ encounter: encounter.resource.id }, function (result) {
          encounter._observations = result.entry
        }, function (err) {
          console.error(err)
        })
        promises.push(observation.$promise)

        if (encounter.resource && encounter.resource.location && encounter.resource.location[0] && encounter.resource.location[0].location && encounter.resource.location[0].location.reference) {
          const split = encounter.resource.location[0].location.reference.split('/')
          const location = Api.Reference.get({ resource: split[0], id: split[1] }, function (result) {
            encounter._location = result
          }, function (err) {
            console.error(err)
          })
          promises.push(location.$promise)
        }
      })

      $q.all(promises).then(() => {
        defer.resolve(encountersArray)
      }).catch((err) => {
        console.error(err)
        defer.reject(err)
      })

      return defer.promise
    },

    formatEvents: (events) => {
      const simpleEvents = []
      events.forEach((event) => {
        if (isEventOfType(BIRTH, event.resource)) {
          event = constructSimpleBirthNotificationObject(event.resource, event._location)
        } else {
          console.error('Unknown event type found', event)
        }
        simpleEvents.push(event)
      })
      return simpleEvents
    },

    constructSimpleBirthNotificationObject: constructSimpleBirthNotificationObject,

    isEventOfType: isEventOfType
  }
}
