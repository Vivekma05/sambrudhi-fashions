/* =====================================================================
   PRODUCTS — add, remove or change items here.

   Every product needs:
     id          unique short code, e.g. 's13'
     category    'sarees' | 'bangles' | 'combos'
     name, type, price, mrp (original price; same as price = no discount)
     occasions   any of: 'Wedding', 'Festive', 'Party', 'Office', 'Daily'
     colors      any of: red, maroon, pink, orange, yellow, green, blue,
                 purple, black, white, gold   (used for filters + matching)
     description, details (list of short lines)

   Optional:
     images   ['images/s1-front.jpg', 'images/s1-pallu.jpg']  -> real photos
              (when empty, a drawn illustration from "art" is shown instead)
     sizes    bangle sizes the customer must choose from
     badge    small label on the photo, e.g. 'New'
     isNew    true = shows first when sorting by "Newest"
     inStock  false = shows "Sold out" and cannot be added to the bag
   ===================================================================== */

const BANGLE_SIZES = ['2.2', '2.4', '2.6', '2.8', '2.10'];
const SAREE_LENGTH = 'Length: 5.5 m saree + 0.8 m blouse piece';

window.PRODUCTS = [
  /* ----------------------------- SAREES ----------------------------- */
  {
    id: 's1', category: 'sarees', type: 'Mysore Silk',
    name: 'Royal Maroon Mysore Silk Saree',
    price: 6499, mrp: 7999, badge: 'Wedding special',
    occasions: ['Wedding', 'Festive'], colors: ['maroon', 'gold'],
    description: 'A classic Mysore silk saree in deep maroon with a fine gold zari border. Light, soft and fluid — it drapes beautifully and stays comfortable through long ceremonies.',
    details: ['Fabric: Mysore crepe silk with zari border', SAREE_LENGTH, 'Care: Dry clean only'],
    images: [],
    art: { body: '#7a1230', border: '#7a1230', zari: '#dcb15a', motif: 'plain', borderStyle: 'zari', sheen: 0.3 }
  },
  {
    id: 's2', category: 'sarees', type: 'Kanjivaram Silk',
    name: 'Peacock Green Kanjivaram with Temple Border',
    price: 12499, mrp: 14999, badge: 'New', isNew: true,
    occasions: ['Wedding'], colors: ['green', 'red', 'gold'],
    description: 'Rich peacock green Kanjivaram with a contrast red temple border and gold buttas across the body. Heavy, lustrous and made for weddings.',
    details: ['Fabric: Kanjivaram silk with zari', 'Border: Temple design', SAREE_LENGTH, 'Care: Dry clean only'],
    images: [],
    art: { body: '#0f5e46', border: '#a3123a', zari: '#d9ad55', motif: 'buttas', borderStyle: 'temple', sheen: 0.26 }
  },
  {
    id: 's3', category: 'sarees', type: 'Banarasi Silk',
    name: 'Rani Pink Banarasi Floral Saree',
    price: 8999, mrp: 10999,
    occasions: ['Wedding', 'Festive', 'Party'], colors: ['pink', 'gold'],
    description: 'Banarasi silk in rani pink with gold floral weaving all over and a rich zari pallu. A festive favourite that photographs beautifully.',
    details: ['Fabric: Banarasi silk with zari weave', SAREE_LENGTH, 'Care: Dry clean only'],
    images: [],
    art: { body: '#c2185b', border: '#8e0f42', zari: '#e2b65c', motif: 'floral', borderStyle: 'zari', sheen: 0.24 }
  },
  {
    id: 's4', category: 'sarees', type: 'Ilkal Handloom',
    name: 'Green & Red Ilkal Checks Saree',
    price: 2499, mrp: 2999, badge: 'Handloom',
    occasions: ['Festive', 'Daily'], colors: ['green', 'red'],
    description: 'Traditional Ilkal handloom with green checks, a red temple border and a striped pallu. Sturdy, breathable and perfect for festivals and family functions.',
    details: ['Fabric: Cotton-silk handloom', 'Border: Temple (tope teni) design', SAREE_LENGTH, 'Care: Gentle hand wash, dry in shade'],
    images: [],
    art: { body: '#1d5c34', border: '#b1162b', zari: '#e9cf8f', motif: 'checks', borderStyle: 'temple', sheen: 0.1 }
  },
  {
    id: 's5', category: 'sarees', type: 'Chiffon',
    name: 'Sunset Orange Chiffon Saree',
    price: 1499, mrp: 1999,
    occasions: ['Party', 'Daily'], colors: ['orange'],
    description: 'Feather-light chiffon in a warm sunset orange with a delicate sequin border. Easy to drape and carry — ideal for parties and evening functions.',
    details: ['Fabric: Chiffon with sequin border', SAREE_LENGTH, 'Care: Dry clean recommended'],
    images: [],
    art: { body: '#e46a35', border: '#c4501f', zari: '#f6d9a0', motif: 'plain', borderStyle: 'thin', sheen: 0.32 }
  },
  {
    id: 's6', category: 'sarees', type: 'Georgette',
    name: 'Midnight Blue Sequin Georgette Saree',
    price: 2999, mrp: 3499, badge: 'Party pick', isNew: true,
    occasions: ['Party'], colors: ['blue', 'black'],
    description: 'Navy georgette scattered with tiny sequins that catch the light. Pair it with silver or glass bangles for a modern party look.',
    details: ['Fabric: Georgette with sequin work', SAREE_LENGTH, 'Care: Dry clean only'],
    images: [],
    art: { body: '#1c2142', border: '#141830', zari: '#d8c08a', motif: 'sequins', borderStyle: 'thin', sheen: 0.22 }
  },
  {
    id: 's7', category: 'sarees', type: 'Cotton Handloom',
    name: 'Mustard Striped Cotton Saree',
    price: 1199, mrp: 1499,
    occasions: ['Daily', 'Office'], colors: ['yellow', 'maroon'],
    description: 'Soft handloom cotton in mustard yellow with fine stripes and a maroon border. Breathable for daily wear and smart enough for office.',
    details: ['Fabric: Handloom cotton', SAREE_LENGTH, 'Care: Hand wash separately in cold water'],
    images: [],
    art: { body: '#d39b12', border: '#7a1530', zari: '#f3dc9c', motif: 'stripes', borderStyle: 'thin', sheen: 0.08 }
  },
  {
    id: 's8', category: 'sarees', type: 'Kanjivaram Silk',
    name: 'Lavender Kanjivaram with Zari Checks',
    price: 10999, mrp: 12999,
    occasions: ['Wedding', 'Festive'], colors: ['purple', 'gold'],
    description: 'Lavender Kanjivaram woven with gold checks and a deep purple temple border. A softer colour for weddings, receptions and poojas.',
    details: ['Fabric: Kanjivaram silk with zari', 'Border: Temple design', SAREE_LENGTH, 'Care: Dry clean only'],
    images: [],
    art: { body: '#8f7cc0', border: '#4f2378', zari: '#e0b85f', motif: 'checks', borderStyle: 'temple', sheen: 0.26 }
  },
  {
    id: 's9', category: 'sarees', type: 'Pochampally Ikat',
    name: 'Indigo Pochampally Ikat Saree',
    price: 3499, mrp: 3999, badge: 'Handloom',
    occasions: ['Office', 'Festive'], colors: ['blue', 'red'],
    description: 'Hand-woven Pochampally ikat in indigo with the signature soft-edged pattern and a rust border. Lovely for office days and festive mornings.',
    details: ['Fabric: Cotton ikat handloom', SAREE_LENGTH, 'Care: Hand wash separately in cold water'],
    images: [],
    art: { body: '#22385e', border: '#a8382b', zari: '#e8d3a2', motif: 'ikat', borderStyle: 'thin', sheen: 0.08 }
  },
  {
    id: 's10', category: 'sarees', type: 'Soft Silk',
    name: 'Mango Yellow Paisley Soft Silk Saree',
    price: 3299, mrp: 3999,
    occasions: ['Festive'], colors: ['yellow', 'maroon', 'gold'],
    description: 'Soft silk in bright mango yellow with gold paisley motifs and a maroon zari border. Lighter than pure silk and easy to manage all day.',
    details: ['Fabric: Soft silk with zari', SAREE_LENGTH, 'Care: Dry clean recommended'],
    images: [],
    art: { body: '#eeb108', border: '#8f1736', zari: '#c98b1a', motif: 'paisley', borderStyle: 'zari', sheen: 0.24 }
  },
  {
    id: 's11', category: 'sarees', type: 'Organza',
    name: 'Blush Pink Floral Organza Saree',
    price: 2799, mrp: 3499, isNew: true,
    occasions: ['Party', 'Festive'], colors: ['pink'],
    description: 'Sheer organza in blush pink with soft floral work. Light, airy and elegant for engagements, haldi and day functions.',
    details: ['Fabric: Organza with floral work', SAREE_LENGTH, 'Care: Dry clean only'],
    images: [],
    art: { body: '#f2c4c4', border: '#e4a3a6', zari: '#c99a4a', motif: 'floral', borderStyle: 'thin', sheen: 0.3 }
  },
  {
    id: 's12', category: 'sarees', type: 'Linen',
    name: 'Ivory & Gold Linen Saree',
    price: 2199, mrp: 2699,
    occasions: ['Office', 'Daily'], colors: ['white', 'gold'],
    description: 'Crisp linen in ivory with gold stripes and a gold zari border. Understated and elegant for office, poojas and day events.',
    details: ['Fabric: Linen with zari border', SAREE_LENGTH, 'Care: Gentle hand wash or dry clean'],
    images: [],
    art: { body: '#f1e7d2', border: '#c9973f', zari: '#7d5713', motif: 'stripes', borderStyle: 'zari', sheen: 0.12 }
  },

  /* ----------------------------- BANGLES ---------------------------- */
  {
    id: 'b1', category: 'bangles', type: 'Glass Bangles',
    name: 'Ruby Red Glass Bangles — Set of 24',
    price: 349, mrp: 449, badge: 'New', isNew: true, sizes: BANGLE_SIZES,
    occasions: ['Festive', 'Daily'], colors: ['red', 'gold'],
    description: 'Classic red glass bangles with gold glitter accents — 12 for each hand. The everyday touch of tradition.',
    details: ['Material: Glass with glitter finish', 'Set: 24 bangles (12 per hand)', 'Care: Store in a box; keep away from water and perfume'],
    images: [],
    art: { style: 'glass', colors: ['#b3122e', '#b3122e', '#d4a64a'], glitter: '#f6d58c' }
  },
  {
    id: 'b2', category: 'bangles', type: 'Kundan Bangles',
    name: 'Emerald Kundan Bangles — Pair',
    price: 899, mrp: 1199, sizes: BANGLE_SIZES,
    occasions: ['Wedding', 'Party'], colors: ['green', 'gold'],
    description: 'Gold-tone bangles set with emerald-green kundan stones and pearl edging. A statement pair for weddings and receptions.',
    details: ['Material: Gold-plated alloy with kundan stones', 'Set: 2 bangles', 'Care: Keep dry; wipe with a soft cloth'],
    images: [],
    art: { style: 'kundan', colors: ['#0f6b4f'] }
  },
  {
    id: 'b3', category: 'bangles', type: 'Silk Thread Bangles',
    name: 'Rani Pink Silk Thread Bangles — Set of 6',
    price: 449, mrp: 599, badge: 'Handmade', sizes: BANGLE_SIZES,
    occasions: ['Festive', 'Party'], colors: ['pink', 'gold'],
    description: 'Handmade silk-thread bangles in rani pink with gold bands and stone work. Light, bright and fun to stack.',
    details: ['Material: Silk thread on a light base, with stones', 'Set: 6 bangles', 'Care: Keep dry; store flat'],
    images: [],
    art: { style: 'thread', colors: ['#c2185b', '#d23d78'], stone: '#ffffff' }
  },
  {
    id: 'b4', category: 'bangles', type: 'Gold-plated Kada',
    name: 'Temple Gold Kada with Ruby Stones — Pair',
    price: 1299, mrp: 1699, sizes: BANGLE_SIZES,
    occasions: ['Wedding', 'Festive'], colors: ['gold', 'red', 'maroon'],
    description: 'Broad gold-plated kadas with temple-style engraving and ruby-red stones. Made to sit beside rich silk sarees.',
    details: ['Material: Gold-plated brass', 'Set: 2 kadas', 'Care: Keep dry; store in the pouch provided'],
    images: [],
    art: { style: 'kada', colors: ['#a3123a'] }
  },
  {
    id: 'b5', category: 'bangles', type: 'Lac Bangles',
    name: 'Maroon Mirror-work Lac Bangles — Set of 6',
    price: 699, mrp: 899, sizes: BANGLE_SIZES,
    occasions: ['Festive'], colors: ['maroon', 'gold'],
    description: 'Rajasthani lac bangles in maroon with mirror and gold dot work. Bold, festive and lovely with silk.',
    details: ['Material: Lac with mirror work', 'Set: 6 bangles', 'Care: Keep away from heat and water'],
    images: [],
    art: { style: 'lac', colors: ['#7a1530', '#8d1c3a'] }
  },
  {
    id: 'b6', category: 'bangles', type: 'Glass Bangles',
    name: 'Peacock Blue & Green Glass Bangles — Set of 24',
    price: 399, mrp: 499, sizes: BANGLE_SIZES,
    occasions: ['Daily', 'Festive'], colors: ['blue', 'green', 'gold'],
    description: 'A peacock mix of blue, green and gold glass bangles. Easy to pair with green, blue and yellow sarees.',
    details: ['Material: Glass', 'Set: 24 bangles (12 per hand)', 'Care: Store in a box; keep away from water and perfume'],
    images: [],
    art: { style: 'glass', colors: ['#0b5d8a', '#0f6b4f', '#d4a64a'], glitter: '#f6d58c' }
  },
  {
    id: 'b7', category: 'bangles', type: 'Bridal Chooda',
    name: 'Red & Ivory Bridal Chooda Set',
    price: 1899, mrp: 2499, badge: 'Bridal', sizes: BANGLE_SIZES,
    occasions: ['Wedding'], colors: ['red', 'white', 'gold'],
    description: 'A bridal set alternating deep red and ivory with gold accents. Comes as a full set for both hands.',
    details: ['Material: Acrylic with stone and gold work', 'Set: Full set for both hands', 'Care: Store in the box provided'],
    images: [],
    art: { style: 'lac', colors: ['#b3122e', '#f1e6d0'] }
  },
  {
    id: 'b8', category: 'bangles', type: 'Pearl Bangles',
    name: 'Ivory Pearl Bangles — Pair',
    price: 599, mrp: 799, sizes: BANGLE_SIZES,
    occasions: ['Party', 'Office'], colors: ['white', 'gold'],
    description: 'Rows of soft ivory pearls on a gold-tone frame. Elegant with pastel, white and organza sarees.',
    details: ['Material: Faux pearls on gold-plated alloy', 'Set: 2 bangles', 'Care: Wipe with a dry cloth; avoid perfume'],
    images: [],
    art: { style: 'pearl', colors: ['#f6efe3'] }
  },
  {
    id: 'b9', category: 'bangles', type: 'Silk Thread Bangles',
    name: 'Mustard & Green Thread Bangles — Set of 6',
    price: 449, mrp: 599, sizes: BANGLE_SIZES,
    occasions: ['Festive', 'Daily'], colors: ['yellow', 'green'],
    description: 'Mustard and green silk-thread bangles with gold bands. Made for haldi, festivals and bright cotton sarees.',
    details: ['Material: Silk thread on a light base, with stones', 'Set: 6 bangles', 'Care: Keep dry; store flat'],
    images: [],
    art: { style: 'thread', colors: ['#d39b12', '#1d6b45'], stone: '#ffffff' }
  },
  {
    id: 'b10', category: 'bangles', type: 'Glass Bangles',
    name: 'Purple Glitter Glass Bangles — Set of 24',
    price: 349, mrp: 449, sizes: BANGLE_SIZES,
    occasions: ['Party', 'Daily'], colors: ['purple'],
    description: 'Deep purple glass bangles with silver glitter. A fun pop of colour with lavender, pink and black sarees.',
    details: ['Material: Glass with glitter finish', 'Set: 24 bangles (12 per hand)', 'Care: Store in a box; keep away from water and perfume'],
    images: [],
    art: { style: 'glass', colors: ['#5d2a8a', '#7a3fae'], glitter: '#e9e4f3' }
  },

  /* ----------------------------- COMBOS ----------------------------- */
  {
    id: 'c1', category: 'combos', type: 'Saree + Bangles',
    name: 'Maroon Mysore Silk + Maroon & Gold Glass Bangles',
    price: 6699, mrp: 8448, badge: 'Combo saver', sizes: BANGLE_SIZES,
    occasions: ['Wedding', 'Festive'], colors: ['maroon', 'gold'],
    description: 'Our Royal Maroon Mysore silk saree with a set of 24 maroon-and-gold glass bangles. The complete look in one order — for less.',
    details: ['Includes: Mysore silk saree + 24 glass bangles', SAREE_LENGTH, 'Choose your bangle size above'],
    images: [],
    art: {
      saree: { body: '#7a1230', border: '#7a1230', zari: '#dcb15a', motif: 'plain', borderStyle: 'zari', sheen: 0.3 },
      bangles: { style: 'glass', colors: ['#7a1230', '#d4a64a'], glitter: '#f6d58c' }
    }
  },
  {
    id: 'c2', category: 'combos', type: 'Saree + Bangles',
    name: 'Peacock Green Kanjivaram + Emerald Kundan Bangles',
    price: 12999, mrp: 15698, badge: 'Bridal combo', sizes: BANGLE_SIZES,
    occasions: ['Wedding'], colors: ['green', 'gold', 'red'],
    description: 'The temple-border Kanjivaram paired with our emerald kundan bangles. A ready bridal or wedding-guest look.',
    details: ['Includes: Kanjivaram silk saree + pair of kundan bangles', SAREE_LENGTH, 'Choose your bangle size above'],
    images: [],
    art: {
      saree: { body: '#0f5e46', border: '#a3123a', zari: '#d9ad55', motif: 'buttas', borderStyle: 'temple', sheen: 0.26 },
      bangles: { style: 'kundan', colors: ['#0f6b4f'] }
    }
  },
  {
    id: 'c3', category: 'combos', type: 'Saree + Bangles',
    name: 'Mustard Cotton Saree + Thread Bangles',
    price: 1499, mrp: 2098, sizes: BANGLE_SIZES,
    occasions: ['Daily', 'Festive'], colors: ['yellow', 'green', 'maroon'],
    description: 'The striped mustard cotton saree with six mustard-and-green thread bangles. Bright, easy and festival-ready.',
    details: ['Includes: Cotton handloom saree + 6 thread bangles', SAREE_LENGTH, 'Choose your bangle size above'],
    images: [],
    art: {
      saree: { body: '#d39b12', border: '#7a1530', zari: '#f3dc9c', motif: 'stripes', borderStyle: 'thin', sheen: 0.08 },
      bangles: { style: 'thread', colors: ['#d39b12', '#1d6b45'], stone: '#ffffff' }
    }
  },
  {
    id: 'c4', category: 'combos', type: 'Saree + Bangles',
    name: 'Midnight Georgette + Silver Glass Bangles',
    price: 3249, mrp: 3948, isNew: true, sizes: BANGLE_SIZES,
    occasions: ['Party'], colors: ['blue', 'black'],
    description: 'The sequin georgette saree with silver and navy glass bangles. Your party look, sorted.',
    details: ['Includes: Georgette saree + 24 glass bangles', SAREE_LENGTH, 'Choose your bangle size above'],
    images: [],
    art: {
      saree: { body: '#1c2142', border: '#141830', zari: '#d8c08a', motif: 'sequins', borderStyle: 'thin', sheen: 0.22 },
      bangles: { style: 'glass', colors: ['#c3c9d4', '#1c2142'], glitter: '#ffffff' }
    }
  }
];
