```js
const axios = require("axios");

const BOT_TOKEN = "8689421739:AAFDBqArLgSseuxVwHClNphg-bQmpuUeO20";
const CHAT_ID = "6893268965";

const TARGET_URL =
"https://watertankcontroller.com/aDm1n-D@sh80ard_9L/dashboard/order?query=Pending";

const cookies = {
  "__Secure-next-auth.session-token":
  "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..qRT3_ojbgHX_zn0J.y59ezbNrIGE3TQWGmOUGXE71KzXAFptv04wrUwHFs0YZISvFQbMhVo2qBc0Qsg0xM32FzyA8g3-grc-LdScat0rXOHQp1sd-61R8x7VyJaKctCWO_QdGh9NGxVdW5WDmxMjdioGw6RhUBswSFcqwGSeGE7S6MdQ9P6wyvhX8DMg2XEXZ_0KgI-p0GMlosjrXwil9YUtoWICrZzV79nBudTDO1GpTc1jNChK4VvSfTqvlo7hLDpm9chg4gcvf_RkzOV4SX6alyxDq5gqYdprKXPKdVSZmAzY72SRCY1la6TJ_5-ursCDqUpTLMGAbNpekWHd3APVz5EL80j5TUU-9L7y9wbu8MO5dGm8Ss_HTIBIDHSqRRoCNQRvNtq0mtg27MmyJvEssCN1IWBPqJT5gHRqQphmREglY8WoBm6D2ykHnLQcmVdZfu4HYDt8WkacZgRWija4ncBgEgWFy5kHWbQnRkCyyTh_ACGguZeQEM-QzBUVHXhYcEbrmpy_A8Lm4HzzU2uyx7IUBoszCm__-pHaIvwBSz2-tVPVhS7MC-rjDaGvsbzN3NrMNIL6Sv3D12L4tHB31vbs-Mi74Dj4Iath5sg_RixF8G2xo4oFduoIgoPo6bcsXJi0F1hOcrg6M9IiSSaAUZxwgufd8Siv-F6pX75YqbVyXgdRRsQIOjlyZXAYsoIiOcT6THU1BSWmYRfuXYHdV5d6hBIFnUxGSMZQHJaZFGMSdLbi0YSFenDRJ_iJMdjSyRASpkMA6r3rz2-GIEROkgf7TCHoAp0yH8JiE91BTYZ5TdTJADhFAXJ9u7aQ9Svd8emWifYexyNj2PuyqpWysZulMYP9SlV0Txt1CQQ0V-J75IfOuJW5D_OWH9lTq3gLhr7JlUL-v2nx0CwyWF3H3y7CV8xSnfCvXwVW5VxRUFiYUYJpSlwkzlBEhGPtYrXzp6wqwJCU62ETYm3_ed6Hx5AjY5FnkYvzf5h933qU-q2ploPqgXUfPxUBNdVz9a_pP9DOVgOVgHPu0EY5FwlBglYnF5rmqdQOp7Yip5Voys_eRXjnlBRX7mZAGJLx94CytJIKZ-Ll6YwMZh52v4ZmKqynuRLDs8penMud8fJshJ5wGDKI0UQoEf-vRVd4lMtNu8VgWabDvUwSw7E85lSMlaUaEPu8G3sZiXLe9QmT8TUpP7N3Za_pXgLdEhbIINSqdRtq-R6YsZEWZ01uzYKYe1ZNsrXUXDk6xNhkI7QVsLSCZVa8upEpVVzFCEEXID-QRK6fXt0CpjNEQzp8rTOzI.6JGPECqqCCpBax1BIUgkVw"
};

let lastOrders = [];

function getRelativeTime(orderDateString) {

  try {

    const now = new Date();

    let orderDate = new Date(orderDateString);

    if (isNaN(orderDate.getTime())) {

      const cleaned = orderDateString.replace(/,/g, "").trim();

      orderDate = new Date(cleaned);
    }

    if (isNaN(orderDate.getTime())) {
      return orderDateString;
    }

    const diff = Math.floor((now - orderDate) / 1000);

    if (diff < 60) {
      return `${diff} s ago`;
    }

    const mins = Math.floor(diff / 60);

    if (mins < 60) {
      return `${mins} min ago`;
    }

    const hours = Math.floor(mins / 60);

    if (hours < 24) {
      return `${hours} h ago`;
    }

    const days = Math.floor(hours / 24);

    return `${days} day ago`;

  } catch (e) {

    return orderDateString;
  }
}

async function sendTelegram(message) {

  try {

    await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "HTML"
      }
    );

    console.log("Telegram Sent");

  } catch (err) {

    console.log("Telegram Error:", err.message);
  }
}

async function checkWebsite() {

  try {

    console.log("Checking Orders...");

    const response = await axios.get(TARGET_URL, {
      headers: {
        Cookie:
          `__Secure-next-auth.session-token=${cookies["__Secure-next-auth.session-token"]}`,
        "User-Agent": "Mozilla/5.0"
      }
    });

    const html = response.data;

    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;

    const rows = html.match(rowRegex);

    if (!rows || rows.length <= 1) {

      console.log("No Orders Found");
      return;
    }

    for (let i = 1; i < rows.length; i++) {

      const rowContent = rows[i];

      const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;

      const cells = [...rowContent.matchAll(cellRegex)].map((c) =>
        c[1]
          .replace(/<[^>]*>?/gm, "")
          .replace(/\s+/g, " ")
          .trim()
      );

      if (cells.length >= 4) {

        const orderDate = cells[0] || "N/A";
        const orderId = cells[1] || "N/A";
        const customer = cells[2] || "N/A";
        const packageInfo = cells[3] || "N/A";

        if (!lastOrders.includes(orderId)) {

          lastOrders.push(orderId);

          const relativeTime = getRelativeTime(orderDate);

          const today = new Date().toLocaleDateString("bn-BD");

          const message =
`🔔 নতুন অর্ডার এসেছে

📅 <b>তারিখ:</b> ${today}
🔢 <b>সিরিয়াল:</b> ${i}

🆔 <b>Order Date:</b> ${relativeTime}
👤 <b>Order ID:</b> ${orderId}

📞 <b>নাম ও ফোন:</b>
${customer}

💰 <b>Package:</b>
${packageInfo}

📌 <b>Please check Dashboard</b>`;

          await sendTelegram(message);

          console.log("New Order:", orderId);
        }
      }
    }

  } catch (e) {

    console.log("Error:", e.message);
  }
}

console.log("Order Bot Running...");

checkWebsite();

setInterval(checkWebsite, 30000);
```
