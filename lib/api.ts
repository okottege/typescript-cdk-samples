import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda-nodejs';
import {Runtime} from "@aws-cdk/aws-lambda";
import * as s3 from '@aws-cdk/aws-s3';
import * as path from 'path';
import * as iam from '@aws-cdk/aws-iam';
import * as apig from '@aws-cdk/aws-apigatewayv2';
import * as apiIntegration from '@aws-cdk/aws-apigatewayv2-integrations';

interface DocumentManagementAPIProps {
  documentBucket: s3.Bucket
}

export class DocumentManagementAPI extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: DocumentManagementAPIProps) {
    super(scope, id);

    const getDocumentsFunction = new lambda.NodejsFunction(this, 'GetDocumentsFunction', {
      runtime: Runtime.NODEJS_12_X,
      entry: path.join(__dirname, '..', 'api', 'getDocuments', 'index.ts'),
      handler: 'getDocuments',
      bundling: {
        externalModules: ['aws-sdk']
      },
      environment: {
        DOCUMENTS_BUCKET_NAME: props.documentBucket.bucketName
      }
    });

    const bucketPermissions = new iam.PolicyStatement();
    bucketPermissions.addResources(`${props.documentBucket.bucketArn}/*`);
    bucketPermissions.addActions('s3:GetObject', 's3:PutObject');
    getDocumentsFunction.addToRolePolicy(bucketPermissions);

    const bucketContainerPermissions = new iam.PolicyStatement();
    bucketContainerPermissions.addResources(props.documentBucket.bucketArn);
    bucketContainerPermissions.addActions('s3:ListBucket');
    getDocumentsFunction.addToRolePolicy(bucketContainerPermissions);

    const httpApi = new apig.HttpApi(this, 'HttpAPI', {
      apiName: 'document-management-api',
      createDefaultStage: true,
      corsPreflight: {
        allowMethods: [apig.HttpMethod.GET],
        allowOrigins: ['*'],
        maxAge: cdk.Duration.days(10)
      }
    });
    const lambdaIntegration = new apiIntegration.LambdaProxyIntegration({
      handler: getDocumentsFunction
    });
    httpApi.addRoutes({
      path: '/get-documents',
      methods: [apig.HttpMethod.GET],
      integration: lambdaIntegration
    });
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: httpApi.url!,
      exportName: 'APIEndpoint'
    });
  }
}
