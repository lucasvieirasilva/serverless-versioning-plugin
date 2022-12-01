import type Serverless from 'serverless'
import type {
  Plugin,
  VersioningPluginOptions,
  Provider,
  CustomService,
  ServerlessLogger
} from './types'
import { applyVersion } from './apply-version'
import { afterRemove } from './after-remove'
import { remove } from './remove'
import { compile } from './compile'

export default class VersioningPlugin implements Plugin {
  serverless: Serverless
  options: VersioningPluginOptions
  service: CustomService
  hooks: { [key: string]: any }
  provider: Provider
  logger: ServerlessLogger

  constructor (serverless: Serverless, options: VersioningPluginOptions, { log }: { log: ServerlessLogger }) {
    this.logger = log
    this.serverless = serverless
    this.options = options
    this.service = serverless.service as any as CustomService
    this.hooks = {
      'before:package:initialize': applyVersion.bind(this),
      'package:compileEvents': compile.bind(this),
      'before:remove:remove': remove.bind(this),
      'after:remove:remove': afterRemove.bind(this)
    }

    this.provider = this.serverless.getProvider('aws') as Provider
  }
}

module.exports = VersioningPlugin
