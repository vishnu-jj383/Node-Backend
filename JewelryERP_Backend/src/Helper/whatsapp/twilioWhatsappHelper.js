//#region imports
const twilio = require("twilio");

// Load Twilio credentials from .env file

// Initialize Twilio client
const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
//#endregion

// Function to send a WhatsApp message with a link
const sendWhatsAppMessage= async(toNumber, websiteLink)=> {
  return new Promise(async (resolve, reject) => {
    try {
      const message = await client.messages.create({
        from:process.env.TWILIO_WHATSAPP_NUMBER,  // Twilio WhatsApp number
        to: `whatsapp:${toNumber}`,      // Recipient's WhatsApp number
        body: `Hello! Check out this link: ${websiteLink}`,
      });
      return resolve({status:true,message})
    } catch (error) {
      console.error("Error sending message:", error);
      reject(error);
      return {status:false,message:"Error in sending message"}
    }
  }) 
 
}

module.exports={
    sendWhatsAppMessage
}
// Example usage
 