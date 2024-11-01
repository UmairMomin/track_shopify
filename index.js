require("dotenv").config(); // Load environment variables

const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const SHOPIFY_API_URL = process.env.SHOPIFY_API_URL;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

app.post("/api/track-order", async (req, res) => {
  const orderNumber = req.body.orderNumber; // Expecting order number from the client

  if (!orderNumber) {
    return res.status(400).send("Order number is required.");
  }

  try {
    // Fetch all orders (consider limiting this in a production scenario)
    const response = await axios.get(`${SHOPIFY_API_URL}.json`, {
      headers: {
        "X-Shopify-Access-Token": ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    });

    const orders = response.data.orders; // Get the orders from the response

    // Find the order that matches the order_number
    const matchingOrder = orders.find(
      (order) => order.order_number == orderNumber
    ); // Match with order_number
    console.log(matchingOrder);

    if (matchingOrder) {
      // Construct the tracking URL if fulfillments exist
      const trackingUrl = matchingOrder.fulfillments[0]?.tracking_url;

      if (trackingUrl) {
        return res.json({ message: "Order found", trackingUrl });
      } else {
        return res
          .status(404)
          .send("No tracking information available for this order.");
      }
    } else {
      return res.status(404).send("Order not found.");
    }
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).send("An error occurred while fetching order data.");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
