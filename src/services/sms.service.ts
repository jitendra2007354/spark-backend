
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import "dotenv/config";

// Ensure AWS credentials and region are set in environment variables
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
  throw new Error("AWS credentials and region must be set in environment variables.");
}

const snsClient = new SNSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Sends an OTP SMS to a given phone number using Amazon SNS.
 * @param phoneNumber The destination phone number in E.164 format (e.g., +12223334444).
 * @param otp The One-Time Password to send.
 * @returns The message ID from SNS.
 */
export const sendOtpSms = async (phoneNumber: string, otp: string) => {
  const message = `Your OTP for authentication is: ${otp}`;
  const senderId = process.env.SNS_SENDER_ID || "YourApp";

  const command = new PublishCommand({
    PhoneNumber: phoneNumber,
    Message: message,
    MessageAttributes: {
      "AWS.SNS.SMS.SenderID": {
        DataType: "String",
        StringValue: senderId, 
      },
      "AWS.SNS.SMS.SMSType": {
        DataType: "String",
        StringValue: "Transactional", // Use "Transactional" for OTPs to ensure high delivery priority
      },
    },
  });

  try {
    const response = await snsClient.send(command);
    console.log(`Successfully sent OTP to ${phoneNumber}. Message ID:`, response.MessageId);
    return response.MessageId;
  } catch (error) {
    console.error(`Failed to send OTP to ${phoneNumber}:`, error);
    throw new Error("Failed to send OTP SMS.");
  }
};
