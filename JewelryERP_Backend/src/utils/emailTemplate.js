
let emailTemplate=`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Custom Jewelry Designs</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        .header {
            font-size: 24px;
            color: #333;
            margin-bottom: 20px;
        }
        .design {
            border-bottom: 1px solid #ddd;
            padding: 15px 0;
        }
        .design img {
            max-width: 100%;
            border-radius: 5px;
            margin-top: 10px;
        }
        .button {
            display: inline-block;
            padding: 12px 20px;
            margin-top: 20px;
            font-size: 16px;
            color: #ffffff;
            background-color: #007bff;
            text-decoration: none;
            border-radius: 5px;
        }
        .footer {
            margin-top: 20px;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">Your Custom Jewelry Designs Are Ready! 💎</div>

        <p>Dear {{customer_first_name}},</p>
        <p>We are excited to share your latest jewelry designs. Click the button below to review them.</p>

        <!-- Design List -->
        {{designs}}

        <a href="{{design_page_link}}" class="button">View Your Designs</a>

        <p class="footer">If you have any questions, feel free to reply to this email.</p>
        <p class="footer">Best Regards, <br> Dew Diamonds Team</p>
    </div>
</body>
</html>
`;

module.exports = emailTemplate;