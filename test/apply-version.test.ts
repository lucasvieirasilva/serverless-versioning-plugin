import Serverless from 'serverless'
import type { applyVersion } from '../src/apply-version'
import VersioningPlugin from '../src/index'
import type { CustomService, VersioningPluginOptions } from '../src/types'

describe('before:package:initialize apply-version test cases', () => {
  let serverless: Serverless
  let options: VersioningPluginOptions

  beforeEach(() => {
    options = {
      region: 'eu-west-1',
      stage: 'dev'
    }
  })

  it('should apply the service version to the functions with ephemeral pattern', async () => {
    serverless = new Serverless({
      commands: [],
      options: {}
    })
    const service = serverless.service as CustomService

    service.service = 'myservice'
    service.serviceObject = {
      name: 'myservice'
    }
    service.functions = {
      test: {
        name: 'myservice-test',
        handler: '',
        events: [
          {
            http: {
              method: 'get',
              path: '/test'
            }
          }
        ]
      },
      test1: {
        name: 'myservice-test',
        handler: '',
        versioning: {
          ephemeral: false
        },
        events: [
          {
            http: {
              method: 'get',
              path: '/test'
            }
          }
        ]
      }
    } as unknown as CustomService['functions']
    service.resources = {
      Resources: {
        Queue: {
          Type: 'AWS::SQS::Queue',
          Properties: {
            QueueName: 'SampleQueue'
          }
        },
        QueueNonEphemeral: {
          Type: 'AWS::SQS::Queue',
          Metadata: {
            'serverless-versioning': {
              config: {
                ephemeral: false
              }
            }
          },
          Properties: {
            QueueName: 'SampleQueue'
          }
        }
      }
    } as unknown as CustomService['resources']

    await serverless.init()
    serverless.cli.log = jest.fn().mockImplementation(console.log)
    const logger = {
      error: jest.fn(),
      warning: jest.fn(),
      notice: jest.fn(),
      info: jest.fn(),
      debug: jest.fn()
    }

    const plugin = new VersioningPlugin(
      serverless,
      {
        ...options,
        serviceVersion: 'pr-1'
      },
      { log: logger }
    )

    const func = plugin.hooks[
      'before:package:initialize'
    ] as typeof applyVersion
    func.call(plugin)

    expect(service.service).toBe('myservice-pr-1')
    expect(service.functions).toStrictEqual({
      test: {
        name: 'myservice-pr-1-test',
        handler: '',
        events: [
          {
            http: {
              method: 'get',
              path: 'pr-1/test'
            }
          }
        ]
      }
    })
    expect(service.resources).toStrictEqual({
      Resources: {
        Queue: {
          Type: 'AWS::SQS::Queue',
          Properties: {
            QueueName: 'SampleQueue'
          }
        }
      }
    })
  })
})
