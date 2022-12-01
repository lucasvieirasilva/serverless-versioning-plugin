import type Serverless from 'serverless'
import type {
  AwsFunctionHandler,
  AwsFunctionImage,
  Serverless as AwsServerless
} from 'serverless/plugins/aws/provider/awsProvider'
import type AwsProvider from 'serverless/plugins/aws/provider/awsProvider'

export type VersioningPluginOptions = Serverless.Options & {
  serviceVersion?: string
  'service-version'?: string
}

export interface CustomFunctions {
  [key: string]: CustomFunction
}

export type CustomFunction = {
  versioning?: {
    ephemeral?: boolean
  }
} & (AwsFunctionHandler | AwsFunctionImage)

export interface CloudFormationResource {
  Type: string
  Metadata?: {
    'serverless-versioning'?: {
      config?: {
        ephemeral?: boolean
      }
    }
    [key: string]: any
  }
  Properties: { [key: string]: any }
  DependsOn?: string | { [key: string]: any } | undefined
  DeletionPolicy?: string | undefined
}

export type CustomService = AwsServerless & {
  serviceObject?: {
    name: string
  }
  functions?: CustomFunctions
  resources?: {
    Resources: {
      [key: string]: CloudFormationResource
    }
  }
}

export type Provider = AwsProvider & {
  getApiGatewayRestApiId: () => string
  getApiGatewayRestApiRootResourceId: () => string
}

export interface ServerlessLogger {
  error: (message: string) => void
  warning: (message: string) => void
  notice: (message: string) => void
  info: (message: string) => void
  debug: (message: string) => void
}

export interface Plugin {
  serverless: Serverless
  options: VersioningPluginOptions
  service: CustomService
  hooks: { [key: string]: any }
  provider: Provider
  logger: ServerlessLogger
}
