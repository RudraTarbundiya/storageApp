import { getSignedUrl } from "@aws-sdk/cloudfront-signer"; // ESM

const privateKey = process.env.CLOUDFRONT_PRIVATE_KEY
const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID; // your CloudFront key pair ID

export const getCloudFrontSignedUrl = ({ s3ObjectKey, name, download = false }) => {
  
  const dateLessThan = new Date(
    Date.now() + 60 * 60 * 1000
  ).toISOString(); // any Date constructor compatible

  let downloadUrl = `${process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN}/${s3ObjectKey}?response-content-disposition=attachment;filename=${encodeURIComponent(name)}`
  let url = `${process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN}/${s3ObjectKey}`
  const signedUrl = getSignedUrl({
    url: download ? downloadUrl : url,
    keyPairId,
    dateLessThan,
    privateKey,
  });
  return signedUrl;
}