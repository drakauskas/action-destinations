import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const actionSlug = 'createUpdateOrganization'
const destinationSlug = 'Pipedrive'
const seedName = `${destinationSlug}#${actionSlug}`

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('required fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

    Object.keys(eventData)
      .filter((f) => !action.fields[f].required)
      .forEach((f) => {
        delete eventData[f]
      })

    const basePath = `https://${settingsData.domain}.pipedrive.com`

    nock(basePath).persist().post(/.*/).reply(200)

    const event = createTestEvent({
      properties: eventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: event.properties,
      settings: settingsData,
      auth: undefined
    })

    const request = responses[0].request
    const rawBody = await request.text()

    try {
      const json = JSON.parse(rawBody)
      expect(json).toMatchSnapshot()
      return
    } catch (err) {
      expect(rawBody).toMatchSnapshot()
    }

    expect(request.headers).toMatchSnapshot()
  })

  it('required fields, update', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

    Object.keys(eventData)
      .filter((f) => !action.fields[f].required)
      .forEach((f) => {
        delete eventData[f]
      })

    const basePath = `https://${settingsData.domain}.pipedrive.com`
    nock(basePath)
      .persist()
      .get(/.*/)
      .query((q) => {
        return q.field_type === 'organizationField' && q.term === '42'
      })
      .reply(200, {
        data: [{ id: 42 }]
      })
    nock(basePath).persist().put(/.*/).reply(200)
    eventData['match_value'] = 42

    const event = createTestEvent({
      properties: eventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: event.properties,
      settings: settingsData,
      auth: undefined
    })

    const request = responses[0].request
    const rawBody = await request.text()

    try {
      const json = JSON.parse(rawBody)
      expect(json).toMatchSnapshot()
      return
    } catch (err) {
      expect(rawBody).toMatchSnapshot()
    }

    expect(request.headers).toMatchSnapshot()
  })

  it('all fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

    const basePath = `https://${settingsData.domain}.pipedrive.com`
    nock(basePath)
      .persist()
      .get(/.*/)
      .twice()
      .reply(200, {
        data: [{ id: 42 }]
      })
    nock(basePath).persist().put(/.*/).reply(200)

    const event = createTestEvent({
      properties: eventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: event.properties,
      settings: settingsData,
      auth: undefined
    })

    const request = responses[0].request
    const rawBody = await request.text()

    try {
      const json = JSON.parse(rawBody)
      expect(json).toMatchSnapshot()
      return
    } catch (err) {
      expect(rawBody).toMatchSnapshot()
    }
  })
})
