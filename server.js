const express = require("express");
const bodyParser = require("body-parser");
const paypal = require("paypal-rest-sdk");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// Configure PayPal SDK with your credentials
const setPaypalConfigure = (id, secret) =>
  paypal.configure({
    mode: "sandbox", // Change to 'live' for production
    client_id: "YOUR_CLIENT_ID",
    client_secret: "YOUR_CLIENT_SECRET",
  });
const getPaypalBalance = () =>
  new Promist((res, rej) => {
    paypal.payment.getBalance({}, (error, balance) => {
      if (error) {
        rej(error);
      } else {
        res(balance.available[0].amount);
        // You can pass the paypalBalance variable to your template engine or use it to render the balance on your page
      }
    });
  });
const createPaypal = (create_payout_json) =>
  new Promise((res, rej) => {
    paypal.payout.create(create_payout_json, (error, payout) => {
      if (error) {
        rej(error);
      } else {
        res(payout);
      }
    });
  });

// Page to set your PayPal credentials
app.get("/credentials", (req, res) => {
  res.render("credentials", { title: "PayPal Credentials" });
});

app.post("/credentials", (req, res) => {
  setPaypalConfigure(req.body.client_id, req.body.client_secret);
  // res.render("credentials");
  res.redirect("/transfer");
});

// Page with the transfer form
app.get("/transfer", async (req, res, next) => {
  try {
    const paypalBalance = await getPaypalBalance();
    res.render("transfer", { paypalBalance, title: "Send Money" });
  } catch (error) {
    next(error);
  }
});

// Handle the transfer form submission
app.post("/transfer", async (req, res) => {
  try {
    const receiverEmail = req.body.receiver_email;
    const payAmount = req.body.pay_amount;

    const sender_batch_id = Math.random().toString(36).substring(9);
    const create_payout_json = {
      sender_batch_header: {
        sender_batch_id: sender_batch_id,
        email_subject: "You have a payment",
      },
      items: [
        {
          recipient_type: "EMAIL",
          amount: {
            value: payAmount,
            currency: "USD",
          },
          receiver: receiverEmail,
          note: "Thank you.",
        },
      ],
    };
    await createPaypal(create_payout_json);
    const paypalBalance = await getPaypalBalance();
    res.render("transfer_result", {
      success: true,
      message: "Transfer successful",
      paypalBalance,
    });
  } catch (error) {
    res.render("transfer_result", {
      success: false,
      message: "Transfer failed",
    });
  }
});

// Transfer result page
app.get("/transfer_result", (req, res) => {
  res.render("transfer_result", {
    success: false,
    message: "Transfer result",
    title: "Transfer Result",
  });
});

// Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
