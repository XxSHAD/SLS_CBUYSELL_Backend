import twilio from "twilio";

// const accountSid = "ACac0fdeb612ea29c0352d15d78641108d";
// const authToken = "2033262701eae15b4c479d071a85c24f";

const client = twilio(accountSid, authToken);

export const GenerateAccessCode = () => {
    const code = Math.floor(10000 + Math.random() * 900000);
    let expiry = new Date();
    expiry.setTime(new Date().getTime() + 30 * 60 *1000);
    return {code, expiry}
}

export const SendVerificationCode = async (
    code: number,
    toPhoneNumber: string
) => {
    const response = await client.messages.create({
        body: `Your verification code is ${code}`,
        from: "+1 430 233 6320",
        to: toPhoneNumber.trim(),
    })
    console.log(response)
    return response;
} 