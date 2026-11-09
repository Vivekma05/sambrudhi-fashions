/* =====================================================================
   SHOP SETTINGS — edit this file to make the website yours.
   Save the file and refresh the page to see changes.
   ===================================================================== */
window.SHOP = {
  // Your shop name and the small line shown under it in the logo
  name: 'Sambrudhi Fashions',
  tagline: 'Sarees · Bangles',

  // Short code used in order numbers, e.g. SF-261109-4821
  orderPrefix: 'SF',

  // ---- IMPORTANT: orders are sent to this WhatsApp number -------------
  // Country code + number, digits only. India example: '919876543210'
  // (A plain 10-digit Indian number also works — 91 is added for you.)
  whatsapp: '918618621589',

  // Contact details shown on the site (leave '' to hide any of them)
  phoneDisplay: '',          // e.g. '+91 98765 43210'
  email: '',                 // e.g. 'hello@yourshop.in'
  instagram: '',             // full link, e.g. 'https://instagram.com/yourshop'
  address: 'Hunasakatte Junction, Bhadravati – 577115',
  hours: '',                 // e.g. 'Mon–Sat, 10 am – 8 pm'

  // ---- UPI payments (optional) ----------------------------------------
  // When upiId is set, customers who pick UPI get your UPI ID and a
  // "Pay with UPI app" button after placing the order.
  upiId: '8618621589@ybl',
  upiName: '',               // name shown inside the UPI app
  upiQr: '',                 // optional photo of your UPI QR, e.g. 'images/upi-qr.png'

  // ---- Delivery & policies --------------------------------------------
  freeDeliveryAbove: 999,    // orders at or above this get free delivery
  deliveryFee: 79,           // delivery charge below that amount
  cashOnDelivery: true,      // false hides the Cash on Delivery option
  codFee: 0,                 // extra charge for COD (0 = none)
  deliveryTime: '4–7 working days',
  exchangeDays: 7,           // 0 hides the exchange promise

  // ---- About section ----------------------------------------------------
  about: {
    title: 'Made for the girl who loves to dress up',
    text: [
      '{name} began with a simple love for sarees and the happy clink of bangles. We bring together silks, cottons and party drapes, and pair each one with bangles that complete the look — so you can shop your whole outfit in one place.',
      'Every order is packed with care, and you can talk to us on WhatsApp before and after you buy.'
    ],
    points: [
      ['Handpicked pieces', 'Each saree and bangle set is chosen by us, not bulk-listed.'],
      ['Matching made easy', 'Every saree shows bangles in matching colours.'],
      ['Real people to help', 'Ask about colour, size or delivery on WhatsApp.']
    ]
  },

  // ---- Questions & answers ----------------------------------------------
  // {free} {fee} {days} {exchange} {name} are filled in automatically.
  faq: [
    ['How do I place an order?', 'Add your favourites to the bag and tap Checkout. Fill in your address and your order opens in WhatsApp — just tap send. We confirm availability and delivery with you there.'],
    ['Which payment methods do you accept?', 'UPI (Google Pay, PhonePe, Paytm and others) after we confirm your order, or Cash on Delivery.'],
    ['How much is delivery and how long does it take?', 'Delivery is free on orders of {free} and above; below that it is {fee}. Orders usually arrive in {days}.'],
    ['Can I exchange an item?', 'Yes — unused items with tags can be exchanged within {exchange} days of delivery. Please record a short unboxing video so we can help quickly if anything arrives damaged.'],
    ['How do I find my bangle size?', 'Measure the inside of a bangle that fits you well: 54 mm is 2.2, 57 mm is 2.4, 60 mm is 2.6, 64 mm is 2.8 and 67 mm is 2.10. Each bangle page has this size guide too.'],
    ['Will the colour look exactly like the photo?', 'We photograph in natural light, but colours can look slightly different on each screen. Ask us on WhatsApp for a live video of any piece.']
  ]
};
