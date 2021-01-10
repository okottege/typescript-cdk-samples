import {APIGatewayProxyEventV2, Context, APIGatewayProxyStructuredResultV2} from "aws-lambda";
import S3 from 'aws-sdk/clients/s3';

const bucketName = process.env.DOCUMENTS_BUCKET_NAME;
const s3 = new S3();

export const getDocuments = async (event: APIGatewayProxyEventV2, context: Context)
  : Promise<APIGatewayProxyStructuredResultV2> => {
  console.log(`Bucket Name: ${bucketName}`);

  async function generateSignedUrl(s3Obj: S3.Object) : Promise<{fileName: string, url: string}> {
    const url = await s3.getSignedUrlPromise('getObject', {
      Bucket: bucketName,
      Key: s3Obj.Key!,
      Expires: (60 * 60)
    });
    return { fileName: s3Obj.Key!, url };
  }

  try {
    const {Contents: results} = await s3.listObjects({Bucket: bucketName!}).promise();
    const documents = await Promise.all(results!.map(async r => generateSignedUrl(r)));
    return {
      statusCode: 200, body: JSON.stringify(documents)
    };
  } catch (err) {
    return { statusCode: 500, body: err.message };
  }
};
