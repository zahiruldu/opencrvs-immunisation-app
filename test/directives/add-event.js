'use strict'

const tap = require('tap')
const sinon = require('sinon')

const FHIR = require('../../app/scripts/services/FHIR/FHIR.js')()
const FormBuilderService = require('../../app/scripts/services/FormBuilder.js')()
const stateService = require('../../app/scripts/services/state.js')()
const addEvent = require('../../app/scripts/directives/add-events/add-event')
const FormBuilderAddEventBirthNotification = require('../../app/scripts/directives/add-events/add-event/forms/birth-notification.json')
const FormBuilderAddEventImmunisation = require('../../app/scripts/directives/add-events/add-event/forms/immunisation.json')

const sandbox = sinon.sandbox.create()
sandbox.stub(console, 'error').callsFake((msg) => {})
sandbox.stub(console, 'log').callsFake((msg) => {})
tap.tearDown(() => {
  sandbox.restore()
})

tap.test('.link()', { autoend: true }, (t) => {
  t.test('should set state.FormBuilderAddEventBirthNotification on scope and fetch correct form file', (t) => {
    // given
    const scope = {
      $watch: (args, callback) => { callback() },
      event: { code: 'birth-notification', display: 'Birth Notification', formName: 'FormBuilderAddEventBirthNotification' }
    }
    const fetchMock = (file) => {
      t.equals(file, 'app/scripts/directives/add-events/add-event/forms/birth-notification.json')
      return new Promise((resolve, reject) => {
        resolve(require('../../app/scripts/directives/add-events/add-event/forms/birth-notification.json'))
      })
    }
    const directive = addEvent({ fetch: fetchMock })
    // when
    directive.link(scope)
    // then
    t.ok(scope.state.FormBuilderAddEventBirthNotification)
    t.end()
  })

  t.test('should set state.FormBuilderAddEventImmunisation on scope and fetch correct form file', (t) => {
    // given
    const scope = {
      $watch: (args, callback) => { callback() },
      event: { code: 'immunisation', display: 'Immunisation', formName: 'FormBuilderAddEventImmunisation' }
    }
    const fetchMock = (file) => {
      t.equals(file, 'app/scripts/directives/add-events/add-event/forms/immunisation.json')
      return new Promise((resolve, reject) => {
        resolve(require('../../app/scripts/directives/add-events/add-event/forms/immunisation.json'))
      })
    }
    const directive = addEvent({ fetch: fetchMock })
    // when
    directive.link(scope)
    // then
    t.ok(scope.state.FormBuilderAddEventImmunisation)
    t.end()
  })
})

tap.test('.submit()', { autoend: true }, (t) => {
  t.test('state.FormBuilderAddEventBirthNotification should resolve with a success message', (t) => {
    // given
    const testSandbox = sinon.sandbox.create()
    testSandbox.spy(stateService, 'pushToEventsArray')

    const scope = {
      $watch: (args, callback) => { callback() },
      event: { code: 'birth-notification', display: 'Birth Notification', formName: 'FormBuilderAddEventBirthNotification' },
      patient: {
        toJSON: () => {
          return {
            resourceType: 'Patient',
            id: 'AAAAA-BBBB-CCCC-DDDDD-EEEEEE'
          }
        },
        resourceType: 'Patient',
        id: 'AAAAA-BBBB-CCCC-DDDDD-EEEEEE'
      }
    }
    const mockFormData = {
      $setPristine: function () {},
      $setUntouched: function () {},
      encounterLocation: {
        $modelValue: 'Location/123',
        $dirty: true
      },
      birthDate: {
        $modelValue: '2017-02-23',
        $dirty: true
      },
      mothersGivenName: {
        $modelValue: 'Mary',
        $dirty: true
      },
      mothersFamilyName: {
        $modelValue: 'Smith',
        $dirty: true
      },
      mothersContactNumber: {
        $modelValue: '+27725556784',
        $dirty: true
      }
    }
    const fetchMock = (file) => {
      return new Promise((resolve, reject) => {
        if (file === 'app/scripts/directives/add-events/add-event/forms/birth-notification.json') {
          const FormBuilderAddEventBirthNotification = require('../../app/scripts/directives/add-events/add-event/forms/birth-notification.json')
          resolve(FormBuilderAddEventBirthNotification)
        } else if (file === 'app/scripts/services/FHIR/resources/RelatedPerson-motherDetails.json') {
          const FHIREncounterResource = require('../../app/scripts/services/FHIR/resources/RelatedPerson-motherDetails.json')
          resolve(FHIREncounterResource)
        } else if (file === 'app/scripts/services/FHIR/resources/Location.json') {
          const FHIRLocationResource = require('../../app/scripts/services/FHIR/resources/Location.json')
          resolve(FHIRLocationResource)
        } else if (file === 'app/scripts/services/FHIR/resources/Encounter.json') {
          const FHIRObservationResource = require('../../app/scripts/services/FHIR/resources/Encounter.json')
          resolve(FHIRObservationResource)
        } else if (file === 'app/scripts/services/FHIR/resources/Immunization.json') {
          const FHIRImmunisationResource = require('../../app/scripts/services/FHIR/resources/Immunization.json')
          resolve(FHIRImmunisationResource)
        }
      })
    }
    const deferMock = () => {
      return {
        resolve: (result) => {
          // then
          t.equals(result.isValid, true)
          t.equals(result.msg, 'Event has been successfully added for submission')

          const eventDict = stateService.pushToEventsArray.getCall(0).args[0]

          t.equals(eventDict.childDetails.resourceType, 'Patient')
          t.equals(eventDict.motherDetails.resourceType, 'RelatedPerson')
          t.equals(eventDict.main.resourceType, 'Encounter')

          t.equals(eventDict.childDetails.birthDate, '2017-02-23')

          t.equals(eventDict.motherDetails.name.given[0], 'Mary')
          t.equals(eventDict.motherDetails.name.family[0], 'Smith')
          t.equals(eventDict.motherDetails.telecom[0].value, '+27725556784')
          t.equals(eventDict.motherDetails.patient.reference, 'Patient/AAAAA-BBBB-CCCC-DDDDD-EEEEEE')
          t.equals(eventDict.motherDetails.relationship.coding[0].code, 'MTH')

          t.equals(eventDict.main.location[0].location.reference, 'Location/123')

          testSandbox.restore()
          t.end()
        }
      }
    }

    const directive = addEvent({ fetch: fetchMock }, { defer: deferMock }, stateService, FHIR, FormBuilderService)
    directive.link(scope)
    // when
    scope.state.FormBuilderAddEventBirthNotification.sections = [FormBuilderAddEventBirthNotification]
    scope.state.FormBuilderAddEventBirthNotification.submit.execute(mockFormData)
    // then
    t.ok(scope.state.FormBuilderAddEventBirthNotification)
  })

  t.test('state.FormBuilderAddEventImmunisation should resolve with a success message', (t) => {
    // given
    const testSandbox = sinon.sandbox.create()
    testSandbox.spy(stateService, 'pushToEventsArray')

    const scope = {
      $watch: (args, callback) => { callback() },
      event: { code: 'immunisation', display: 'Immunisation', formName: 'FormBuilderAddEventImmunisation' },
      patient: {
        toJSON: () => {
          return {
            resourceType: 'Patient',
            id: 'AAAAA-BBBB-CCCC-DDDDD-EEEEEE'
          }
        },
        resourceType: 'Patient',
        id: 'AAAAA-BBBB-CCCC-DDDDD-EEEEEE'
      }
    }
    const mockFormData = {
      $setPristine: function () {},
      $setUntouched: function () {},
      encounterLocation: {
        $modelValue: 'Location/123',
        $dirty: true
      },
      immunisationDate: {
        $modelValue: '2017-02-23',
        $dirty: true
      },
      immunisationAdministered: {
        $modelValue: '111111',
        $dirty: true
      }
    }
    const fetchMock = (file) => {
      return new Promise((resolve, reject) => {
        if (file === 'app/scripts/directives/add-events/add-event/forms/immunisation.json') {
          const FormBuilderAddEventImmunisation = require('../../app/scripts/directives/add-events/add-event/forms/immunisation.json')
          resolve(FormBuilderAddEventImmunisation)
        } else if (file === 'app/scripts/services/FHIR/resources/RelatedPerson-motherDetails.json') {
          const FHIREncounterResource = require('../../app/scripts/services/FHIR/resources/RelatedPerson-motherDetails.json')
          resolve(FHIREncounterResource)
        } else if (file === 'app/scripts/services/FHIR/resources/Location.json') {
          const FHIRLocationResource = require('../../app/scripts/services/FHIR/resources/Location.json')
          resolve(FHIRLocationResource)
        } else if (file === 'app/scripts/services/FHIR/resources/Encounter.json') {
          const FHIRObservationResource = require('../../app/scripts/services/FHIR/resources/Encounter.json')
          resolve(FHIRObservationResource)
        } else if (file === 'app/scripts/services/FHIR/resources/Immunization.json') {
          const FHIRImmunisationResource = require('../../app/scripts/services/FHIR/resources/Immunization.json')
          resolve(FHIRImmunisationResource)
        }
      })
    }
    const deferMock = () => {
      return {
        resolve: (result) => {
          // then
          t.equals(result.isValid, true)
          t.equals(result.msg, 'Event has been successfully added for submission')

          const eventDict = stateService.pushToEventsArray.getCall(0).args[0]

          t.equals(eventDict.main.resourceType, 'Encounter')
          t.equals(eventDict.immunisation.resourceType, 'Immunization')

          t.equals(eventDict.main.period.start, '2017-02-23')
          t.equals(eventDict.main.location[0].location.reference, 'Location/123')

          t.equals(eventDict.immunisation.encounter.reference, '@main')
          t.equals(eventDict.immunisation.location.reference, 'Location/123')
          t.equals(eventDict.immunisation.date, '2017-02-23')
          t.equals(eventDict.immunisation.vaccineCode.coding[0].code, '111111')

          testSandbox.restore()
          t.end()
        }
      }
    }

    const directive = addEvent({ fetch: fetchMock }, { defer: deferMock }, stateService, FHIR, FormBuilderService)
    directive.link(scope)
    // when
    scope.state.FormBuilderAddEventImmunisation.sections = [FormBuilderAddEventImmunisation]
    scope.state.FormBuilderAddEventImmunisation.submit.execute(mockFormData)
    // then
    t.ok(scope.state.FormBuilderAddEventImmunisation)
  })
})
