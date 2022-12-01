import _ from 'lodash'
import type { Plugin } from './types'
import { getVersion } from './utils'

export async function afterRemove (this: Plugin): Promise<void> {
  const serviceVersion = getVersion(this.options, this.service)

  if (_.isNil(serviceVersion)) {
    return
  }

  if (!_.isNil(this.service.provider.apiGateway)) {
    const { restApiId } = this.service.provider.apiGateway
    const { stage } = this.service.provider

    if (!_.isNil(stage)) {
      this.logger.info(`Updating stage ${stage}...`)
      await this.provider.request('APIGateway', 'createDeployment', {
        restApiId,
        stageName: stage
      })
      this.logger.info(`Stage ${stage} has been updated!`)
    }
  }
}
