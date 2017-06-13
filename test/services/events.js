'use strict'

const sinon = require('sinon')
const tap = require('tap')

const Events = require('../../app/scripts/services/events')
const encounterTemplate = require('../../app/scripts/services/FHIR/resources/Encounter')
const observationTemplate = require('../../app/scripts/services/FHIR/resources/Observation')

const sandbox = sinon.sandbox.create()
sandbox.stub(console, 'error').callsFake((msg) => {})
sandbox.stub(console, 'log').callsFake((msg) => {})
tap.tearDown(() => {
  sandbox.restore()
})

tap.test('Events service', { autoend: true }, (t) => {
  t.test('.isEventOfType', { autoend: true }, (t) => {
    t.test('should return true when event is an HIV confirmation event', (t) => {
      const result = Events().isEventOfType('hiv-confirmation', require('../resources/events/hiv-confirmation.json'))
      t.true(result)
      t.end()
    })

    t.test('should return false when event isn\'t an HIV confirmation event', (t) => {
      const result = Events().isEventOfType('hiv-confirmation', require('../resources/events/cd4-count.json'))
      t.false(result)
      t.end()
    })

    t.test('should return true when event is an Linkage to Care event', (t) => {
      const result = Events().isEventOfType('linkage-to-care', require('../resources/events/linkage-to-care.json'))
      t.true(result)
      t.end()
    })

    t.test('should return false when event isn\'t an Linkage to Care event', (t) => {
      const result = Events().isEventOfType('linkage-to-care', require('../resources/events/viral-load.json'))
      t.false(result)
      t.end()
    })

    t.test('should return true when event is an CD4 count event', (t) => {
      const result = Events().isEventOfType('cd4-count', require('../resources/events/cd4-count.json'))
      t.true(result)
      t.end()
    })

    t.test('should return false when event isn\'t an CD4 count event', (t) => {
      const result = Events().isEventOfType('cd4-count', require('../resources/events/viral-load.json'))
      t.false(result)
      t.end()
    })

    t.test('should return true when event is an Viral Load event', (t) => {
      const result = Events().isEventOfType('viral-load', require('../resources/events/viral-load.json'))
      t.true(result)
      t.end()
    })

    t.test('should return false when event isn\'t an Viral Load event', (t) => {
      const result = Events().isEventOfType('viral-load', require('../resources/events/hiv-confirmation.json'))
      t.false(result)
      t.end()
    })
  })

  t.test('.constructSimpleHIVConfirmationObject()', { autoend: true }, (t) => {
    t.test('should construct a simple object for HIV confirmation', (t) => {
      // given
      const encounter = JSON.parse(JSON.stringify(encounterTemplate))
      const observation = JSON.parse(JSON.stringify(observationTemplate))
      const observationPartner = JSON.parse(JSON.stringify(observationTemplate))

      encounter.period.start = '2017-06-01'
      encounter.type[0].coding[0].code = 'hiv-confirmation'
      encounter.type[0].coding[0].display = 'HIV Confirmation'
      encounter.location[0].location.display = 'Chuk'

      observation.effectiveDateTime = '2010-06-30'
      observation.code.coding[0].system = 'http://loinc.org'
      observation.code.coding[0].code = '33660-2'
      observation.code.coding[0].display = 'HIV 1 p24 Ag [Presence] in Serum by Neutralization test'
      observation.valueCodeableConcept = {
        coding: {
          system: 'http://loinc.org',
          code: 'LA6576-8'
        },
        text: 'Positive'
      }

      observationPartner.effectiveDateTime = '2010-06-30'
      observationPartner.code.coding[0].system = 'http://hearth.org/cbs'
      observationPartner.code.coding[0].code = 'partner-hiv-status'
      observationPartner.code.coding[0].display = 'Partners HIV status'
      observationPartner.valueCodeableConcept = {
        coding: {
          system: 'http://loinc.org',
          code: 'LA6576-8'
        },
        text: 'Positive'
      }

      // when
      const hivConfimObj = Events().constructSimpleHIVConfirmationObject(encounter, [observation, observationPartner])

      t.ok(hivConfimObj)

      t.equal(hivConfimObj.eventType, 'hiv-confirmation', 'should have a eventType of "hiv-confirmation"')
      t.equal(hivConfimObj.eventDate, '2017-06-01', 'should have a eventDate of "2017-06-01"')
      t.equal(hivConfimObj.data.partnerStatus, 'Positive', 'should have a data.partnerStatus of "Positive"')
      t.equal(hivConfimObj.data.firstPositiveHivTestLocation, 'Chuk', 'should have a data.firstPositiveHivTestLocation of "Chuk"')
      t.equal(hivConfimObj.data.firstPositiveHivTestDate, '2010-06-30', 'should have a data.firstPositiveHivTestDate of "2010-06-30"')

      t.end()
    })
  })

  t.test('.constructSimpleFirstViralLoadObject()', { autoend: true }, (t) => {
    t.test('should construct a simple object for First Viral Load', (t) => {
      // given
      const encounter = JSON.parse(JSON.stringify(encounterTemplate))
      const observation = JSON.parse(JSON.stringify(observationTemplate))

      encounter.period.start = '2017-04-04'
      encounter.type[0].coding[0].code = 'first-viral-load'
      encounter.type[0].coding[0].display = 'First Viral Load'
      encounter.location[0].location.display = 'Chuk'

      observation.effectiveDateTime = '2017-04-04'
      observation.code.coding[0].system = 'http://loinc.org'
      observation.code.coding[0].code = '25836-8'
      observation.code.coding[0].display = 'HIV 1 RNA [#/​volume] (viral load) in Unspecified specimen by Probe and target amplification method'

      observation.valueQuantity = {
        value: 599,
        unit: 'copies/mL',
        system: 'http://unitsofmeasure.org',
        code: 'copies/mL'
      }

      observation.contained = [
        {
          resourceType: 'Practitioner',
          id: 'practioner-1',
          'name': [{
            'family': ['Smith'],
            'given': ['Jane']
          }]
        }
      ]

      observation.performer = [
        {
          reference: '#practioner-1'
        }
      ]

      // when
      const highViralLoadObj = Events().constructSimpleFirstViralLoadObject(encounter, [observation])

      t.ok(highViralLoadObj)

      t.equal(highViralLoadObj.eventType, 'first-viral-load', 'should have a eventType of "first-viral-load"')
      t.equal(highViralLoadObj.eventDate, '2017-04-04', 'should have a eventDate of "2017-04-04"')
      t.equal(highViralLoadObj.data.firstViralLoadDate, '2017-04-04', 'should have a data.firstViralLoadDate of "2017-04-04"')
      t.deepEquals(highViralLoadObj.data.firstViralLoadResults, observation.valueQuantity, 'should have a data.firstViralLoadResults object with results')
      t.equal(highViralLoadObj.data.firstViralLoadLocation, 'Chuk', 'should have a data.firstViralLoadLocation of "Chuk"')
      t.equal(highViralLoadObj.data.firstViralLoadProvider, 'Jane Smith', 'should have a data.firstViralLoadProvider of "Jane Smith"')

      t.end()
    })
  })

  t.test('.formatEvents', { autoend: true }, (t) => {
    t.test('should delegate event formatting depending on event type')
  })

  t.test('.getAllEncountersForPatient', { autoend: true }, (t) => {
    t.test('fetch encounters and return array', (t) => {
    // Encounters for Patient/12345
      const encounter1 = JSON.parse(JSON.stringify(encounterTemplate))
      encounter1.id = '1'
      encounter1.period.start = '2017-01-01'
      encounter1.location[0].location.display = 'Test Hospital 1'
      encounter1.patient.reference = 'Patient/12345'
      encounter1.type[0].coding[0].code = 'linkage-to-care'
      const encounter2 = JSON.parse(JSON.stringify(encounterTemplate))
      encounter2.id = '2'
      encounter2.period.start = '2017-02-02'
      encounter2.location[0].location.display = 'Test Hospital 2'
      encounter2.patient.reference = 'Patient/12345'
      encounter2.type[0].coding[0].code = 'first-cd4-count'

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

  t.test('.addObservationsToEncounters', { autoend: true }, (t) => {
    t.test('attach observations to encounters and return array', (t) => {
    // Encounters for Patient/12345
      const encounter1 = JSON.parse(JSON.stringify(encounterTemplate))
      encounter1.id = '1'
      encounter1.period.start = '2017-01-01'
      encounter1.location[0].location.display = 'Test Hospital 1'
      encounter1.patient.reference = 'Patient/12345'
      encounter1.type[0].coding[0].code = 'linkage-to-care'
      const encounter2 = JSON.parse(JSON.stringify(encounterTemplate))
      encounter2.id = '2'
      encounter2.period.start = '2017-02-02'
      encounter2.location[0].location.display = 'Test Hospital 2'
      encounter2.patient.reference = 'Patient/12345'
      encounter2.type[0].coding[0].code = 'first-cd4-count'

    // Observations for Encounters 1 and 2
      const observation1 = JSON.parse(JSON.stringify(observationTemplate))
      observation1.encounter.reference = 'Encounter/1'
      observation1.valueCodeableConcept.coding = { system: 'Test System 1', code: 'Test Code 1' }
      observation1.valueCodeableConcept.text = 'Observation 1 outcome'
      const observation2 = JSON.parse(JSON.stringify(observationTemplate))
      observation2.encounter.reference = 'Encounter/1'
      observation2.valueCodeableConcept.coding = { system: 'Test System 2', code: 'Test Code 2' }
      observation2.valueCodeableConcept.text = 'Observation 2 outcome'
      const observation3 = JSON.parse(JSON.stringify(observationTemplate))
      observation3.encounter.reference = 'Encounter/2'
      observation3.valueCodeableConcept.coding = { system: 'Test System 3', code: 'Test Code 3' }
      observation3.valueCodeableConcept.text = 'Observation 3 outcome'

      const encounters = [encounter1, encounter2]

      const apiMock = {
        Observations: {
          get: (params) => {
            let observations
            switch (params['encounter.reference'].$eq) {
              case 'Encounter/1':
                observations = [observation1, observation2]
                break
              case 'Encounter/2':
                observations = [observation3]
                break
            }
            const result = {
              entry: observations,
              $promise: Promise.resolve(),
              $resolved: true
            }
            return result
          }
        }
      }
      const qMock = {
        defer: () => {
          return {
            resolve: (encountersArray) => {
              t.equals(encountersArray[0]._observations[0].encounter.reference, 'Encounter/1')
              t.equals(encountersArray[0]._observations[1].encounter.reference, 'Encounter/1')
              t.equals(encountersArray[1]._observations[0].encounter.reference, 'Encounter/2')
              t.end()
            }
          }
        },
        all: (promises) => {
          return Promise.all(promises)
        }
      }

      const events = Events(apiMock, qMock)
      events.addObservationsToEncounters(encounters)
    })
  })
})
