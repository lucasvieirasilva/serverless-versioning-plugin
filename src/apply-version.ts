/* eslint-disable @typescript-eslint/no-dynamic-delete */
import _ from 'lodash'
import type Serverless from 'serverless'
import type {
  Serverless as AwsServerless,
  AwsFunctionHandler,
  AwsFunctionImage,
  Event
} from 'serverless/plugins/aws/provider/awsProvider'
import type {
  CloudFormationResource,
  CustomFunction,
  Plugin,
  VersioningPluginOptions
} from './types'
import { getVersion, isEphemeralEnvironment } from './utils'

export function applyVersion (this: Plugin): void {
  const serviceVersion = getVersion(this.options, this.service)
  if (_.isNil(serviceVersion)) {
    return
  }

  this.logger.info(`Applying version ${serviceVersion}`)
  if (_.isNil(this.serverless.service.service)) {
    throw Error('Serverless service name is null')
  }

  const originalName = this.serverless.service.service

  const newName = `${originalName}-${serviceVersion}`

  this.service.service = newName
  if (!_.isNil(this.service.serviceObject)) {
    this.service.serviceObject.name = newName
  }

  this.logger.info(
    `Changing the service name to ${originalName} to ${newName}`
  )

  if (_.isNil(this.service.provider.stackTags)) {
    this.service.provider.stackTags = {}
  }

  const { stackTags } = this.service.provider

  this.service.provider.stackTags = _.assign(stackTags, {
    Version: serviceVersion
  })

  const { functions, custom } = this.service

  const environmentEnabled: boolean = _.get(
    custom,
    'versioning.environment.enabled',
    true
  ) as boolean

  if (environmentEnabled) {
    if (_.isNil(this.service.provider.environment)) {
      this.service.provider.environment = {}
    }

    if (this.service.provider.environment instanceof Object) {
      this.service.provider.environment.SERVICE_VERSION = serviceVersion
    }
  }

  for (const funcKey in functions) {
    const func = functions[funcKey] as CustomFunction
    if (
      isEphemeralEnvironment(this.options, this.service) &&
      func.versioning?.ephemeral === false
    ) {
      this.logger.info(
        `Function '${
          func.name ?? ''
        }' is disabled for Ephemeral environments, removing from the package`
      )
      delete functions[funcKey]
      continue
    }

    applyVersionToFunction(
      this.serverless,
      func,
      originalName,
      newName,
      serviceVersion
    )
  }

  addStageToDeployment(this.service)
  removeEphemeralDisabledResources(this.serverless, this.options, this.service)
}

function applyVersionToFunction (
  serverless: Serverless,
  func: AwsFunctionHandler | AwsFunctionImage,
  serviceOriginalName: string,
  serviceNewName: string,
  serviceVersion: string
): void {
  const originalFuncName = func.name ?? ''
  if (!_.isNil(func.name) && func.name.startsWith(serviceOriginalName)) {
    func.name = `${serviceNewName}${func.name.substring(
      serviceOriginalName.length,
      func.name.length
    )}`

    if (func.events != null) {
      for (const event of func.events) {
        writeFunctionHttpPath(
          serverless,
          event,
          serviceVersion,
          originalFuncName
        )
      }
    }
  }
}

function writeFunctionHttpPath (
  serverless: Serverless,
  event: Event,
  serviceVersion: string,
  originalFuncName: string
): void {
  if (event.http != null && event.http instanceof Object) {
    let aliasPath = serviceVersion

    if (!event.http.path.startsWith('/')) {
      aliasPath += '/'
    }

    const newPath = `${aliasPath}${event.http.path}`

    if (event.http.path.startsWith(aliasPath)) {
      return
    }

    serverless.cli.log(
      `Function: ${originalFuncName}, Changing path from ${event.http.path} to ${newPath}`
    )

    event.http.path = newPath
  }
}

function addStageToDeployment (service: AwsServerless): void {
  const { resources } = service

  if (!_.isNil(resources) && !_.isNil(resources.Resources)) {
    _.forOwn(resources.Resources, (resource, logicalId) => {
      if (logicalId === '__deployment__') {
        if (!_.isNil(resource.Properties)) {
          resource.Properties = {}
        }
        resource.Properties.StageName = service.provider.stage
      }
    })
  }
}

function removeEphemeralDisabledResources (
  serverless: Serverless,
  options: VersioningPluginOptions,
  service: AwsServerless
): void {
  if (isEphemeralEnvironment(options, service)) {
    const { resources } = service
    if (!_.isNil(resources) && !_.isNil(resources.Resources)) {
      for (const key in resources.Resources) {
        const resource = resources.Resources[key] as CloudFormationResource
        if (
          !_.isNil(resource.Metadata) &&
          resource.Metadata['serverless-versioning']?.config?.ephemeral ===
            false
        ) {
          serverless.cli.log(
            `Resource ${key} is disabled for Ephemeral environments, removing from the stack`
          )
          delete resources.Resources[key]
        }
      }
    }
  }
}
