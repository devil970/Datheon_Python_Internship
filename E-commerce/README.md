# ShopEase — Modern E-Commerce Storefront

A responsive, high-performance e-commerce web application built using **pure HTML5, CSS3, and modern Vanilla JavaScript (ES6+)**. This project was created as a frontend web development internship assignment to demonstrate proficiency in REST API integration, reactive DOM manipulation, JavaScript array and object operations, browser `localStorage` persistence, and shopping cart calculation mechanics without relying on external libraries or frameworks.

---

## 📸 Overview & Key Features

- **Dynamic REST API Integration**: Fetches real-time catalog items from [FakeStoreAPI](https://fakestoreapi.com/products) with `async/await`, complete with loading spinners, comprehensive error handling, and connection retry states.
- **Combined Search & Category Filtering**: Real-time keyword search seamlessly intersected with category filters (`All Products`, `Electronics`, `Jewelry`, `Men's Clothing`, and `Women's Clothing`), alongside multiple sorting options (Price Low-to-High, High-to-Low, Highest Rated, and Alphabetical).
- **Responsive CSS Grid Design**: Built entirely with pure CSS Grid and Flexbox without Bootstrap or Tailwind. Features uniform product cards, clamped multi-line typography, and aspect-ratio image scaling (`object-fit: contain`).
- **Interactive Slide-Out Shopping Cart Drawer**:
  - Smooth 60fps sliding drawer with backdrop blur overlay.
  - Interactive increment (`+`), decrement (`−`), and delete controls.
  - Free shipping progress bar that dynamically tracks how much more the user needs to spend to earn free shipping.
  - Dynamic navbar counter badge reflecting the total quantity of items.
- **Persistent Cart with `localStorage`**: Cart items, quantities, and properties persist across browser refreshes and tab closures. Corrupted storage data is safely caught and gracefully handled.
- **Simulated Checkout Workflow**:
  - Order preview and itemized pricing breakdown.
  - Client-side form validation (full name and email regex validation).
  - Generates a unique simulated order reference code (e.g., `SE-849201`).
  - Clears cart and localStorage upon successful order placement, presenting an order confirmation modal.
- **Dark / Light Mode Theme Toggle**:
  - Seamless toggle button in header with Sun / Moon icons.
  - Persists preference in `localStorage` (`shopease_theme`) and automatically respects OS `prefers-color-scheme`.
  - Zero Flash-of-Unstyled-Theme (FOUC) through early initialization script.
- **Wishlist & Favorites System**:
  - One-click heart toggle on product cards with pop micro-animations.
  - Dedicated slide-out Saved Items drawer with "Move to Cart" and "Move All to Cart" workflows.
  - Persistent storage in `localStorage` under key `shopease_wishlist_v1`.
- **Product Quick View Modal**:
  - Instant high-res product preview accessible via hover button, product title, or product thumbnail.
  - Full item description, rating metrics, stock status indicator, quantity selector, and direct Add-to-Cart / Wishlist actions.
- **Accessible & Secure**:
  - Keyboard friendly: `Escape` key closes cart drawer, wishlist drawer, quick view modal, and checkout modals.
  - Safe DOM generation and HTML escaping to protect against script injection.
  - WCAG-compliant color contrast ratios and semantic HTML5 elements.

---

## 🛠️ Technology Stack

| Technology | Purpose |
| :--- | :--- |
| **HTML5** | Semantic structure (`<header>`, `<nav>`, `<main>`, `<aside>`, `<section>`, `<footer>`, `<dialog>`) |
| **CSS3** | Custom design system using CSS Variables, CSS Grid, Flexbox, media queries, and smooth keyframe animations |
| **Vanilla JavaScript (ES6+)** | State management, DOM manipulation, Fetch API, and event orchestration |
| **FakeStoreAPI** | Live third-party RESTful e-commerce catalog API (`https://fakestoreapi.com/products`) |
| **Browser `localStorage`** | Client-side persistent cart storage |

---

## 🚀 How to Run the Project Locally

No dependencies or node modules are required to run this project. You can run it directly in any modern browser:

### Option 1: Direct File Launch
Simply double-click `index.html` or right-click and choose **Open with > Chrome / Firefox / Edge**.

### Option 2: VS Code Live Server Extension (Recommended)
1. Open the project folder in Visual Studio Code.
2. Install the **Live Server** extension (by Ritwick Dey).
3. Right-click `index.html` and select **"Open with Live Server"**.
4. The storefront will automatically launch at `http://127.0.0.1:5500`.

### Option 3: Local Node / Python HTTP Server
Using Python:
```bash
# Python 3
python -m http.server 8000
```
Then visit `http://localhost:8000` in your browser.

Using Node.js (`npx`):
```bash
npx serve .
```

---

## 🌐 How FakeStoreAPI Works

The storefront consumes the public REST endpoint:
```
GET https://fakestoreapi.com/products
```

Each product item returned by the API follows this schema:
```json
{
  "id": 1,
  "title": "Fjallraven - Foldsack No. 1 Backpack, Fits 15 Laptops",
  "price": 109.95,
  "description": "Your perfect pack for everyday use and walks in the forest...",
  "category": "men's clothing",
  "image": "https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg",
  "rating": {
    "rate": 3.9,
    "count": 120
  }
}
```

### Category Normalization
FakeStoreAPI categories use specific lowercase keys, notably `"jewelery"` (with a single 'l'). The application handles mapping cleanly:
- `"all"` $\rightarrow$ `All Products`
- `"electronics"` $\rightarrow$ `Electronics`
- `"jewelery"` $\rightarrow$ `Jewelry`
- `"men's clothing"` $\rightarrow$ `Men's Clothing`
- `"women's clothing"` $\rightarrow$ `Women's Clothing`

---

## 🛒 Shopping Cart State Management & Persistence

The application maintains a single source of truth (`state.cart`) formatted as an array of product objects:
```javascript
{
  id: 1,
  title: "Fjallraven - Foldsack No. 1 Backpack...",
  price: 109.95,
  image: "https://...",
  category: "men's clothing",
  quantity: 2
}
```

### Core Cart Functions
The codebase explicitly defines the following modular functions required by the specification:

1. `addToCart(product)`: Checks if the product already exists by `id`. If found, increments its `quantity`; otherwise, pushes a new entry with `quantity: 1`.
2. `removeFromCart(productId)`: Locates the item by `productId` and removes it from `state.cart`.
3. `updateQuantity(productId, quantity)`: Updates the item's count. If quantity reaches `0` or less, removes the item automatically.
4. `calculateSubtotal()`: Sums the product of unit price and quantity across all cart items.
5. `calculateTax()`: Calculates standard 8% estimated tax on the subtotal.
6. `calculateShipping()`: Evaluates simulated shipping rules ($0 if subtotal $\ge \$50$, else $\$5$).
7. `calculateTotal()`: Computes `subtotal + tax + shipping`.
8. `renderCart()`: Renders cart items, badges, pricing totals, and the free shipping progress meter.
9. `saveCartToLocalStorage()`: Serializes `state.cart` into JSON and stores it under key `shopease_cart_v1`.
10. `loadCartFromLocalStorage()`: Reads and safely parses stored JSON into `state.cart` on application startup with defensive validation against corrupted payloads.

---

## 💰 Pricing Calculations & Business Rules

All price calculations are computed dynamically and formatted using the standard `Intl.NumberFormat` API:

$$\text{Subtotal} = \sum_{i=1}^{n} (\text{item}_i.\text{price} \times \text{item}_i.\text{quantity})$$

$$\text{Tax} = \begin{cases} 0.00 & \text{if } \text{Subtotal} = 0 \\ \text{round}(\text{Subtotal} \times 0.08) & \text{otherwise} \end{cases}$$

$$\text{Shipping} = \begin{cases} \$0.00 & \text{if } \text{Subtotal} = 0 \text{ or } \text{Subtotal} \ge \$50.00 \\ \$5.00 & \text{if } 0 < \text{Subtotal} < \$50.00 \end{cases}$$

$$\text{Final Total} = \text{Subtotal} + \text{Tax} + \text{Shipping}$$

*All monetary values are rounded using `Math.round(val * 100) / 100` before display to prevent IEEE 754 floating-point inaccuracies (e.g., preventing values like `$29.990000000000002`).*

---

## 📋 Testing Verification Checklist

- [x] **API Catalog Fetch**: Successfully retrieves and maps 20 products from FakeStoreAPI.
- [x] **Display Quality**: Consistent card sizing, non-stretched images, clamped two-line titles, star ratings, and prices in USD.
- [x] **Search Filter**: Real-time filtering by product title with clear button.
- [x] **Category Filters**: Active buttons for All, Electronics, Jewelry, Men's Clothing, and Women's Clothing.
- [x] **Combined Filtering**: Search keywords and active category buttons filter concurrently.
- [x] **Cart Badge**: Badge reflects total quantity of items (`sum(quantities)`), not just unique items.
- [x] **Duplicate Addition**: Adding an existing item increments quantity rather than adding duplicate cards.
- [x] **Quantity Adjustment**: Plus and minus buttons update quantities and immediate totals; reducing below 1 removes the item.
- [x] **Calculations**: Accurate subtotal, 8% tax, free shipping above $50, and zero totals for empty cart.
- [x] **Persistence**: Cart survives page reloads without losing items or quantities.
- [x] **Simulated Checkout**: Validates name and email, generates order reference number (`SE-XXXXXX`), clears cart, and displays confirmation modal.
- [x] **Dark / Light Mode**: Instant toggle, persistent theme storage, smooth CSS transitions, and system preference detection.
- [x] **Wishlist / Favorites**: Persistent saved items drawer, card heart toggles, badge counter, and batch move-to-cart.
- [x] **Product Quick View**: Interactive modal with full description, quantity stepper, stock badge, and direct cart actions.
- [x] **Error & Empty States**: Gracefully handles network failure with retry button, and displays clear empty search messages.
- [x] **Responsive Layout**: Thoroughly tested on mobile (<520px), tablet (768px), and desktop (1200px+).

---

## 📂 Project Structure

```
ecommerce-store/
├── index.html        # Semantic HTML5 layout and accessibility markup
├── style.css         # Clean custom CSS3 styles, grid, flexbox, and drawer/modal transitions
├── script.js         # ES6+ JavaScript: state, cart math, API fetch, event handlers
└── README.md         # Comprehensive project documentation
```

---

## 📜 Academic / Internship Disclaimer

This storefront was built as a frontend internship project for educational and demonstration purposes. All products and prices are provided by the public FakeStoreAPI. No real payments, cards, or user credentials are collected or processed.
