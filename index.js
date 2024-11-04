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
  const { orderNumber, mobileNumber } = req.body;
  if (!orderNumber && !mobileNumber) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "https://realitees.in",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({
        error: "Either order number or mobile number is required.",
      }),
    };
  }

  try {
    // Calculate date range for the last month
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);

    const createdAtMin = lastMonth.toISOString(); // Start date (1 month ago)
    const createdAtMax = today.toISOString(); // End date (today)

    let allOrders = [];
    let url = `${SHOPIFY_API_URL}.json?status=any&created_at_min=${createdAtMin}&created_at_max=${createdAtMax}&limit=50`;

    // Pagination logic
    while (url) {
      const response = await axios.get(url, {
        headers: {
          "X-Shopify-Access-Token": ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
      });

      const orders = response.data.orders; // Get the orders from the response
      allOrders = allOrders.concat(orders); // Add the current page orders to the allOrders array

      // Check for pagination in response headers
      const linkHeader = response.headers.link;
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const nextUrlMatch = linkHeader.match(/<([^>]+)>; rel="next"/);
        url = nextUrlMatch ? nextUrlMatch[1] : null; // Get the next page URL
      } else {
        url = null; // No more pages
      }
    }

    // Find the order that matches the order_number
    const matchingOrder = allOrders.find(
      (order) =>
        order.order_number == orderNumber ||
        order.customer.default_address.phone == mobileNumber
    );

    if (matchingOrder) {
      // Construct the tracking URL if fulfillments exist
      // return res.json({ matchingOrder });
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
