require("dotenv").config();
const axios = require("axios");

const SHOPIFY_API_URL = process.env.SHOPIFY_API_URL;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

exports.handler = async (event) => {
  // Handle preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "https://realitees.in",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  // Process POST request
  const { orderNumber } = JSON.parse(event.body);
  if (!orderNumber) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "https://realitees.in",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ error: "Order number is required." }),
    };
  }

  try {
    const response = await axios.get(`${SHOPIFY_API_URL}.json`, {
      headers: {
        "X-Shopify-Access-Token": ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    });

    const orders = response.data.orders;
    const matchingOrder = orders.find(
      (order) => order.order_number == orderNumber
    );

    if (matchingOrder) {
      const trackingUrl = matchingOrder.fulfillments[0]?.tracking_url;

      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "https://realitees.in",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        body: JSON.stringify({ message: "Order found", trackingUrl }),
      };
    } else {
      return {
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Origin": "https://realitees.in",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        body: JSON.stringify({ error: "Order not found." }),
      };
    }
  } catch (error) {
    console.error("Error fetching orders:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "https://realitees.in",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({
        error: "An error occurred while fetching order data.",
      }),
    };
  }
};
