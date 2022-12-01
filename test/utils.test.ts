import { getVersion, isEphemeralEnvironment } from '../src/utils'
import type { Serverless as AwsServerless } from 'serverless/plugins/aws/provider/awsProvider'

const originalEnv = process.env

describe('Utils test suite', () => {
  const defaultOptions = {
    region: 'eu-west-1',
    stage: 'dev'
  }
  const defaultService: AwsServerless = {
    service: 'test-service',
    provider: {
      name: 'aws'
    }
  }

  afterEach(() => {
    process.env = {
      ...originalEnv
    }
  })

  describe('getVersion tests', () => {
    it('should get the version from the options "serviceVersion"', () => {
      const version = getVersion(
        { ...defaultOptions, serviceVersion: 'v1' },
        { ...defaultService }
      )
      expect(version).toBe('v1')
    })

    it('should get the version from the options "service-version"', () => {
      const version = getVersion(
        { ...defaultOptions, 'service-version': 'v1' },
        { ...defaultService }
      )
      expect(version).toBe('v1')
    })

    it('should get the version from the options and remove quotes', () => {
      const version = getVersion(
        { ...defaultOptions, 'service-version': '"v1"' },
        { ...defaultService }
      )
      expect(version).toBe('v1')
    })

    it('should get the version from custom section', () => {
      const version = getVersion(
        { ...defaultOptions },
        {
          ...defaultService,
          custom: {
            versioning: {
              version: 'v1'
            }
          }
        }
      )
      expect(version).toBe('v1')
    })

    it('should get the version from environment variable', () => {
      process.env.SLS_SERVICE_VERSION = 'v1'
      const version = getVersion({ ...defaultOptions }, { ...defaultService })
      expect(version).toBe('v1')
    })

    it('should returns null value', () => {
      const version = getVersion({ ...defaultOptions }, { ...defaultService })
      expect(version).toBe(null)
    })
  })

  describe('isEphemeralEnvironment tests', () => {
    it('should return true', () => {
      const result = isEphemeralEnvironment(
        { ...defaultOptions, serviceVersion: 'pr-1' },
        { ...defaultService }
      )
      expect(result).toBe(true)
    })

    it('should return false when the ephemeral pattern is not valid', () => {
      const result = isEphemeralEnvironment(
        { ...defaultOptions, serviceVersion: 'pr-abc' },
        { ...defaultService }
      )
      expect(result).toBe(false)
    })

    it('should return false when the version is null', () => {
      const result = isEphemeralEnvironment(
        { ...defaultOptions },
        { ...defaultService }
      )
      expect(result).toBe(false)
    })

    it('should return true when a custom pattern matches', () => {
      const result = isEphemeralEnvironment(
        { ...defaultOptions, serviceVersion: 'pr-abc' },
        {
          ...defaultService,
          custom: {
            versioning: {
              ephemeralVersionPattern: 'pr-(.*)'
            }
          }
        }
      )
      expect(result).toBe(true)
    })
  })
})
