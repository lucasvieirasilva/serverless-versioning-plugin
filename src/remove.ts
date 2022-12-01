import _ from 'lodash'
import type { Plugin } from './types'
import { getVersion } from './utils'

export function remove (this: Plugin): void {
  const serviceVersion = getVersion(this.options, this.service)

  if (_.isNil(serviceVersion)) {
    return
  }

  this.logger.info(`Removing version ${serviceVersion}`)
  this.service.service = `${this.serverless.service.getServiceName()}-${serviceVersion}`
}
