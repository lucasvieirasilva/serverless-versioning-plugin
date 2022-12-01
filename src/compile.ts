import _ from 'lodash'
import type Serverless from 'serverless'
import type { Plugin } from './types'
import { getVersion } from './utils'
import type { APIGateway } from 'aws-sdk'

interface CfnResourceType {
  Type: string
  Properties: {
    ParentId:
    | string
    | {
      Ref: string
    }
    [key: string]: unknown
  }
}

export async function compile (this: Plugin): Promise<void> {
  const serviceVersion = getVersion(this.options, this.service)

  if (_.isNil(serviceVersion)) {
    return
  }

  this.logger.info('Searching for Api Gateway Authorizer to rename')
  const template =
    this.serverless.service.provider.compiledCloudFormationTemplate

  renameAuthorizers(this.serverless, template, serviceVersion)

  const custom = this.serverless.service.custom
  const apiGatewayOwner = _.get(
    custom,
    'versioning.apiGatewayOwner',
    true
  ) as boolean

  if (apiGatewayOwner) {
    return
  }

  this.logger.info(
    `Retrieving the /${serviceVersion} Resource Id using AWS SDK`
  )

  const restApiId = this.provider.getApiGatewayRestApiId()
  const rootResourceId = this.provider.getApiGatewayRestApiRootResourceId()

  const resources = (await this.provider.request('APIGateway', 'getResources', {
    restApiId,
    limit: 500
  })) as APIGateway.Types.Resources

  if (!_.isNil(resources.items) && _.isArray(resources.items)) {
    const existResource = _.find(
      resources.items,
      (resource) => resource.path === `/${serviceVersion}`
    )

    if (_.isNil(existResource)) {
      throw new Error(
        `Resource /${serviceVersion} does not exist in the API Gateway (${restApiId}) ` +
          'and this service is configured as the API Gateway owner (custom.versioning.apiGatewayOwner: false)'
      )
    }

    changeResourceParentId(
      template,
      rootResourceId,
      serviceVersion,
      existResource
    )
  }
}
function changeResourceParentId (
  template: {
    Resources: { [key: string]: CfnResourceType }
    Outputs?: { [key: string]: unknown }
  },
  rootResourceId: string,
  serviceVersion: string,
  existResource: APIGateway.Resource
): void {
  for (const key in template.Resources) {
    const resource = template.Resources[key]
    if (
      resource.Properties.ParentId === rootResourceId &&
      resource.Properties.PathPart === serviceVersion
    ) {
      for (const filterKey in template.Resources) {
        const filterResource = template.Resources[filterKey]

        if (
          _.isObject(filterResource.Properties.ParentId) &&
          filterResource.Properties.ParentId.Ref === key &&
          !_.isNil(existResource.id)
        ) {
          filterResource.Properties.ParentId = existResource.id
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete template.Resources[key]
    }
  }
}

function renameAuthorizers (
  serverless: Serverless,
  template: {
    Resources: { [key: string]: CfnResourceType }
    Outputs?: { [key: string]: any }
  },
  serviceVersion: string
): void {
  _.forOwn(template.Resources, (resource) => {
    if (resource.Type === 'AWS::ApiGateway::Authorizer') {
      const newName = `${resource.Properties.Name as string}-${serviceVersion}`
      serverless.cli.log(
        `Renaming authorizer from ${
          resource.Properties.Name as string
        } to ${newName}`
      )
      resource.Properties.Name = newName
    }
  })
}
