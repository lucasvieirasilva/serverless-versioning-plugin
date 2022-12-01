# Serverless Versioning Plugin

The serverless versioning plugin is designed to help you manage your API versions. It allows you to create a new version of your API and deploy it to a completely different stack, including all the resources, functions, and endpoints.

## Getting Started

### Install

```shell
npm install --save-dev @slslv/serverless-versioning
```

### How it works

The plugin uses the version from the serverless config (`custom.versioning.version`) or the environment variable (`SLS_SERVICE_VERSION`) to rename the serverless service property and rename all the function HTTP events to include the version in the path.

#### Requirements

An API must be created outside of the serverless project, so the plugin can use the same API reference and just create new resources/paths/methods for all the versions managed by the plugin.

**NOTE**: If you do not create the API outside of the serverless project, the plugin will create a new API for each version.

### Configuration

Before configuring the plugin your serverless config probably looks like this:

```yaml
service: myservice

provider:
  name: aws
  runtime: nodejs14.x
  apiGateway:
    restApiId: myapiId
    restApiRootResourceId: apiRootId

functions:
  hello:
    handler: handler.hello
    events:
      - http:
          path: hello
          method: get
```

You have a CloudFormation stack named `myservice-dev` and an API Gateway endpoint `https://<api-id>.execute-api.<region>.amazonaws.com/dev/hello`.

**NOTE**: If you are using custom domain names, the endpoint will be `https://<custom-domain>/hello`.

and modify the config to add the plugin, like this:

```yaml
service: myservice

plugins:
  - "@slslv/serverless-versioning"

provider:
  name: aws
  runtime: nodejs14.x
  apiGateway:
    restApiId: myapiId
    restApiRootResourceId: apiRootId

functions:
  hello:
    handler: handler.hello
    events:
      - http:
          path: hello
          method: get
```

By default, the plugin checks if the `SLS_SERVICE_VERSION` environment variable is set, and the `custom.versioning.version` property from the serverless config to get the version, if the version cannot be defined the serverless deployment continues without the plugin.

#### Deployment

To deploy the serverless using the environment variable:

```shell
SLS_SERVICE_VERSION=v1 sls deploy --stage <stage>
```

After the deployment, you will have a new CloudFormation stack named `myservice-v1-dev` and an API Gateway endpoint `https://<api-id>.execute-api.<region>.amazonaws.com/dev/v1/hello`.

**NOTE**: If you are using custom domain names, the endpoint will be `https://<custom-domain>/v1/hello`.

## Motivation

If you are using the AWS provider and API Gateway, the API Gateway currently provides a way to manage versions using stages, however, the stage is based on the API Gateway resource, so, if you add a new resource to the API Gateway and for some reason need to update something in the previous version, you end up adding the new resource to the previous version.

So, the plugin was mainly created to deal with this problem.

## Use Cases

### Ephemeral environments

This plugin can also be used to create ephemeral environments for serverless applications by creating temporary versions for specific versions of the code.

The plugin identifies the default ephemeral environment version with this regex pattern `pr-(\d+)` (e.g. `pr-1`). This configuration can be overwritten by setting the `versioning.ephemeralVersionPattern` property in the `serverless.yml` file.

Example:

```yaml
service:
  name: myservice-name

custom:
  versioning:
    ephemeralVersionPattern: pr-(.*)

plugins:
  - "@domgen/serverless-versioning"

provider:
  name: aws
```

### Ignoring resources

In some cases, ephemeral resources should not be created as part of the deployment. To ignore the resource for the ephemeral environment execution, add the following configuration to the functions or CloudFormation resource:

```yaml
service:
  name: myservice-name

plugins:
  - "@domgen/serverless-versioning"

provider:
  name: aws

functions:
  hello:
    handler: index.handler
    versioning:
      ephemeral: false

resources:
  Resources:
    Queue:
      Metadata:
        serverless-versioning:
          config:
            ephemeral: false
      Type: AWS::SQS::Queue
      Properties:
        QueueName: SampleQueue
```

In this example, the `hello` function has the property `versioning.ephemeral` with a value of `false` and because of that, it will not be deployed when the execution is identified as an ephemeral environment.

The same happens to the `Queue` CloudFormation resource, by setting the `Metadata.serverless-versioning.config.ephemeral` with a value of `false`, the plugin also ignores this resource for the ephemeral environment deployment.
