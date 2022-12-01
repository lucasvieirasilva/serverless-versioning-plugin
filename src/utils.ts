import _ from 'lodash'
import type { VersioningPluginOptions } from './types'
import type { Serverless as AwsServerless } from 'serverless/plugins/aws/provider/awsProvider'

export function isEphemeralEnvironment (
  options: VersioningPluginOptions,
  service: AwsServerless
): boolean {
  const version = getVersion(options, service)
  if (!_.isNil(version)) {
    const ephemeralVersionPattern = _.get(
      service.custom,
      'versioning.ephemeralVersionPattern',
      'pr-(\\d+)'
    ) as string

    return version.match(ephemeralVersionPattern) != null
  }

  return false
}

export function getVersion (
  options: VersioningPluginOptions,
  service: AwsServerless
): string | null {
  let version =
    options.serviceVersion != null
      ? options.serviceVersion
      : options['service-version']

  if (_.isNil(version)) {
    version = _.get(service.custom, 'versioning.version') as string
  }

  if (_.isNil(version)) {
    version = process.env.SLS_SERVICE_VERSION
  }

  if (!_.isNil(version)) {
    return version.replace(/['"]+/g, '')
  }

  return null
}
