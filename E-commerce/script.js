/**
 * ShopEase - Modern E-Commerce Storefront
 * Built with Vanilla JavaScript (ES6+), Fetch API, and localStorage
 * Suitable for Junior Frontend Web Development Internship Project
 */

// =============================================================================
// Application State & Configuration
// =============================================================================
const API_URL = 'https://fakestoreapi.com/products';
const STORAGE_KEY = 'shopease_cart_v1';
const WISHLIST_STORAGE_KEY = 'shopease_wishlist_v1';
const THEME_STORAGE_KEY = 'shopease_theme';
const TAX_RATE = 0.08; // 8% Sales Tax
const FREE_SHIPPING_THRESHOLD = 50.00;
const STANDARD_SHIPPING_FEE = 5.00;

// Central Application State
const state = {
  products: [],
  cart: [],
  wishlist: [],
  theme: 'light',
  quickViewProduct: null,
  quickViewQty: 1,
  selectedCategory: 'all',
  searchQuery: '',
  sortBy: 'featured',
  isLoading: false,
  error: null
};

// Currency Formatter Utility (USD)
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

// Format numeric amount to USD string
function formatPrice(amount) {
  const numeric = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return currencyFormatter.format(numeric);
}

// Utility: Sanitize text for safe rendering
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// =============================================================================
// DOM Elements Cache
// =============================================================================
const dom = {
  // Navigation, Theme & Search
  searchInput: document.getElementById('search-input'),
  searchClearBtn: document.getElementById('search-clear-btn'),
  cartToggleBtn: document.getElementById('cart-toggle-btn'),
  cartBadge: document.getElementById('cart-badge'),
  themeToggleBtn: document.getElementById('theme-toggle-btn'),
  sunIcon: document.querySelector('.sun-icon'),
  moonIcon: document.querySelector('.moon-icon'),
  
  // Wishlist Controls & Drawer
  wishlistToggleBtn: document.getElementById('wishlist-toggle-btn'),
  wishlistBadge: document.getElementById('wishlist-badge'),
  wishlistDrawer: document.getElementById('wishlist-drawer'),
  wishlistOverlay: document.getElementById('wishlist-overlay'),
  closeWishlistBtn: document.getElementById('close-wishlist-btn'),
  wishlistDrawerCount: document.getElementById('wishlist-drawer-count'),
  wishlistEmptyState: document.getElementById('wishlist-empty-state'),
  wishlistItemsList: document.getElementById('wishlist-items-list'),
  wishlistExploreBtn: document.getElementById('wishlist-explore-btn'),
  moveAllWishlistBtn: document.getElementById('move-all-wishlist-btn'),

  // Toolbar & Filters
  categoryButtons: document.querySelectorAll('.category-btn'),
  resultsInfo: document.getElementById('results-info'),
  sortSelect: document.getElementById('sort-select'),

  // Feedback States & Catalog
  loadingState: document.getElementById('loading-state'),
  errorState: document.getElementById('error-state'),
  errorMessage: document.getElementById('error-message'),
  retryBtn: document.getElementById('retry-btn'),
  emptyState: document.getElementById('empty-state'),
  resetFiltersBtn: document.getElementById('reset-filters-btn'),
  productsGrid: document.getElementById('products-grid'),

  // Cart Drawer
  cartDrawer: document.getElementById('cart-drawer'),
  cartOverlay: document.getElementById('cart-overlay'),
  closeCartBtn: document.getElementById('close-cart-btn'),
  drawerItemCount: document.getElementById('drawer-item-count'),
  cartEmptyState: document.getElementById('cart-empty-state'),
  cartItemsList: document.getElementById('cart-items-list'),
  startShoppingBtn: document.getElementById('start-shopping-btn'),
  cartSubtotal: document.getElementById('cart-subtotal'),
  cartTax: document.getElementById('cart-tax'),
  cartShipping: document.getElementById('cart-shipping'),
  cartTotal: document.getElementById('cart-total'),
  checkoutBtn: document.getElementById('checkout-btn'),
  shippingProgressBox: document.getElementById('shipping-progress-box'),
  shippingProgressText: document.getElementById('shipping-progress-text'),
  shippingProgressBar: document.getElementById('shipping-progress-bar'),

  // Checkout Modal
  checkoutModal: document.getElementById('checkout-modal'),
  closeCheckoutBtn: document.getElementById('close-checkout-btn'),
  cancelCheckoutBtn: document.getElementById('cancel-checkout-btn'),
  checkoutForm: document.getElementById('checkout-form'),
  customerNameInput: document.getElementById('customer-name'),
  customerEmailInput: document.getElementById('customer-email'),
  nameError: document.getElementById('name-error'),
  emailError: document.getElementById('email-error'),
  checkoutItemsCount: document.getElementById('checkout-items-count'),
  checkoutItemsPreview: document.getElementById('checkout-items-preview'),
  checkoutFinalTotal: document.getElementById('checkout-final-total'),

  // Quick View Modal
  quickviewModal: document.getElementById('quickview-modal'),
  closeQuickviewBtn: document.getElementById('close-quickview-btn'),
  quickviewCategoryBadge: document.getElementById('quickview-category-badge'),
  quickviewImage: document.getElementById('quickview-image'),
  quickviewRateVal: document.getElementById('quickview-rate-val'),
  quickviewCountVal: document.getElementById('quickview-count-val'),
  quickviewTitle: document.getElementById('quickview-title'),
  quickviewPrice: document.getElementById('quickview-price'),
  quickviewDescription: document.getElementById('quickview-description'),
  quickviewMinusBtn: document.getElementById('quickview-minus-btn'),
  quickviewQtyVal: document.getElementById('quickview-qty-val'),
  quickviewPlusBtn: document.getElementById('quickview-plus-btn'),
  quickviewAddCartBtn: document.getElementById('quickview-add-cart-btn'),
  quickviewWishlistBtn: document.getElementById('quickview-wishlist-btn'),

  // Order Confirmation Modal
  confirmationModal: document.getElementById('confirmation-modal'),
  confirmCustomerName: document.getElementById('confirm-customer-name'),
  confirmCustomerEmail: document.getElementById('confirm-customer-email'),
  confirmOrderRef: document.getElementById('confirm-order-ref'),
  confirmOrderTotal: document.getElementById('confirm-order-total'),
  continueShoppingBtn: document.getElementById('continue-shopping-btn'),

  // Toasts
  toastContainer: document.getElementById('toast-container')
};

// =============================================================================
// API Integration: Fetch Products from FakeStoreAPI
// =============================================================================
async function fetchProducts() {
  state.isLoading = true;
  state.error = null;
  updateStateViews();

  try {
    const response = await fetch(API_URL);
    
    // HTTP response validation
    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('Invalid catalog format received from API');
    }

    // Sanitize and normalize product objects
    state.products = data.map(item => ({
      id: Number(item.id),
      title: String(item.title || 'Untitled Product'),
      price: Number(item.price) || 0,
      description: String(item.description || ''),
      category: String(item.category || 'other').toLowerCase(),
      image: item.image || 'https://via.placeholder.com/300?text=No+Image',
      rating: {
        rate: Number(item.rating && item.rating.rate) || 0,
        count: Number(item.rating && item.rating.count) || 0
      }
    }));

    state.isLoading = false;
    updateStateViews();
    applyFilterAndRender();
  } catch (err) {
    console.error('Failed to fetch catalog from FakeStoreAPI:', err);
    state.isLoading = false;
    state.error = err.message || 'Unable to connect to the product service.';
    updateStateViews();
  }
}

// Update UI visibility based on loading, error, and content states
function updateStateViews() {
  if (state.isLoading) {
    dom.loadingState.classList.remove('hidden');
    dom.errorState.classList.add('hidden');
    dom.emptyState.classList.add('hidden');
    dom.productsGrid.classList.add('hidden');
    dom.resultsInfo.textContent = 'Loading live catalog...';
    return;
  }

  dom.loadingState.classList.add('hidden');

  if (state.error) {
    dom.errorState.classList.remove('hidden');
    dom.errorMessage.textContent = `Error: ${state.error}`;
    dom.emptyState.classList.add('hidden');
    dom.productsGrid.classList.add('hidden');
    dom.resultsInfo.textContent = 'Catalog unavailable';
    return;
  }

  dom.errorState.classList.add('hidden');
  dom.productsGrid.classList.remove('hidden');
}

// =============================================================================
// Product Filtering, Sorting, and Rendering
// =============================================================================

// Combines search query and category filter
function applyFilterAndRender() {
  if (state.isLoading || state.error) return;

  const query = state.searchQuery.trim().toLowerCase();
  const selectedCategory = state.selectedCategory.toLowerCase();

  // 1. Filter by category & search query
  let filtered = state.products.filter(product => {
    // Category match
    const categoryMatches = (selectedCategory === 'all') || (product.category === selectedCategory);

    // Search query match (in title)
    const titleMatches = query === '' || product.title.toLowerCase().includes(query);

    return categoryMatches && titleMatches;
  });

  // 2. Sort filtered products
  filtered = sortProducts(filtered, state.sortBy);

  // 3. Update Results Toolbar Text
  updateResultsToolbar(filtered.length);

  // 4. Render product cards or empty state
  if (filtered.length === 0) {
    dom.emptyState.classList.remove('hidden');
    dom.productsGrid.innerHTML = '';
  } else {
    dom.emptyState.classList.add('hidden');
    renderProducts(filtered);
  }
}

// Sort comparator helper
function sortProducts(items, criteria) {
  const list = [...items];
  switch (criteria) {
    case 'price-asc':
      return list.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return list.sort((a, b) => b.price - a.price);
    case 'rating-desc':
      return list.sort((a, b) => b.rating.rate - a.rating.rate);
    case 'title-asc':
      return list.sort((a, b) => a.title.localeCompare(b.title));
    case 'featured':
    default:
      return list; // Maintain API order
  }
}

// Update results counter text
function updateResultsToolbar(count) {
  const catLabel = getCategoryLabel(state.selectedCategory);
  if (state.searchQuery.trim() !== '') {
    dom.resultsInfo.innerHTML = `Showing <span class="results-highlight">${count}</span> product${count === 1 ? '' : 's'} matching "<strong>${escapeHtml(state.searchQuery.trim())}</strong>" in <strong>${escapeHtml(catLabel)}</strong>`;
  } else {
    dom.resultsInfo.innerHTML = `Showing <span class="results-highlight">${count}</span> product${count === 1 ? '' : 's'} in <strong>${escapeHtml(catLabel)}</strong>`;
  }
}

// Map API category to user-friendly label
function getCategoryLabel(cat) {
  switch (cat) {
    case 'electronics': return 'Electronics';
    case 'jewelery': return 'Jewelry';
    case "men's clothing": return "Men's Clothing";
    case "women's clothing": return "Women's Clothing";
    case 'all': return 'All Products';
    default: return cat.charAt(0).toUpperCase() + cat.slice(1);
  }
}

// Render product card grid
function renderProducts(products) {
  dom.productsGrid.innerHTML = '';

  const fragment = document.createDocumentFragment();

  products.forEach(product => {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.setAttribute('data-id', product.id);

    // Image container
    const imageBox = document.createElement('div');
    imageBox.className = 'product-image-box';
    imageBox.title = `Click to view details for ${product.title}`;
    
    const img = document.createElement('img');
    img.src = product.image;
    img.alt = product.title;
    img.className = 'product-image';
    img.loading = 'lazy';
    imageBox.appendChild(img);

    // Floating Wishlist Heart Button
    const isSaved = isInWishlist(product.id);
    const favBtn = document.createElement('button');
    favBtn.type = 'button';
    favBtn.className = `btn-wishlist-toggle ${isSaved ? 'active' : ''}`;
    favBtn.setAttribute('data-id', product.id);
    favBtn.setAttribute('aria-label', isSaved ? `Remove ${escapeHtml(product.title)} from wishlist` : `Save ${escapeHtml(product.title)} to wishlist`);
    favBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
    `;
    favBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleWishlist(product, favBtn);
    });
    imageBox.appendChild(favBtn);

    // Floating Quick View Button
    const quickViewBtn = document.createElement('button');
    quickViewBtn.type = 'button';
    quickViewBtn.className = 'btn-quick-view';
    quickViewBtn.setAttribute('data-id', product.id);
    quickViewBtn.setAttribute('aria-label', `Quick view for ${escapeHtml(product.title)}`);
    quickViewBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
      <span>Quick View</span>
    `;
    quickViewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openQuickView(product.id);
    });
    imageBox.appendChild(quickViewBtn);

    // Open Quick View on Image Box Click
    imageBox.style.cursor = 'pointer';
    imageBox.addEventListener('click', () => {
      openQuickView(product.id);
    });

    // Card Body
    const body = document.createElement('div');
    body.className = 'product-card-body';

    // Meta (category + rating)
    const meta = document.createElement('div');
    meta.className = 'product-meta';

    const catBadge = document.createElement('span');
    catBadge.className = 'product-category-badge';
    catBadge.textContent = getCategoryLabel(product.category);

    const ratingDiv = document.createElement('div');
    ratingDiv.className = 'product-rating';
    ratingDiv.title = `Rated ${product.rating.rate} out of 5 stars based on ${product.rating.count} reviews`;
    ratingDiv.innerHTML = `
      <span class="star-icon" aria-hidden="true">&#9733;</span>
      <span>${product.rating.rate.toFixed(1)}</span>
      <span class="rating-count">(${product.rating.count})</span>
    `;

    meta.appendChild(catBadge);
    meta.appendChild(ratingDiv);

    // Title (Clickable for Quick View)
    const title = document.createElement('h3');
    title.className = 'product-title';
    title.textContent = product.title;
    title.title = `Click to view details for ${product.title}`;
    title.style.cursor = 'pointer';
    title.addEventListener('click', () => {
      openQuickView(product.id);
    });

    // Footer (price + Add to Cart button)
    const footer = document.createElement('div');
    footer.className = 'product-card-footer';

    const price = document.createElement('span');
    price.className = 'product-price';
    price.textContent = formatPrice(product.price);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn-add-to-cart';
    addBtn.setAttribute('data-id', product.id);
    addBtn.setAttribute('aria-label', `Add ${escapeHtml(product.title)} to shopping cart`);
    addBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="9" cy="21" r="1"></circle>
        <circle cx="20" cy="21" r="1"></circle>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
      </svg>
      <span>Add to Cart</span>
    `;

    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(product, 1);
      animateAddButton(addBtn);
    });

    footer.appendChild(price);
    footer.appendChild(addBtn);

    body.appendChild(meta);
    body.appendChild(title);
    body.appendChild(footer);

    card.appendChild(imageBox);
    card.appendChild(body);

    fragment.appendChild(card);
  });

  dom.productsGrid.appendChild(fragment);
}

// Micro-animation for Add to Cart button feedback
function animateAddButton(button) {
  const originalHtml = button.innerHTML;
  button.classList.add('btn-added');
  button.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    <span>Added!</span>
  `;

  setTimeout(() => {
    button.classList.remove('btn-added');
    button.innerHTML = originalHtml;
  }, 1000);
}

// =============================================================================
// Shopping Cart Operations (Required Functions)
// =============================================================================

/**
 * Adds a product to the cart with optional quantity. If product already exists, increments quantity.
 * @param {Object} product
 * @param {number} [qty=1]
 */
function addToCart(product, qty = 1) {
  if (!product || typeof product.id !== 'number') return;
  const count = Math.max(1, parseInt(qty, 10) || 1);

  const existingIndex = state.cart.findIndex(item => item.id === product.id);

  if (existingIndex > -1) {
    state.cart[existingIndex].quantity += count;
    showToast(`Updated "${product.title}" in cart (+${count})`, 'success');
  } else {
    state.cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      category: product.category,
      quantity: count
    });
    showToast(`Added "${product.title}" to cart`, 'success');
  }

  saveCartToLocalStorage();
  renderCart();
  triggerBadgeBump();
}

/**
 * Removes an item completely from the cart by productId.
 * @param {number} productId
 */
function removeFromCart(productId) {
  const itemIndex = state.cart.findIndex(item => item.id === Number(productId));
  if (itemIndex > -1) {
    const removedItem = state.cart[itemIndex];
    state.cart.splice(itemIndex, 1);
    saveCartToLocalStorage();
    renderCart();
    showToast(`Removed "${removedItem.title}" from cart`, 'info');
  }
}

/**
 * Updates the quantity of a specific cart item.
 * If quantity drops to 0 or less, removes the item.
 * @param {number} productId
 * @param {number} quantity
 */
function updateQuantity(productId, quantity) {
  const id = Number(productId);
  const targetQuantity = Number(quantity);

  if (isNaN(id)) return;

  const itemIndex = state.cart.findIndex(item => item.id === id);
  if (itemIndex === -1) return;

  if (isNaN(targetQuantity) || targetQuantity <= 0) {
    removeFromCart(id);
    return;
  }

  // Cap maximum realistic quantity per single order (e.g., 99)
  state.cart[itemIndex].quantity = Math.min(Math.floor(targetQuantity), 99);
  saveCartToLocalStorage();
  renderCart();
}

/**
 * Calculates the subtotal (sum of price * quantity for all items in cart).
 * @returns {number}
 */
function calculateSubtotal() {
  if (!state.cart || state.cart.length === 0) return 0;
  const rawSubtotal = state.cart.reduce((sum, item) => {
    const price = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
    const qty = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 1;
    return sum + (price * qty);
  }, 0);

  // Round to 2 decimal places to avoid floating point issues
  return Math.round(rawSubtotal * 100) / 100;
}

/**
 * Calculates estimated tax (8% of subtotal). Returns 0 if cart is empty.
 * @returns {number}
 */
function calculateTax() {
  const subtotal = calculateSubtotal();
  if (subtotal <= 0) return 0;
  return Math.round(subtotal * TAX_RATE * 100) / 100;
}

/**
 * Calculates shipping fee.
 * Free if subtotal >= $50, else $5 flat rate.
 * Returns 0 if cart is empty.
 * @returns {number}
 */
function calculateShipping() {
  const subtotal = calculateSubtotal();
  if (subtotal <= 0) return 0;
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    return 0;
  }
  return STANDARD_SHIPPING_FEE;
}

/**
 * Calculates final total: subtotal + tax + shipping.
 * Returns 0 if cart is empty.
 * @returns {number}
 */
function calculateTotal() {
  const subtotal = calculateSubtotal();
  if (subtotal <= 0) return 0;
  const tax = calculateTax();
  const shipping = calculateShipping();
  return Math.round((subtotal + tax + shipping) * 100) / 100;
}

/**
 * Renders the shopping cart drawer and updates header badge.
 */
function renderCart() {
  // 1. Calculate Total Items Count (sum of quantities)
  const totalItemCount = state.cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // 2. Update Navbar Badge and Drawer Header
  dom.cartBadge.textContent = totalItemCount;
  dom.cartBadge.setAttribute('aria-label', `${totalItemCount} items in cart`);
  dom.drawerItemCount.textContent = `${totalItemCount} item${totalItemCount === 1 ? '' : 's'}`;

  // 3. Calculate Pricing Values
  const subtotal = calculateSubtotal();
  const tax = calculateTax();
  const shipping = calculateShipping();
  const total = calculateTotal();

  dom.cartSubtotal.textContent = formatPrice(subtotal);
  dom.cartTax.textContent = formatPrice(tax);
  dom.cartTotal.textContent = formatPrice(total);

  if (subtotal === 0) {
    dom.cartShipping.textContent = formatPrice(0);
  } else if (shipping === 0) {
    dom.cartShipping.innerHTML = '<span style="color: var(--success); font-weight: 700;">FREE</span>';
  } else {
    dom.cartShipping.textContent = formatPrice(shipping);
  }

  // 4. Update Free Shipping Progress Bar
  updateShippingProgressBar(subtotal);

  // 5. Toggle Empty State vs Item List
  if (state.cart.length === 0) {
    dom.cartEmptyState.classList.remove('hidden');
    dom.cartItemsList.classList.add('hidden');
    dom.checkoutBtn.disabled = true;
    dom.cartItemsList.innerHTML = '';
    return;
  }

  dom.cartEmptyState.classList.add('hidden');
  dom.cartItemsList.classList.remove('hidden');
  dom.checkoutBtn.disabled = false;

  // 6. Build Cart Items DOM Safely
  dom.cartItemsList.innerHTML = '';
  const fragment = document.createDocumentFragment();

  state.cart.forEach(item => {
    const itemCard = document.createElement('div');
    itemCard.className = 'cart-item';
    itemCard.setAttribute('data-id', item.id);

    // Image Box
    const imgBox = document.createElement('div');
    imgBox.className = 'cart-item-img-box';
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.title;
    img.className = 'cart-item-img';
    imgBox.appendChild(img);

    // Details Box
    const details = document.createElement('div');
    details.className = 'cart-item-details';

    const title = document.createElement('h4');
    title.className = 'cart-item-title';
    title.textContent = item.title;
    title.title = item.title;

    const unitPrice = document.createElement('div');
    unitPrice.className = 'cart-item-unit-price';
    unitPrice.textContent = `${formatPrice(item.price)} each`;

    // Quantity Controls
    const actions = document.createElement('div');
    actions.className = 'cart-item-actions';

    const qtyControl = document.createElement('div');
    qtyControl.className = 'qty-control';

    // Minus Button
    const minusBtn = document.createElement('button');
    minusBtn.type = 'button';
    minusBtn.className = 'qty-btn';
    minusBtn.setAttribute('aria-label', `Decrease quantity for ${escapeHtml(item.title)}`);
    minusBtn.textContent = '−';
    minusBtn.addEventListener('click', () => {
      if (item.quantity > 1) {
        updateQuantity(item.id, item.quantity - 1);
      } else {
        // If decreasing from 1, confirm removal or directly remove
        removeFromCart(item.id);
      }
    });

    // Quantity Display
    const qtySpan = document.createElement('span');
    qtySpan.className = 'qty-val';
    qtySpan.textContent = item.quantity;
    qtySpan.setAttribute('aria-label', `Quantity: ${item.quantity}`);

    // Plus Button
    const plusBtn = document.createElement('button');
    plusBtn.type = 'button';
    plusBtn.className = 'qty-btn';
    plusBtn.setAttribute('aria-label', `Increase quantity for ${escapeHtml(item.title)}`);
    plusBtn.textContent = '+';
    plusBtn.addEventListener('click', () => {
      updateQuantity(item.id, item.quantity + 1);
    });

    qtyControl.appendChild(minusBtn);
    qtyControl.appendChild(qtySpan);
    qtyControl.appendChild(plusBtn);

    actions.appendChild(qtyControl);

    details.appendChild(title);
    details.appendChild(unitPrice);
    details.appendChild(actions);

    // Right Column (Subtotal & Remove Button)
    const rightCol = document.createElement('div');
    rightCol.className = 'cart-item-right';

    const itemSubtotal = document.createElement('span');
    itemSubtotal.className = 'cart-item-subtotal';
    itemSubtotal.textContent = formatPrice(item.price * item.quantity);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'cart-item-remove-btn';
    removeBtn.setAttribute('aria-label', `Remove ${escapeHtml(item.title)} from cart`);
    removeBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
      </svg>
    `;
    removeBtn.addEventListener('click', () => {
      removeFromCart(item.id);
    });

    rightCol.appendChild(itemSubtotal);
    rightCol.appendChild(removeBtn);

    itemCard.appendChild(imgBox);
    itemCard.appendChild(details);
    itemCard.appendChild(rightCol);

    fragment.appendChild(itemCard);
  });

  dom.cartItemsList.appendChild(fragment);
}

// Update free shipping bar visual state
function updateShippingProgressBar(subtotal) {
  if (subtotal <= 0) {
    dom.shippingProgressBox.classList.remove('unlocked');
    dom.shippingProgressText.innerHTML = `Add <strong>${formatPrice(FREE_SHIPPING_THRESHOLD)}</strong> more to qualify for <strong>FREE Shipping</strong>!`;
    dom.shippingProgressBar.style.width = '0%';
    return;
  }

  const percentage = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  dom.shippingProgressBar.style.width = `${percentage}%`;

  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    dom.shippingProgressBox.classList.add('unlocked');
    dom.shippingProgressText.innerHTML = `🎉 Congratulations! You unlocked <strong>FREE Shipping</strong>!`;
  } else {
    dom.shippingProgressBox.classList.remove('unlocked');
    const remaining = Math.round((FREE_SHIPPING_THRESHOLD - subtotal) * 100) / 100;
    dom.shippingProgressText.innerHTML = `Add <strong>${formatPrice(remaining)}</strong> more to unlock <strong>FREE Shipping</strong>!`;
  }
}

// Trigger bump animation on badge
function triggerBadgeBump() {
  dom.cartBadge.classList.remove('bump');
  // Trigger reflow to restart animation
  void dom.cartBadge.offsetWidth;
  dom.cartBadge.classList.add('bump');
}

// =============================================================================
// Persistent Cart Storage (localStorage)
// =============================================================================

/**
 * Saves current cart state to browser localStorage.
 */
function saveCartToLocalStorage() {
  try {
    const serialized = JSON.stringify(state.cart);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (err) {
    console.error('Failed to save cart to localStorage:', err);
  }
}

/**
 * Loads cart from browser localStorage, handling corrupted data safely.
 */
function loadCartFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      state.cart = [];
      return;
    }

    const parsed = JSON.parse(raw);

    // Validate structure is an array of items with valid numbers
    if (Array.isArray(parsed)) {
      state.cart = parsed
        .filter(item => item && typeof item.id === 'number' && typeof item.price === 'number')
        .map(item => ({
          id: Number(item.id),
          title: String(item.title || 'Product'),
          price: Number(item.price) || 0,
          image: item.image || '',
          category: String(item.category || ''),
          quantity: Math.max(1, parseInt(item.quantity, 10) || 1)
        }));
    } else {
      console.warn('Invalid cart structure in localStorage. Resetting cart.');
      state.cart = [];
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (err) {
    console.warn('Corrupted cart data encountered in localStorage. Resetting cart safely:', err);
    state.cart = [];
    localStorage.removeItem(STORAGE_KEY);
  }
}

// =============================================================================
// Theme Mode Toggle (Dark / Light)
// =============================================================================

function initTheme() {
  let saved = null;
  try {
    saved = localStorage.getItem(THEME_STORAGE_KEY);
  } catch (e) {}

  if (!saved) {
    saved = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  setTheme(saved, false);
}

function setTheme(theme, notify = true) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) {}

  if (dom.sunIcon && dom.moonIcon) {
    if (theme === 'dark') {
      dom.sunIcon.classList.remove('hidden');
      dom.moonIcon.classList.add('hidden');
    } else {
      dom.sunIcon.classList.add('hidden');
      dom.moonIcon.classList.remove('hidden');
    }
  }

  if (notify) {
    showToast(`Switched to ${theme === 'dark' ? 'Dark' : 'Light'} Mode`, 'info');
  }
}

function toggleTheme() {
  const next = state.theme === 'dark' ? 'light' : 'dark';
  setTheme(next, true);
}

// =============================================================================
// Wishlist State & Operations
// =============================================================================

function isInWishlist(productId) {
  return state.wishlist.some(item => item.id === Number(productId));
}

function toggleWishlist(product, triggerElement) {
  if (!product || typeof product.id !== 'number') return;
  const index = state.wishlist.findIndex(item => item.id === product.id);

  if (index > -1) {
    state.wishlist.splice(index, 1);
    showToast(`Removed "${product.title}" from saved items`, 'info');
    if (triggerElement) {
      triggerElement.classList.remove('active');
    }
  } else {
    state.wishlist.push({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      category: product.category,
      rating: product.rating,
      description: product.description
    });
    showToast(`Saved "${product.title}" to Wishlist`, 'success');
    if (triggerElement) {
      triggerElement.classList.add('active');
      triggerElement.classList.remove('bump');
      void triggerElement.offsetWidth;
      triggerElement.classList.add('bump');
    }
  }

  saveWishlistToLocalStorage();
  renderWishlist();
  updateWishlistButtonStates(product.id);
}

function updateWishlistButtonStates(productId) {
  const isSaved = isInWishlist(productId);
  document.querySelectorAll(`.btn-wishlist-toggle[data-id="${productId}"]`).forEach(btn => {
    btn.classList.toggle('active', isSaved);
    btn.setAttribute('aria-label', isSaved ? 'Remove from wishlist' : 'Save to wishlist');
  });

  if (state.quickViewProduct && state.quickViewProduct.id === productId && dom.quickviewWishlistBtn) {
    dom.quickviewWishlistBtn.classList.toggle('active', isSaved);
    const textEl = dom.quickviewWishlistBtn.querySelector('.btn-wishlist-text');
    if (textEl) textEl.textContent = isSaved ? 'Saved' : 'Wishlist';
  }
}

function saveWishlistToLocalStorage() {
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(state.wishlist));
  } catch (err) {
    console.error('Failed to save wishlist to localStorage:', err);
  }
}

function loadWishlistFromLocalStorage() {
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) {
      state.wishlist = [];
      return;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      state.wishlist = parsed.filter(i => i && typeof i.id === 'number');
    } else {
      state.wishlist = [];
    }
  } catch (err) {
    state.wishlist = [];
  }
}

function renderWishlist() {
  const count = state.wishlist.length;
  if (dom.wishlistBadge) {
    dom.wishlistBadge.textContent = count;
    dom.wishlistBadge.setAttribute('aria-label', `${count} saved items`);
    dom.wishlistBadge.classList.remove('bump');
    void dom.wishlistBadge.offsetWidth;
    dom.wishlistBadge.classList.add('bump');
  }

  if (dom.wishlistDrawerCount) {
    dom.wishlistDrawerCount.textContent = `${count} item${count === 1 ? '' : 's'}`;
  }

  if (count === 0) {
    if (dom.wishlistEmptyState) dom.wishlistEmptyState.classList.remove('hidden');
    if (dom.wishlistItemsList) {
      dom.wishlistItemsList.classList.add('hidden');
      dom.wishlistItemsList.innerHTML = '';
    }
    if (dom.moveAllWishlistBtn) dom.moveAllWishlistBtn.disabled = true;
    return;
  }

  if (dom.wishlistEmptyState) dom.wishlistEmptyState.classList.add('hidden');
  if (dom.wishlistItemsList) {
    dom.wishlistItemsList.classList.remove('hidden');
    dom.wishlistItemsList.innerHTML = '';
  }
  if (dom.moveAllWishlistBtn) dom.moveAllWishlistBtn.disabled = false;

  const fragment = document.createDocumentFragment();

  state.wishlist.forEach(item => {
    const card = document.createElement('div');
    card.className = 'cart-item';
    card.setAttribute('data-id', item.id);

    // Image
    const imgBox = document.createElement('div');
    imgBox.className = 'cart-item-img-box';
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.title;
    img.className = 'cart-item-img';
    imgBox.appendChild(img);

    // Details
    const details = document.createElement('div');
    details.className = 'cart-item-details';

    const title = document.createElement('h4');
    title.className = 'cart-item-title';
    title.textContent = item.title;
    title.title = item.title;

    const unitPrice = document.createElement('div');
    unitPrice.className = 'cart-item-unit-price';
    unitPrice.textContent = formatPrice(item.price);

    const actions = document.createElement('div');
    actions.className = 'cart-item-actions';

    // Move to cart button
    const moveBtn = document.createElement('button');
    moveBtn.type = 'button';
    moveBtn.className = 'wishlist-move-btn';
    moveBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="9" cy="21" r="1"></circle>
        <circle cx="20" cy="21" r="1"></circle>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
      </svg>
      <span>Move to Cart</span>
    `;
    moveBtn.addEventListener('click', () => {
      addToCart(item, 1);
      toggleWishlist(item);
    });

    actions.appendChild(moveBtn);
    details.appendChild(title);
    details.appendChild(unitPrice);
    details.appendChild(actions);

    // Right side: Remove button
    const rightCol = document.createElement('div');
    rightCol.className = 'cart-item-right';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'cart-item-remove-btn';
    removeBtn.setAttribute('aria-label', `Remove ${escapeHtml(item.title)} from saved items`);
    removeBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
    `;
    removeBtn.addEventListener('click', () => {
      toggleWishlist(item);
    });

    rightCol.appendChild(removeBtn);

    card.appendChild(imgBox);
    card.appendChild(details);
    card.appendChild(rightCol);

    fragment.appendChild(card);
  });

  dom.wishlistItemsList.appendChild(fragment);
}

function openWishlistDrawer() {
  if (dom.cartDrawer && dom.cartDrawer.classList.contains('open')) {
    closeCartDrawer();
  }
  dom.wishlistDrawer.classList.add('open');
  dom.wishlistOverlay.classList.add('active');
  document.body.classList.add('drawer-open');
  dom.wishlistDrawer.setAttribute('aria-hidden', 'false');
  dom.closeWishlistBtn.focus();
}

function closeWishlistDrawer() {
  dom.wishlistDrawer.classList.remove('open');
  dom.wishlistOverlay.classList.remove('active');
  document.body.classList.remove('drawer-open');
  dom.wishlistDrawer.setAttribute('aria-hidden', 'true');
  dom.wishlistToggleBtn.focus();
}

function moveAllWishlistToCart() {
  if (state.wishlist.length === 0) return;
  const itemsToMove = [...state.wishlist];
  itemsToMove.forEach(item => {
    addToCart(item, 1);
  });
  state.wishlist = [];
  saveWishlistToLocalStorage();
  renderWishlist();
  itemsToMove.forEach(i => updateWishlistButtonStates(i.id));
  showToast(`Moved ${itemsToMove.length} item${itemsToMove.length === 1 ? '' : 's'} to cart!`, 'success');
  closeWishlistDrawer();
  openCartDrawer();
}

// =============================================================================
// Product Quick View Modal Operations
// =============================================================================

function openQuickView(productId) {
  const product = state.products.find(p => p.id === Number(productId));
  if (!product) return;

  state.quickViewProduct = product;
  state.quickViewQty = 1;

  dom.quickviewCategoryBadge.textContent = getCategoryLabel(product.category);
  dom.quickviewImage.src = product.image;
  dom.quickviewImage.alt = product.title;
  dom.quickviewRateVal.textContent = product.rating.rate.toFixed(1);
  dom.quickviewCountVal.textContent = `(${product.rating.count} reviews)`;
  dom.quickviewTitle.textContent = product.title;
  dom.quickviewPrice.textContent = formatPrice(product.price);
  dom.quickviewDescription.textContent = product.description;
  dom.quickviewQtyVal.textContent = '1';

  // Update wishlist button state
  const isSaved = isInWishlist(product.id);
  dom.quickviewWishlistBtn.classList.toggle('active', isSaved);
  const textEl = dom.quickviewWishlistBtn.querySelector('.btn-wishlist-text');
  if (textEl) textEl.textContent = isSaved ? 'Saved' : 'Wishlist';

  dom.quickviewModal.classList.remove('hidden');
  requestAnimationFrame(() => {
    dom.quickviewModal.classList.add('active');
  });
  document.body.classList.add('modal-open');
  dom.quickviewModal.setAttribute('aria-hidden', 'false');
  dom.closeQuickviewBtn.focus();
}

function closeQuickView() {
  dom.quickviewModal.classList.remove('active');
  document.body.classList.remove('modal-open');
  dom.quickviewModal.setAttribute('aria-hidden', 'true');
  setTimeout(() => {
    dom.quickviewModal.classList.add('hidden');
    state.quickViewProduct = null;
  }, 250);
}

// =============================================================================
// Cart Drawer Open/Close Behaviors
// =============================================================================
function openCartDrawer() {
  dom.cartDrawer.classList.add('open');
  dom.cartOverlay.classList.add('active');
  document.body.classList.add('drawer-open');
  dom.cartDrawer.setAttribute('aria-hidden', 'false');
  dom.closeCartBtn.focus();
}

function closeCartDrawer() {
  dom.cartDrawer.classList.remove('open');
  dom.cartOverlay.classList.remove('active');
  document.body.classList.remove('drawer-open');
  dom.cartDrawer.setAttribute('aria-hidden', 'true');
  dom.cartToggleBtn.focus();
}

// =============================================================================
// Checkout Modal & Simulated Order Confirmation
// =============================================================================
function openCheckoutModal() {
  if (state.cart.length === 0) {
    showToast('Your cart is empty. Add items before checking out.', 'error');
    return;
  }

  // Close drawer first
  closeCartDrawer();

  // Populate Order Summary
  const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  dom.checkoutItemsCount.textContent = `${totalItems} item${totalItems === 1 ? '' : 's'}`;
  dom.checkoutFinalTotal.textContent = formatPrice(calculateTotal());

  dom.checkoutItemsPreview.innerHTML = '';
  state.cart.forEach(item => {
    const row = document.createElement('div');
    row.className = 'checkout-preview-item';
    row.innerHTML = `
      <span class="checkout-preview-title">${item.quantity}x ${escapeHtml(item.title)}</span>
      <strong>${formatPrice(item.price * item.quantity)}</strong>
    `;
    dom.checkoutItemsPreview.appendChild(row);
  });

  // Reset form errors
  clearCheckoutErrors();

  dom.checkoutModal.classList.remove('hidden');
  // Trigger transition
  requestAnimationFrame(() => {
    dom.checkoutModal.classList.add('active');
  });
  document.body.classList.add('modal-open');
  dom.checkoutModal.setAttribute('aria-hidden', 'false');
  dom.customerNameInput.focus();
}

function closeCheckoutModal() {
  dom.checkoutModal.classList.remove('active');
  document.body.classList.remove('modal-open');
  dom.checkoutModal.setAttribute('aria-hidden', 'true');
  setTimeout(() => {
    dom.checkoutModal.classList.add('hidden');
    clearCheckoutErrors();
  }, 250);
}

function clearCheckoutErrors() {
  dom.customerNameInput.classList.remove('is-invalid');
  dom.customerEmailInput.classList.remove('is-invalid');
  dom.nameError.closest('.form-group').classList.remove('has-error');
  dom.emailError.closest('.form-group').classList.remove('has-error');
}

// Handle Checkout Form Submission
function handleCheckoutSubmit(e) {
  e.preventDefault();

  if (state.cart.length === 0) {
    showToast('Your cart is empty. Please add items to checkout.', 'error');
    closeCheckoutModal();
    return;
  }

  const nameVal = dom.customerNameInput.value.trim();
  const emailVal = dom.customerEmailInput.value.trim();

  let isValid = true;
  clearCheckoutErrors();

  // Validate Name (minimum 2 characters)
  if (nameVal.length < 2) {
    dom.customerNameInput.classList.add('is-invalid');
    dom.nameError.closest('.form-group').classList.add('has-error');
    isValid = false;
  }

  // Validate Email (standard email regex pattern)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailVal)) {
    dom.customerEmailInput.classList.add('is-invalid');
    dom.emailError.closest('.form-group').classList.add('has-error');
    isValid = false;
  }

  if (!isValid) return;

  // Process Simulated Order
  const finalTotalAmount = formatPrice(calculateTotal());
  const orderRef = generateOrderReference();

  // Populate Confirmation Modal
  dom.confirmCustomerName.textContent = nameVal;
  dom.confirmCustomerEmail.textContent = emailVal;
  dom.confirmOrderRef.textContent = orderRef;
  dom.confirmOrderTotal.textContent = finalTotalAmount;

  // Clear Cart & LocalStorage
  state.cart = [];
  saveCartToLocalStorage();
  renderCart();

  // Reset form
  dom.checkoutForm.reset();

  // Close Checkout Modal & Open Confirmation Modal
  closeCheckoutModal();
  openConfirmationModal();
}

// Generate unique order reference (e.g. SE-849201)
function generateOrderReference() {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `SE-${randomNum}`;
}

function openConfirmationModal() {
  dom.confirmationModal.classList.remove('hidden');
  requestAnimationFrame(() => {
    dom.confirmationModal.classList.add('active');
  });
  document.body.classList.add('modal-open');
  dom.confirmationModal.setAttribute('aria-hidden', 'false');
  dom.continueShoppingBtn.focus();
}

function closeConfirmationModal() {
  dom.confirmationModal.classList.remove('active');
  document.body.classList.remove('modal-open');
  dom.confirmationModal.setAttribute('aria-hidden', 'true');
  setTimeout(() => {
    dom.confirmationModal.classList.add('hidden');
  }, 250);
}

// =============================================================================
// Toast Notification System
// =============================================================================
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `
      <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
  } else if (type === 'error') {
    iconSvg = `
      <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
    `;
  } else {
    iconSvg = `
      <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
    `;
  }

  toast.innerHTML = `
    ${iconSvg}
    <span class="toast-message">${escapeHtml(message)}</span>
  `;

  dom.toastContainer.appendChild(toast);

  // Auto remove after 3.2 seconds
  setTimeout(() => {
    toast.style.animation = 'toastFadeOut 0.3s forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3200);
}

// =============================================================================
// Event Listeners & Initialization
// =============================================================================
function setupEventListeners() {
  // 1. Theme Mode Toggle
  if (dom.themeToggleBtn) {
    dom.themeToggleBtn.addEventListener('click', toggleTheme);
  }

  // 2. Search Bar Input & Clear
  dom.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    if (state.searchQuery.length > 0) {
      dom.searchClearBtn.classList.remove('hidden');
    } else {
      dom.searchClearBtn.classList.add('hidden');
    }
    applyFilterAndRender();
  });

  dom.searchClearBtn.addEventListener('click', () => {
    dom.searchInput.value = '';
    state.searchQuery = '';
    dom.searchClearBtn.classList.add('hidden');
    dom.searchInput.focus();
    applyFilterAndRender();
  });

  // 3. Category Filter Buttons
  dom.categoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      dom.categoryButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedCategory = btn.getAttribute('data-category');
      applyFilterAndRender();
    });
  });

  // 4. Sort Select Dropdown
  dom.sortSelect.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    applyFilterAndRender();
  });

  // 5. Reset Filters Button in Empty State
  dom.resetFiltersBtn.addEventListener('click', () => {
    state.searchQuery = '';
    state.selectedCategory = 'all';
    dom.searchInput.value = '';
    dom.searchClearBtn.classList.add('hidden');
    dom.categoryButtons.forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-category') === 'all');
    });
    applyFilterAndRender();
  });

  // 6. Retry Button on API Error
  dom.retryBtn.addEventListener('click', () => {
    fetchProducts();
  });

  // 7. Cart Drawer Toggle Controls
  dom.cartToggleBtn.addEventListener('click', openCartDrawer);
  dom.closeCartBtn.addEventListener('click', closeCartDrawer);
  dom.cartOverlay.addEventListener('click', closeCartDrawer);
  dom.startShoppingBtn.addEventListener('click', closeCartDrawer);

  // 8. Wishlist Drawer Toggle Controls
  if (dom.wishlistToggleBtn) {
    dom.wishlistToggleBtn.addEventListener('click', openWishlistDrawer);
  }
  if (dom.closeWishlistBtn) {
    dom.closeWishlistBtn.addEventListener('click', closeWishlistDrawer);
  }
  if (dom.wishlistOverlay) {
    dom.wishlistOverlay.addEventListener('click', closeWishlistDrawer);
  }
  if (dom.wishlistExploreBtn) {
    dom.wishlistExploreBtn.addEventListener('click', closeWishlistDrawer);
  }
  if (dom.moveAllWishlistBtn) {
    dom.moveAllWishlistBtn.addEventListener('click', moveAllWishlistToCart);
  }

  // 9. Quick View Modal Controls
  if (dom.closeQuickviewBtn) {
    dom.closeQuickviewBtn.addEventListener('click', closeQuickView);
  }
  if (dom.quickviewModal) {
    dom.quickviewModal.addEventListener('click', (e) => {
      if (e.target === dom.quickviewModal) {
        closeQuickView();
      }
    });
  }
  if (dom.quickviewMinusBtn) {
    dom.quickviewMinusBtn.addEventListener('click', () => {
      if (state.quickViewQty > 1) {
        state.quickViewQty--;
        dom.quickviewQtyVal.textContent = state.quickViewQty;
      }
    });
  }
  if (dom.quickviewPlusBtn) {
    dom.quickviewPlusBtn.addEventListener('click', () => {
      if (state.quickViewQty < 99) {
        state.quickViewQty++;
        dom.quickviewQtyVal.textContent = state.quickViewQty;
      }
    });
  }
  if (dom.quickviewAddCartBtn) {
    dom.quickviewAddCartBtn.addEventListener('click', () => {
      if (state.quickViewProduct) {
        addToCart(state.quickViewProduct, state.quickViewQty);
        closeQuickView();
      }
    });
  }
  if (dom.quickviewWishlistBtn) {
    dom.quickviewWishlistBtn.addEventListener('click', () => {
      if (state.quickViewProduct) {
        toggleWishlist(state.quickViewProduct);
      }
    });
  }

  // 10. Checkout Trigger & Modal Controls
  dom.checkoutBtn.addEventListener('click', openCheckoutModal);
  dom.closeCheckoutBtn.addEventListener('click', closeCheckoutModal);
  dom.cancelCheckoutBtn.addEventListener('click', closeCheckoutModal);
  dom.checkoutForm.addEventListener('submit', handleCheckoutSubmit);

  // Close Checkout Modal on backdrop click
  dom.checkoutModal.addEventListener('click', (e) => {
    if (e.target === dom.checkoutModal) {
      closeCheckoutModal();
    }
  });

  // 11. Confirmation Modal Controls
  dom.continueShoppingBtn.addEventListener('click', closeConfirmationModal);
  dom.confirmationModal.addEventListener('click', (e) => {
    if (e.target === dom.confirmationModal) {
      closeConfirmationModal();
    }
  });

  // 12. Keyboard Accessibility: Close drawer and modals on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      if (dom.quickviewModal && !dom.quickviewModal.classList.contains('hidden') && dom.quickviewModal.classList.contains('active')) {
        closeQuickView();
      } else if (!dom.confirmationModal.classList.contains('hidden') && dom.confirmationModal.classList.contains('active')) {
        closeConfirmationModal();
      } else if (!dom.checkoutModal.classList.contains('hidden') && dom.checkoutModal.classList.contains('active')) {
        closeCheckoutModal();
      } else if (dom.wishlistDrawer && dom.wishlistDrawer.classList.contains('open')) {
        closeWishlistDrawer();
      } else if (dom.cartDrawer && dom.cartDrawer.classList.contains('open')) {
        closeCartDrawer();
      }
    }
  });
}

// =============================================================================
// App Startup Entrypoint
// =============================================================================
function initApp() {
  // 1. Initialize Color Theme
  initTheme();

  // 2. Setup all interaction listeners
  setupEventListeners();

  // 3. Load stored shopping cart and render initial cart badge/totals
  loadCartFromLocalStorage();
  renderCart();

  // 4. Load stored wishlist and render initial wishlist badge
  loadWishlistFromLocalStorage();
  renderWishlist();

  // 5. Fetch product catalog from FakeStoreAPI
  fetchProducts();
}

// Initialize on DOM Ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
