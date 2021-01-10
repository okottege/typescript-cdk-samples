import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import {SubnetType} from '@aws-cdk/aws-ec2';

interface NetworkingProps {
  maxAzs: number
}

export class Networking extends cdk.Construct {
  public readonly vpc: ec2.IVpc;

  constructor(scope: cdk.Construct, id: string, props: NetworkingProps) {
    super(scope, id);

    this.vpc = new ec2.Vpc(this, 'AppVPC', {
      cidr: '10.0.0.0/16',
      maxAzs: props?.maxAzs,
      subnetConfiguration: [
        {
          subnetType: SubnetType.PUBLIC,
          name: 'Public',
          cidrMask: 24
        },
        {
          subnetType: SubnetType.PRIVATE,
          name: 'Private',
          cidrMask: 24
        }
      ]
    });
  }
}
