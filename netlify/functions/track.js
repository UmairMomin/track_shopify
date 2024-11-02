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
    let allOrders = [];
    let url = `${SHOPIFY_API_URL}.json?status=any&limit=50`;

    // Pagination logic
    while (url) {
      const response = await axios.get(url, {
        headers: {
          "X-Shopify-Access-Token": ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      const orders = response.data.orders;
      allOrders = allOrders.concat(orders); // Add current page orders to the allOrders array

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
      (order) => order.order_number == orderNumber
    );

    if (matchingOrder) {
      const trackingUrl = matchingOrder.fulfillments[0]?.tracking_url;
      if (trackingUrl) {
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
          body: JSON.stringify({ message: "Tracking not found" }),
        };
      }
    } else {
      return {
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Origin": "https://realitees.in",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        body: JSON.stringify({ message: "Order not found." }),
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
