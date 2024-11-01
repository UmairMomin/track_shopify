// netlify/functions/fetchOrder.js

require("dotenv").config(); // Load environment variables
const axios = require("axios");

const SHOPIFY_API_URL = process.env.SHOPIFY_API_URL;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

exports.handler = async (event) => {
  const { orderNumber } = JSON.parse(event.body); // Parse the order number from the request body

  if (!orderNumber) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Order number is required." }),
    };
  }

  try {
    // Fetch all orders (limit results in production)
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
    );

    if (matchingOrder) {
      // Get the tracking URL if fulfillments exist
      const trackingUrl = matchingOrder.fulfillments[0]?.tracking_url;

      if (trackingUrl) {
        return {
          statusCode: 200,
          body: JSON.stringify({ message: "Order found", trackingUrl }),
        };
      } else {
        return {
          statusCode: 404,
          body: JSON.stringify({
            error: "No tracking information available for this order.",
          }),
        };
      }
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Order not found." }),
      };
    }
  } catch (error) {
    console.error("Error fetching orders:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "An error occurred while fetching order data.",
      }),
    };
  }
};
