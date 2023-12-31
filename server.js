const express = require("express");
const bodyParser = require("body-parser");
const paypal = require("paypal-rest-sdk");
const { setCredential, getCredential } = require("./credentials");

const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// Configure PayPal SDK with your credentials
const setPaypalConfigure = ({ id, secret }) =>
  paypal.configure({
    mode: "sandbox", // Change to 'live' for production
    client_id: id,
    client_secret: secret,
  });
const getPaypalBalance = () =>
  new Promise((res, rej) => {
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
const getContactList = (params) =>
  new Promise((res, rej) => {
    paypal.contact.list(params, (error, contacts) => {
      if (error) {
        rej(error);
      } else {
        res(contacts);
      }
    });
  });

// Page to set your PayPal credentials
app.get("/", (req, res) => {
  res.render("credentials", { title: "PayPal Credentials" });
});
app.get("/credentials", (req, res) => {
  res.render("credentials", { title: "PayPal Credentials" });
});

app.post("/credentials", async (req, res, next) => {
  try {
    const params = {
      page_size: 10, // Set the desired page size
    };
    setCredential({ id: req.body.client_id, secret: req.body.client_secret });
    setPaypalConfigure({
      id: req.body.client_id,
      secret: req.body.client_secret,
    });
    const contactList = await getContactList(params);
    setPaypalConfigure({
      id: req.body.client_id,
      secret: req.body.client_secret,
    });
    const paypalBalance = await getPaypalBalance();
    res.render("transfer", {
      paypalBalance,
      contactList,
      title: "Send Money",
      credential: req.body.client_id,
    });
  } catch (error) {
    next(error);
  }
});

// Page with the transfer form
app.get("/transfer", async (req, res, next) => {
  try {
    const params = {
      page_size: 10, // Set the desired page size
    };
    const credential = getCredential(req.query.credential);
    if (!credential) return res.redirect("/");
    setPaypalConfigure(credential);
    const contactList = await getContactList(params);
    setPaypalConfigure(credential);
    const paypalBalance = await getPaypalBalance();
    res.render("transfer", {
      paypalBalance,
      contactList,
      title: "Send Money",
      credential: credential.id,
    });
  } catch (error) {
    next(error);
  }
});

// Handle the transfer form submission
app.post("/transfer", async (req, res) => {
  const credential = getCredential(req.body.credential);
  if (!credential) return res.redirect("/");
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
    setPaypalConfigure(credential);
    await createPaypal(create_payout_json);
    setPaypalConfigure(credential);
    const paypalBalance = await getPaypalBalance();
    res.render("transfer_result", {
      success: true,
      message: "Transfer successful",
      paypalBalance,
      title: "Transfer Result",
      credential: credential.id,
    });
  } catch (error) {
    res.render("transfer_result", {
      success: false,
      message: "Transfer failed",
      paypalBalance: 0,
      title: "Transfer Result",
      credential: credential.id,
    });
  }
});

// Transfer result page
// app.get("/transfer_result", (req, res) => {
//   res.render("transfer_result", {
//     success: false,
//     message: "Transfer result",
//     paypalBalance: 1892738921,
//     title: "Transfer Result",
//     credential: "",
//   });
// });

// Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
