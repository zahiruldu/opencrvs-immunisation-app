'use strict'

const sinon = require('sinon')
const tap = require('tap')

const Events = require('../../app/scripts/services/events')
const encounterTemplate = require('../../app/scripts/services/FHIR/resources/Encounter')
const observationTemplate = require('../../app/scripts/services/FHIR/resources/Observation')
const locationTemplate = require('../../app/scripts/services/FHIR/resources/Location')
const immunisationTemplate = require('../../app/scripts/services/FHIR/resources/Immunization')

const sandbox = sinon.sandbox.create()
sandbox.stub(console, 'error').callsFake((msg) => {})
sandbox.stub(console, 'log').callsFake((msg) => {})
tap.tearDown(() => {
  sandbox.restore()
})

tap.test('Events service', { autoend: true }, (t) => {
  t.test('.sortEventsDesc', { autoend: true }, (t) => {
    t.test('should sort events in descending order', (t) => {
      const sortedDates = Events().sortEventsDesc([
        { expectedOrder: 4, eventDate: new Date('2017-01-13T11:11:59+02:00') },
        { expectedOrder: 0, eventDate: new Date('2017-06-13T11:11:59+02:00') },
        { expectedOrder: 3, eventDate: new Date('2017-03-13T11:11:59+02:00') },
        { expectedOrder: 1, eventDate: new Date('2017-04-14T11:11:59+02:00') },
        { expectedOrder: 2, eventDate: new Date('2017-04-13T11:11:59+02:00') }
      ])
      t.equals(sortedDates[0].expectedOrder, 0)
      t.equals(sortedDates[1].expectedOrder, 1)
      t.equals(sortedDates[2].expectedOrder, 2)
      t.equals(sortedDates[3].expectedOrder, 3)
      t.equals(sortedDates[4].expectedOrder, 4)
      t.end()
    })

    t.test('should work when dates are strings', (t) => {
      const sortedDates = Events().sortEventsDesc([
        { expectedOrder: 4, eventDate: new Date('2017-01-13T11:11:59+02:00') },
        { expectedOrder: 0, eventDate: '2017-06-13T11:11:59+02:00' },
        { expectedOrder: 3, eventDate: new Date('2017-03-13T11:11:59+02:00') },
        { expectedOrder: 1, eventDate: '2017-04-14T11:11:59+02:00' },
        { expectedOrder: 2, eventDate: '2017-04-13T11:11:59+02:00' }
      ])
      t.equals(sortedDates[0].expectedOrder, 0)
      t.equals(sortedDates[1].expectedOrder, 1)
      t.equals(sortedDates[2].expectedOrder, 2)
      t.equals(sortedDates[3].expectedOrder, 3)
      t.equals(sortedDates[4].expectedOrder, 4)
      t.end()
    })
  })

  t.test('.isEventOfType', { autoend: true }, (t) => {
    t.test('should return true when event is a birth notification event', (t) => {
      const result = Events().isEventOfType('birth-notification', require('../resources/events/birth-notification.json'))
      t.true(result)
      t.end()
    })

    t.test('should return false when event isn\'t a Birth notification event', (t) => {
      const result = Events().isEventOfType('birth-notification', {})
      t.false(result)
      t.end()
    })

    t.test('should return true when event is a immunisation event', (t) => {
      const result = Events().isEventOfType('immunisation', require('../resources/events/immunisation.json'))
      t.true(result)
      t.end()
    })
  })

  t.test('.constructSimpleBirthNotificationObject', { autoend: true }, (t) => {
    t.test('should construct simple birth notification object', (t) => {
      const events = Events()

      const encounter = JSON.parse(JSON.stringify(encounterTemplate))
      encounter.period.start = '2017-04-04'
      encounter.type = [
       { coding: [ { system: 'http://hearth.org/crvs/event-types', code: 'birth-notification', display: 'Birth Notification' } ] }
      ]

      const location = JSON.parse(JSON.stringify(locationTemplate))
      location.name = 'Test Location'

      const event = events.constructSimpleBirthNotificationObject(encounter, location)

      t.equals(event.eventTitle, 'Birth Notification')
      t.equals(event.eventType, 'birth-notification')
      t.equals(event.eventDate, '2017-04-04')
      t.equals(event.data.encounterType, 'Birth Notification')
      t.equals(event.data.birthPlace, 'Test Location')
      t.equals(event.data.birthDate, '2017-04-04')
      t.end()
    })

    t.test('should construct simple immunisation object', (t) => {
      const events = Events()

      const encounter = JSON.parse(JSON.stringify(encounterTemplate))
      encounter.period.start = '2017-04-04'
      encounter.type = [
       { coding: [ { system: 'http://hearth.org/crvs/event-types', code: 'immunisation', display: 'Immunisation' } ] }
      ]

      const location = JSON.parse(JSON.stringify(locationTemplate))
      location.name = 'Test Location'

      const immunisation = JSON.parse(JSON.stringify(immunisationTemplate))
      immunisation.vaccineCode.text = 'Test Vaccine'

      const event = events.constructSimpleImmunisationObject(encounter, location, immunisation)

      t.equals(event.eventTitle, 'Immunisation')
      t.equals(event.eventType, 'immunisation')
      t.equals(event.eventDate, '2017-04-04')
      t.equals(event.data.encounterType, 'Immunisation')
      t.equals(event.data.encounterLocation, 'Test Location')
      t.equals(event.data.encounterDate, '2017-04-04')
      t.equals(event.data.immunisationAdministered, 'Test Vaccine')
      t.end()
    })
  })

  t.test('.formatEvents', { autoend: true }, (t) => {
    t.test('should delegate event formatting depending on event type', (t) => {
      // given
      // Sample Encounter
      const birthEncounter = JSON.parse(JSON.stringify(encounterTemplate))
      birthEncounter.period.start = '2017-04-04'
      birthEncounter.type = [
        { coding: [ { system: 'http://hearth.org/crvs/event-types', code: 'birth-notification', display: 'Birth Notification' } ] }
      ]

      const immunisationEncounter = JSON.parse(JSON.stringify(encounterTemplate))
      immunisationEncounter.period.start = '2017-04-04'
      immunisationEncounter.type = [
        { coding: [ { system: 'http://hearth.org/crvs/event-types', code: 'immunisation', display: 'Immunisation' } ] }
      ]

      const location = JSON.parse(JSON.stringify(locationTemplate))
      location.name = 'Test Location'

      const immunisation = JSON.parse(JSON.stringify(immunisationTemplate))
      immunisation.vaccineCode.text = 'Test Vaccine'

      const encounters = [
        {
          'resource': birthEncounter,
          '_observations': [],
          _location: location,
          _immunisation: immunisation
        },
        {
          'resource': immunisationEncounter,
          '_observations': [],
          _location: location,
          _immunisation: immunisation
        }
      ]

      // when
      const formattedEvents = Events().formatEvents(encounters)

      t.ok(formattedEvents)

      t.equals(formattedEvents[0].eventTitle, 'Birth Notification')
      t.equals(formattedEvents[0].eventType, 'birth-notification')
      t.equals(formattedEvents[0].eventDate, '2017-04-04')
      t.equals(formattedEvents[0].data.encounterType, 'Birth Notification')
      t.equals(formattedEvents[0].data.birthPlace, 'Test Location')
      t.equals(formattedEvents[0].data.birthDate, '2017-04-04')

      t.equals(formattedEvents[1].eventTitle, 'Immunisation')
      t.equals(formattedEvents[1].eventType, 'immunisation')
      t.equals(formattedEvents[1].eventDate, '2017-04-04')
      t.equals(formattedEvents[1].data.encounterType, 'Immunisation')
      t.equals(formattedEvents[1].data.encounterLocation, 'Test Location')
      t.equals(formattedEvents[1].data.encounterDate, '2017-04-04')
      t.equals(formattedEvents[1].data.immunisationAdministered, 'Test Vaccine')
      t.end()
    })
  })

  t.test('.getAllEncountersForPatient', { autoend: true }, (t) => {
    t.test('should fetch encounters and return array', (t) => {
      // Encounters for Patient/12345
      const encounter1 = JSON.parse(JSON.stringify(encounterTemplate))
      encounter1.id = '1'
      encounter1.period.start = '2017-01-01'
      encounter1.location[0].location.display = 'Test Hospital 1'
      encounter1.patient.reference = 'Patient/12345'
      encounter1.type[0].coding[0].code = 'event 1'
      const encounter2 = JSON.parse(JSON.stringify(encounterTemplate))
      encounter2.id = '2'
      encounter2.period.start = '2017-02-02'
      encounter2.location[0].location.display = 'Test Hospital 2'
      encounter2.patient.reference = 'Patient/12345'
      encounter2.type[0].coding[0].code = 'event 2'

      const encountersBundle = { entry: [encounter1, encounter2] }

      const apiMock = {
        Encounters: {
          get: (params) => {
            t.equals(params.patient, '12345')
            return new Promise((resolve, reject) => {
              resolve(encountersBundle)
            })
          }
        }
      }

      const events = Events(apiMock)
      events.getAllEncountersForPatient('12345', (err, res) => {
        t.error(err)

        t.equals(res[0].id, '1')
        t.equals(res[1].id, '2')
      })
      t.end()
    })
  })

  t.test('.resolveReferences', { autoend: true }, (t) => {
    t.test('attach observations to encounters and return array', (t) => {
      // Encounters for Patient/12345
      const encounter1 = {
        resource: JSON.parse(JSON.stringify(encounterTemplate))
      }
      encounter1.resource.id = '1'
      encounter1.resource.period.start = '2017-01-01'
      encounter1.resource.location[0].location.display = 'Test Hospital 1'
      encounter1.resource.patient.reference = 'Patient/12345'
      encounter1.resource.type[0].coding[0].code = 'event 1'
      const encounter2 = {
        resource: JSON.parse(JSON.stringify(encounterTemplate))
      }
      encounter2.resource.id = '2'
      encounter2.resource.period.start = '2017-02-02'
      encounter2.resource.location[0].location.display = 'Test Hospital 2'
      encounter2.resource.patient.reference = 'Patient/12345'
      encounter2.resource.type[0].coding[0].code = 'event 2'

      // Observations for Encounters 1 and 2
      const observation1 = {
        resource: JSON.parse(JSON.stringify(observationTemplate))
      }
      observation1.resource.encounter.reference = 'Encounter/1'
      observation1.resource.valueCodeableConcept.coding = { system: 'Test System 1', code: 'Test Code 1' }
      observation1.resource.valueCodeableConcept.text = 'Observation 1 outcome'
      const observation2 = {
        resource: JSON.parse(JSON.stringify(observationTemplate))
      }
      observation2.resource.encounter.reference = 'Encounter/1'
      observation2.resource.valueCodeableConcept.coding = { system: 'Test System 2', code: 'Test Code 2' }
      observation2.resource.valueCodeableConcept.text = 'Observation 2 outcome'
      const observation3 = {
        resource: JSON.parse(JSON.stringify(observationTemplate))
      }
      observation3.resource.encounter.reference = 'Encounter/2'
      observation3.resource.valueCodeableConcept.coding = { system: 'Test System 3', code: 'Test Code 3' }
      observation3.resource.valueCodeableConcept.text = 'Observation 3 outcome'

      const encounters = [encounter1, encounter2]

      const apiMock = {
        Observations: {
          get: (params) => {
            switch (params['encounter']) {
              case '1':
                encounter1._observations = [observation1, observation2]
                break
              case '2':
                encounter2._observations = [observation3]
                break
            }
            return new Promise((resolve, reject) => {
              resolve()
            })
          }
        },
        Reference: {
          get: (params) => {
            return new Promise((resolve, reject) => {
              resolve()
            })
          }
        }
      }
      const qMock = {
        defer: () => {
          return {
            resolve: (encountersArray) => {
              t.equals(encountersArray[0]._observations[0].resource.encounter.reference, 'Encounter/1')
              t.equals(encountersArray[0]._observations[1].resource.encounter.reference, 'Encounter/1')
              t.equals(encountersArray[1]._observations[0].resource.encounter.reference, 'Encounter/2')
              t.end()
            }
          }
        },
        all: (promises) => {
          return Promise.all(promises)
        }
      }

      const events = Events(apiMock, qMock)
      events.resolveReferences(encounters)
    })
  })
})
