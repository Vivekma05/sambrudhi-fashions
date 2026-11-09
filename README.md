# Samruddhi Fashion: sarees and bangles website

A ready-to-use shop website. Customers browse sarees, bangles and combos, filter them by occasion, colour and price, save favourites, and add items to a bag. At checkout the order is sent to **your WhatsApp** with the items, total and delivery address. They pay by UPI or cash on delivery.

To see it, double-click `index.html` and it opens in your browser. You don't need to install anything.

---

## 1. Add your WhatsApp number (required)

Open `js/shop-config.js` in Notepad or VS Code and fill in:

```js
whatsapp: '919876543210',   // 91 + your 10-digit number
```

Until you add it, the site shows a yellow "Setup needed" bar and checkout is switched off, so no orders go missing.

## 2. Your shop details

These are also in `js/shop-config.js`:

| Setting | What it does |
|---|---|
| `name`, `tagline` | Shop name in the logo, title and footer |
| `phoneDisplay`, `email`, `instagram`, `address`, `hours` | Contact cards. Leave `''` to hide one |
| `upiId`, `upiName`, `upiQr` | After ordering, UPI customers see your UPI ID, a "Copy" button and an "Open my UPI app" button. `upiQr` is an optional photo of your QR code |
| `freeDeliveryAbove`, `deliveryFee` | Delivery charge rules (now: free above ₹999, otherwise ₹79) |
| `cashOnDelivery`, `codFee` | Turn COD on or off and add an optional COD charge |
| `deliveryTime`, `exchangeDays` | Shown in the FAQ, footer and trust strip. **Check these match what you really offer** |
| `about`, `faq` | The "Our story" and FAQ text |

## 3. Your products

All products are in `js/products.js`. The 26 items there now are **samples**, so change the names, prices and descriptions to match your real stock.

- **Add a product:** copy one whole `{ ... },` block, paste it below, and give it a new `id` (for example `s13`).
- **Remove a product:** delete its block.
- **Sold out:** add `inStock: false,`
- **Discount:** `mrp` is the original price. If it is higher than `price`, the site shows "% off".

### Adding real photos

The pictures are drawn illustrations until you add photos.

1. Make a folder called `images` next to `index.html`.
2. Put your photos in it, for example `images/s1-front.jpg`. Portrait photos (4:5, about 1200 × 1500 px, under 300 KB) look best.
3. List them in the product: `images: ['images/s1-front.jpg', 'images/s1-pallu.jpg'],`

The first photo appears on the product card. All of them show as a gallery on the product page.

## 4. Put it online (free)

The site is plain files, so any static host works:

- **Netlify Drop (easiest):** go to app.netlify.com/drop and drag this whole folder onto the page. You get a link straight away. Create a free account to keep the site and update it later.
- **GitHub Pages:** push this folder to a GitHub repository and turn on Pages in the repository settings.

Both let you connect your own domain later (for example `samruddhifashion.in`).

## How an order reaches you

1. The customer taps **Place order on WhatsApp**.
2. WhatsApp opens with the order already written. It includes an order ID (like `SF-261109-4821`), the items, bangle sizes, total, payment choice and address. The customer presses send.
3. You reply to confirm stock and delivery. UPI customers pay after you confirm.

The site has no database. Your WhatsApp chat is your order record.

## Files

```
index.html          the page
css/style.css       colours, fonts, layout (main colours are at the top)
js/shop-config.js   ← your shop settings
js/products.js      ← your products
js/art.js           draws the placeholder illustrations
js/app.js           shop logic (bag, filters, checkout)
```
