# Samruddhi Fashion

**Sarees and bangles, matched for every celebration.**

The online store of Samruddhi Fashion, a saree and bangle boutique at Hunasakatte Junction, Bhadravati. Customers browse the collection, build an order and confirm it with the shop on WhatsApp. They pay by UPI or cash on delivery.

**Live store:** https://vivekma05.github.io/sambrudhi-fashions/

---

## Features

### Storefront
- **Collection.** Silk, cotton and designer sarees, glass, kundan, thread and lac bangles, and ready-made saree and bangle combos.
- **Filters and search.** Browse by category, occasion (Wedding, Festive, Party, Office, Daily), colour and price. Search by name, fabric or colour, and sort by featured, newest, price or discount.
- **Product pages.** Photo gallery, description, details and price with discount. Bangles have a size selector and a size guide. Each saree suggests bangles in matching colours.
- **Wishlist and bag.** Both are kept on the shopper's device. The bag shows a progress bar towards free delivery.
- **Mobile-first design.** Built for phones, accessible (keyboard and screen-reader friendly) and fast. There are no frameworks and nothing to install.

### Ordering
- **Checkout without an account.** The customer enters a name, mobile number and delivery address, then chooses UPI or cash on delivery.
- **Orders on WhatsApp.** The finished order opens in WhatsApp, addressed to the shop. It includes an order number (e.g. `SF-261109-4821`), each item and size, the delivery charge, the total and the address.
- **UPI payment.** After the shop confirms the order, the customer pays to the shop's UPI ID by copying it or by opening their UPI app with the amount already filled in.

### Store management
- **Admin page** (`admin.html`). Add, edit or delete products from a phone, including name, price, original price, photos, sizes, colours, occasions and stock status.
- **Categories.** Create, rename, reorder and delete shop categories (for example Sarees, Bangles, Kurtis), each with its own size options. The menu, tabs and category cards follow automatically.
- **Photos.** Photos are resized on the phone before upload, so pages stay fast.
- **Publishing.** Every save goes live on the website within about two minutes.

---

## How it works

The site is a static website hosted on **GitHub Pages**. There is no server and no database:

| Data | Where it lives |
|---|---|
| Categories, products and photos | In this repository (`js/products.js`, `images/products/`), managed through the admin page |
| Shop settings | `js/shop-config.js` |
| Orders | Sent to the shop as WhatsApp messages |
| Payments | Made directly to the shop's UPI ID, or in cash on delivery |
| Bag, wishlist, saved address | Stored in each customer's own browser |

The admin page writes to this repository through the GitHub REST API. It uses a fine-grained access token stored only on the admin's device. Each save is one commit, so every change is versioned and can be undone.

---

## Project structure

```
index.html            Storefront
admin.html            Product management page (not linked from the store)
css/style.css         Storefront styles, design tokens at the top
css/admin.css         Admin page styles
js/shop-config.js     Shop settings: name, contact, UPI, delivery, policies, FAQ
js/products.js        Catalogue: categories and products (JSON, maintained by the admin page)
js/app.js             Storefront logic: catalogue, filters, bag, WhatsApp checkout
js/admin.js           Admin logic: GitHub API, photo upload, product editor
js/art.js             Illustrations shown for products that have no photo yet
images/logo.png       Shop logo
images/products/      Product photos uploaded from the admin page
```

---

## Managing products

### One-time setup on each device
1. Open `admin.html` on the live site, e.g. https://vivekma05.github.io/sambrudhi-fashions/admin.html
2. Create a **fine-grained personal access token** on GitHub (Settings → Developer settings → Personal access tokens → Fine-grained tokens) with:
   - **Repository access:** only this repository
   - **Permissions:** Contents: *Read and write*
3. Paste the token into the admin page, choose a **PIN** (4–8 digits) and tap **Connect**.

**Security**
- **PIN lock.** The token is stored only on that device, encrypted with the PIN (AES-GCM, key derived with PBKDF2).
- **Unlocking.** The PIN is required each time the admin page is opened.
- **Automatic lock.** The page locks itself after 10 minutes in the background. Use the padlock button to lock it at any time.
- **Wrong PINs.** Five wrong PINs disconnect the device and erase the stored token.
- **Removing access.** **Disconnect this phone** (at the bottom of the product list) removes the token from the device. If a device is lost, revoke the token on GitHub. It stops working immediately.
- **Account protection.** Enable two-factor authentication on the GitHub account that owns this repository.

### Day-to-day
- **Add product:** choose the category, add photos, fill in name and price, and tap **Save product**.
- **Edit:** tap any product to change its details, photos or price.
- **Sold out:** turn the **In stock** switch off. The product stays visible, marked "Sold out".
- **Order on the page:** use the arrows. Products at the top appear first in the store.
- **Sample products:** the store launched with example items. Remove them in one tap with **Remove all samples**.
- **Categories:** tap **Categories** to add a new one (name, short description, sizes such as S–XXL, and a placeholder picture style), edit or reorder categories, or delete one. Deleting moves its products to another category. Categories with no products stay hidden from customers.

The catalogue can also be edited by hand in `js/products.js`. Keep the content between the `/*DATA*/` and `/*END*/` markers as valid JSON.

---

## Configuration

All shop settings are in [`js/shop-config.js`](js/shop-config.js):

| Setting | Purpose |
|---|---|
| `name`, `tagline` | Shop name and logo subtitle |
| `whatsapp` | Number that receives orders (country code + number) |
| `phoneDisplay`, `email`, `instagram`, `address`, `hours` | Contact details. Leave empty to hide |
| `upiId`, `upiName`, `upiQr` | UPI payment details shown after a UPI order |
| `freeDeliveryAbove`, `deliveryFee` | Delivery charges |
| `cashOnDelivery`, `codFee` | Cash on delivery option and optional fee |
| `deliveryTime`, `exchangeDays` | Delivery and exchange policy text |
| `about`, `faq` | "Our story" and FAQ content |
| `githubRepo` | Repository used by the admin page when opened locally |

---

## Development

No build step or dependencies are needed. To preview locally, open `index.html` in a browser.

**Deployment:** GitHub Pages publishes the `main` branch from the repository root. Pushing to `main`, or saving from the admin page, updates the live site within a few minutes.

> When working on a local copy, run `git pull` first. The admin page commits directly to `main`.

**Browser support:** current versions of Chrome, Safari, Edge and Firefox on Android, iOS and desktop.

---

## Contact

**Samruddhi Fashion** · Hunasakatte Junction, Bhadravati – 577115
WhatsApp: [+91 86186 21589](https://wa.me/918618621589)

© 2026 Samruddhi Fashion. All rights reserved.
