const ADMIN_USERNAME_HASH = 'ae1f1c62a33439394cfd1ecd3fc71b89177b9f599a5104d79e618c003f46e455';
const ADMIN_PASSWORD_HASH = '58f77511183255e2ad395d54ccee6605057778882981c123c8322eb6402664b5';

const STRIPE_CONFIG = {
  paymentLinkUrl: '',
  publishableKey: ''
};

const yearNode = document.getElementById('year');
if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

async function hashText(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function setAdminAuthenticated(isAuthenticated) {
  const loginScreen = document.getElementById('admin-login-screen');
  const dashboard = document.getElementById('admin-dashboard');

  if (!loginScreen || !dashboard) return;

  loginScreen.hidden = isAuthenticated;
  dashboard.hidden = !isAuthenticated;
}

function toggleResetPanel(show) {
  const panel = document.getElementById('forgot-password-panel');
  const contactStep = document.querySelector('.reset-contact-step');
  const status = document.getElementById('reset-status');
  const resetCodeBox = document.getElementById('reset-code-box');

  if (!panel) return;
  panel.hidden = !show;

  if (contactStep) {
    contactStep.hidden = !show;
  }

  if (resetCodeBox) {
    resetCodeBox.hidden = true;
  }

  if (status) {
    status.hidden = !show || !status.textContent;
  }
}

function showResetStatus(message, isError = false) {
  const status = document.getElementById('reset-status');
  if (!status) return;
  status.textContent = message;
  status.hidden = !message;
  status.style.color = isError ? '#b91c1c' : '#166534';
}

async function handleAdminLogin(event) {
  event.preventDefault();
  const usernameInput = document.getElementById('admin-username');
  const passwordInput = document.getElementById('admin-password');
  const errorText = document.getElementById('admin-login-error');

  if (!usernameInput || !passwordInput || !errorText) return;

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    errorText.textContent = 'Please enter both your username and password.';
    return;
  }

  const usernameHash = await hashText(username);
  const passwordHash = await hashText(password);

  if (usernameHash === ADMIN_USERNAME_HASH && passwordHash === ADMIN_PASSWORD_HASH) {
    sessionStorage.setItem('harborAdminAuthenticated', 'true');
    setAdminAuthenticated(true);
    return;
  }

  errorText.textContent = 'Invalid username or password.';
  passwordInput.value = '';
}

function attachForgotPasswordFlow() {
  const trigger = document.getElementById('forgot-password-trigger');
  const resetPanel = document.getElementById('forgot-password-panel');
  const sendResetButton = document.getElementById('send-reset-code');
  const verifyResetButton = document.getElementById('verify-reset-code');
  const resetCodeBox = document.getElementById('reset-code-box');

  if (trigger) {
    trigger.addEventListener('click', () => {
      if (!resetPanel) return;
      const shouldOpen = resetPanel.hidden;
      toggleResetPanel(shouldOpen);
      if (shouldOpen) {
        const contactInput = document.getElementById('reset-contact');
        if (contactInput) contactInput.value = '';
        const codeInput = document.getElementById('reset-code-input');
        if (codeInput) codeInput.value = '';
        if (resetCodeBox) resetCodeBox.hidden = true;
        showResetStatus('');
      }
    });
  }

  if (sendResetButton) {
    sendResetButton.addEventListener('click', () => {
      const contactInput = document.getElementById('reset-contact');
      const contact = contactInput?.value.trim();

      if (!contact) {
        showResetStatus('Please enter your WhatsApp number or email first.', true);
        return;
      }

      const code = String(Math.floor(100000 + Math.random() * 900000));
      sessionStorage.setItem('harborResetCode', code);
      sessionStorage.setItem('harborResetContact', contact);
      if (resetCodeBox) resetCodeBox.hidden = false;
      showResetStatus(`A 6-digit reset code has been sent to ${contact}. Use code: ${code}`);
    });
  }

  if (verifyResetButton) {
    verifyResetButton.addEventListener('click', () => {
      const enteredCode = document.getElementById('reset-code-input')?.value.trim();
      const savedCode = sessionStorage.getItem('harborResetCode');

      if (!savedCode || !enteredCode) {
        showResetStatus('Please enter the reset code sent to you.', true);
        return;
      }

      if (enteredCode === savedCode) {
        const usernameInput = document.getElementById('admin-username');
        const passwordInput = document.getElementById('admin-password');
        if (usernameInput) usernameInput.value = 'gabzy';
        if (passwordInput) passwordInput.value = 'gabrielnortey';
        showResetStatus('Your reset code is valid. The admin credentials have been restored.');
        if (resetPanel) resetPanel.hidden = true;
      } else {
        showResetStatus('The code is incorrect. Please try again.', true);
      }
    });
  }
}

function attachFieldToggle(inputId, toggleSelector, labels) {
  const input = document.getElementById(inputId);
  const toggle = document.querySelector(toggleSelector);

  if (!input || !toggle) return;

  toggle.addEventListener('click', () => {
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    const nextLabel = isHidden ? labels.hide : labels.show;
    toggle.setAttribute('aria-label', nextLabel);
    toggle.setAttribute('aria-pressed', String(isHidden));
    toggle.title = nextLabel;
  });
}

function attachPasswordToggle() {
  attachFieldToggle('admin-username', '.username-toggle', {
    show: 'Show username',
    hide: 'Hide username'
  });

  attachFieldToggle('admin-password', '.password-toggle', {
    show: 'Show password',
    hide: 'Hide password'
  });
}

function attachAdminAuth() {
  const loginForm = document.getElementById('admin-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleAdminLogin);
  }

  attachPasswordToggle();

  const logoutButton = document.getElementById('logout-admin');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      sessionStorage.removeItem('harborAdminAuthenticated');
      setAdminAuthenticated(false);
      const usernameInput = document.getElementById('admin-username');
      if (usernameInput) usernameInput.value = '';
      const passwordInput = document.getElementById('admin-password');
      if (passwordInput) passwordInput.value = '';
      const errorText = document.getElementById('admin-login-error');
      if (errorText) errorText.textContent = '';
      showResetStatus('');
    });
  }

  attachForgotPasswordFlow();

  sessionStorage.removeItem('harborAdminAuthenticated');
  setAdminAuthenticated(false);
}

const STORAGE_KEYS = {
  properties: 'harborProperties',
  bookings: 'harborBookings',
  soldHomes: 'harborSoldHomes'
};

const defaultProperties = [
  {
    id: 'accra-villa',
    title: 'Ocean Crest Villa',
    price: 'GH₵ 1,240,000',
    status: 'For Sale',
    label: 'Featured',
    address: '245 Ocean View Drive, Accra',
    meta: '3 Beds • 2 Baths • 2,150 Sq Ft',
    bedrooms: 3,
    bathrooms: 2,
    sqft: '2,150 Sq Ft',
    description:
      'A serene coastal-style villa with panoramic city views, open-plan living, and a private outdoor lounge designed for elevated Ghanaian living.',
    specs: ['3 Bedrooms', '2 Bathrooms', '2,150 Sq Ft', 'Private Parking', 'Garden Patio', 'Smart Home Features'],
    roomHighlights: ['Bedrooms: 3 spacious suites', 'Living Room: Open-plan lounge with skyline views', 'Bathrooms: 2 modern en-suite baths', 'Balcony: Private outdoor terrace'],
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    id: 'kumasi-home',
    title: 'Cedar Grove Residence',
    price: 'GH₵ 860,000',
    status: 'For Sale',
    label: 'New',
    address: '18 Cedar Grove Lane, Kumasi',
    meta: '4 Beds • 3 Baths • 2,640 Sq Ft',
    bedrooms: 4,
    bathrooms: 3,
    sqft: '2,640 Sq Ft',
    description:
      'Bright and family-focused, this residence combines generous living spaces, premium interiors, and a beautiful landscaped garden in a quiet neighborhood.',
    specs: ['4 Bedrooms', '3 Bathrooms', '2,640 Sq Ft', 'Family Lounge', 'Covered Parking', 'High Ceilings'],
    roomHighlights: ['Bedrooms: 4 family-sized bedrooms', 'Living Room: Bright central lounge with natural light', 'Bathrooms: 3 elegant ensuite and guest baths', 'Balcony: Covered veranda overlooking the garden'],
    image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1800&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    id: 'tema-apartment',
    title: 'Harbor Light Apartment',
    price: 'GH₵ 2,980 / mo',
    status: 'For Rent',
    label: 'Hot Deal',
    address: '771 Park Avenue, Tema',
    meta: '2 Beds • 2 Baths • 1,420 Sq Ft',
    bedrooms: 2,
    bathrooms: 2,
    sqft: '1,420 Sq Ft',
    description:
      'A modern rental home with airy interiors, high-quality finishes, and convenient access to the city’s commercial and leisure hubs.',
    specs: ['2 Bedrooms', '2 Bathrooms', '1,420 Sq Ft', 'Balcony', '24/7 Security', 'Furnished Option'],
    roomHighlights: ['Bedrooms: 2 comfortable bedrooms', 'Living Room: Open-concept lounge with city views', 'Bathrooms: 2 sleek contemporary baths', 'Balcony: Outdoor seating with sunset views'],
    image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    id: 'labone-townhouse',
    title: 'Labone Terrace Townhouse',
    price: 'GH₵ 1,540,000',
    status: 'For Sale',
    label: 'Premier',
    address: '14 Prestige Lane, Labone, Accra',
    meta: '5 Beds • 4 Baths • 3,120 Sq Ft',
    bedrooms: 5,
    bathrooms: 4,
    sqft: '3,120 Sq Ft',
    description:
      'A beautifully designed townhouse in one of Accra’s most desirable neighborhoods, offering generous family space, private parking, and elevated interior finishes.',
    specs: ['5 Bedrooms', '4 Bathrooms', '3,120 Sq Ft', 'Private Garage', 'Garden Deck', 'Smart Security'],
    roomHighlights: ['Bedrooms: 5 large family rooms', 'Living Room: Double-height lounge with natural light', 'Bathrooms: 4 contemporary baths', 'Outdoor: Covered terrace and landscaped garden'],
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    id: 'east-legon-villa',
    title: 'East Legon Signature Villa',
    price: 'GH₵ 2,700,000',
    status: 'For Sale',
    label: 'Luxury',
    address: '88 Westwood Avenue, East Legon',
    meta: '4 Beds • 3 Baths • 2,920 Sq Ft',
    bedrooms: 4,
    bathrooms: 3,
    sqft: '2,920 Sq Ft',
    description:
      'This luxury residence captures the balance of modern comfort and refined warmth, with expansive interiors, a curated palette, and a private lounge area.',
    specs: ['4 Bedrooms', '3 Bathrooms', '2,920 Sq Ft', 'Infinity Pool', 'Guest Suite', 'Cinema Room'],
    roomHighlights: ['Bedrooms: 4 elegant sleeping suites', 'Living Room: Spacious lounge with courtyard views', 'Bathrooms: 3 spa-inspired baths', 'Outdoor: Private pool and sun deck'],
    image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    id: 'teshie-apartment',
    title: 'Teshie Coastal Apartment',
    price: 'GH₵ 3,450 / mo',
    status: 'For Rent',
    label: 'New',
    address: '102 Seaside Road, Teshie',
    meta: '3 Beds • 2 Baths • 1,860 Sq Ft',
    bedrooms: 3,
    bathrooms: 2,
    sqft: '1,860 Sq Ft',
    description:
      'A breezy apartment with soft coastal finishes, large windows, and easy access to shopping, schools, and the city’s popular seaside attractions.',
    specs: ['3 Bedrooms', '2 Bathrooms', '1,860 Sq Ft', 'Sea View', 'Kitchen Island', 'Backup Power'],
    roomHighlights: ['Bedrooms: 3 bright bedrooms with storage', 'Living Room: Light-filled family lounge', 'Bathrooms: 2 modern baths', 'Outdoor: Terrace with ocean breeze'],
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'
    ]
  }
];

const defaultBookings = [
  {
    name: 'Maya A.',
    phone: '+233 20 111 2222',
    email: 'maya@example.com',
    property: 'Ocean Crest Villa',
    type: 'Viewing',
    status: 'Confirmed'
  },
  {
    name: 'Kwame O.',
    phone: '+233 24 555 7788',
    email: 'kwame@example.com',
    property: 'Cedar Grove Residence',
    type: 'Purchase',
    status: 'Pending'
  },
  {
    name: 'Ruth E.',
    phone: '+233 27 444 9001',
    email: 'ruth@example.com',
    property: 'Harbor Light Apartment',
    type: 'Rental Tour',
    status: 'Confirmed'
  }
];

const defaultSoldHomes = [
  {
    buyerName: 'Nadia M.',
    phone: '+233 50 987 6543',
    email: 'nadia@example.com',
    property: 'Ocean Crest Villa',
    price: 'GH₵ 1,240,000',
    closed: '2026-09-11'
  },
  {
    buyerName: 'Joseph T.',
    phone: '+233 20 774 6621',
    email: 'joseph@example.com',
    property: 'Cedar Grove Residence',
    price: 'GH₵ 860,000',
    closed: '2026-09-04'
  }
];

function readStorageValue(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    console.warn(`Unable to read ${key}:`, error);
    return fallback;
  }
}

function mergeProperties(storedProperties) {
  const merged = [...defaultProperties];

  storedProperties.forEach((property) => {
    const exists = merged.some((item) => item.id === property.id || item.title === property.title);
    if (!exists) {
      merged.push(property);
    }
  });

  return merged;
}

const appState = {
  properties: mergeProperties(readStorageValue(STORAGE_KEYS.properties, [])),
  bookings: readStorageValue(STORAGE_KEYS.bookings, defaultBookings),
  soldHomes: readStorageValue(STORAGE_KEYS.soldHomes, defaultSoldHomes)
};

function saveState() {
  localStorage.setItem(STORAGE_KEYS.properties, JSON.stringify(appState.properties));
  localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(appState.bookings));
  localStorage.setItem(STORAGE_KEYS.soldHomes, JSON.stringify(appState.soldHomes));
}

function getPropertyById(id) {
  return appState.properties.find((property) => property.id === id);
}

function renderPropertyListings() {
  const propertyGrid = document.querySelector('.property-grid');
  if (!propertyGrid) return;

  propertyGrid.innerHTML = appState.properties
    .map(
      (property) => `
        <article class="property-card">
          <div class="property-image" style="background-image: url('${property.image}')">
            <span class="badge ${property.label === 'Hot Deal' ? 'hot' : ''}">${property.label}</span>
            <button class="save-btn" aria-label="Save listing">♥</button>
          </div>
          <div class="property-content">
            <div class="price-row">
              <h3>${property.price}</h3>
              <span class="status ${property.status === 'For Rent' ? 'rent' : ''}">${property.status}</span>
            </div>
            <p class="address">${property.address}</p>
            <div class="stats">
              <span>${property.bedrooms} Beds</span>
              <span>${property.bathrooms} Baths</span>
              <span>${property.sqft}</span>
            </div>
            <button class="text-btn view-details" data-house="${property.id}">View Details</button>
          </div>
        </article>
      `
    )
    .join('');

  document.querySelectorAll('.view-details').forEach((button) => {
    button.addEventListener('click', () => {
      renderHouseDetail(button.dataset.house);
    });
  });
}

const detailPanel = document.getElementById('property-detail-panel');
const detailImage = document.getElementById('detail-image');
const detailStatus = document.getElementById('detail-status');
const detailTitle = document.getElementById('detail-title');
const detailAddress = document.getElementById('detail-address');
const detailPrice = document.getElementById('detail-price');
const detailMeta = document.getElementById('detail-meta');
const detailDescription = document.getElementById('detail-description');
const detailSpecs = document.getElementById('detail-specs');
const detailRoomHighlights = document.getElementById('detail-room-highlights');
const detailClose = document.querySelector('.detail-close');
const galleryPrev = document.querySelector('.gallery-prev');
const galleryNext = document.querySelector('.gallery-next');

let galleryState = {
  houseKey: null,
  index: 0
};

function updatePurchaseForm(property) {
  const purchaseForm = document.getElementById('purchase-form');
  if (!purchaseForm) return;

  purchaseForm.dataset.propertyId = property.id;

  const checkoutPrice = purchaseForm.querySelector('.checkout-price');
  const paymentAmount = purchaseForm.querySelector('.payment-amount');
  if (checkoutPrice) checkoutPrice.textContent = property.price;

  if (paymentAmount) {
    const numericValue = Number(String(property.price).replace(/[^0-9.]/g, '')) || 0;
    const depositValue = property.status === 'For Rent' ? Math.round(numericValue * 0.2) : Math.round(numericValue * 0.25);
    paymentAmount.value = String(Math.max(1, depositValue));
    paymentAmount.setAttribute('max', String(Math.max(numericValue, 1)));
  }
}

function renderHouseDetail(houseKey) {
  const property = getPropertyById(houseKey);
  if (!property || !detailPanel) return;

  galleryState.houseKey = houseKey;
  galleryState.index = 0;

  detailStatus.textContent = property.status;
  detailTitle.textContent = property.title;
  detailAddress.textContent = property.address;
  detailPrice.textContent = property.price;
  detailMeta.textContent = `${property.bedrooms} Beds • ${property.bathrooms} Baths • ${property.sqft}`;
  detailDescription.textContent = property.description;

  detailSpecs.innerHTML = property.specs.map((spec) => `<li>${spec}</li>`).join('');
  detailRoomHighlights.innerHTML = property.roomHighlights.map((item) => `<li>${item}</li>`).join('');
  updatePurchaseForm(property);
  updateGalleryImage();

  detailPanel.hidden = false;
  detailPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateGalleryImage() {
  const property = getPropertyById(galleryState.houseKey);
  if (!property || !detailImage) return;

  detailImage.src = property.images[galleryState.index];
  detailImage.alt = `${property.title} gallery image ${galleryState.index + 1}`;
}

function nextGalleryImage() {
  if (!galleryState.houseKey) return;
  const property = getPropertyById(galleryState.houseKey);
  if (!property) return;

  galleryState.index = (galleryState.index + 1) % property.images.length;
  updateGalleryImage();
}

function prevGalleryImage() {
  if (!galleryState.houseKey) return;
  const property = getPropertyById(galleryState.houseKey);
  if (!property) return;

  galleryState.index = (galleryState.index - 1 + property.images.length) % property.images.length;
  updateGalleryImage();
}

if (detailClose) {
  detailClose.addEventListener('click', () => {
    if (detailPanel) detailPanel.hidden = true;
  });
}

if (galleryPrev) {
  galleryPrev.addEventListener('click', prevGalleryImage);
}

if (galleryNext) {
  galleryNext.addEventListener('click', nextGalleryImage);
}

function renderAdminDashboard() {
  const listingsCount = document.getElementById('stat-listings');
  const bookingsCount = document.getElementById('stat-bookings');
  const soldCount = document.getElementById('stat-sold');
  const leadsCount = document.getElementById('stat-leads');

  if (listingsCount) listingsCount.textContent = String(appState.properties.length);
  if (bookingsCount) bookingsCount.textContent = String(appState.bookings.length);
  if (soldCount) soldCount.textContent = String(appState.soldHomes.length);
  if (leadsCount) leadsCount.textContent = String(appState.bookings.length + appState.soldHomes.length);

  const recentTable = document.getElementById('recent-bookings-body');
  if (recentTable) {
    recentTable.innerHTML = appState.bookings
      .slice(0, 4)
      .map(
        (booking) => `
          <tr>
            <td>${booking.name}</td>
            <td>${booking.email}<br>${booking.phone}</td>
            <td>${booking.property}</td>
            <td><span class="status-pill ${booking.status === 'Confirmed' ? 'ok' : 'pending'}">${booking.status}</span></td>
          </tr>
        `
      )
      .join('');
  }

  const bookingsTable = document.getElementById('bookings-body');
  if (bookingsTable) {
    bookingsTable.innerHTML = appState.bookings
      .map(
        (booking) => `
          <tr>
            <td>${booking.name}</td>
            <td>${booking.phone}</td>
            <td>${booking.email}</td>
            <td>${booking.property}</td>
            <td>${booking.type}</td>
            <td><span class="status-pill ${booking.status === 'Confirmed' ? 'ok' : 'pending'}">${booking.status}</span></td>
          </tr>
        `
      )
      .join('');
  }

  const soldTable = document.getElementById('sold-homes-body');
  if (soldTable) {
    soldTable.innerHTML = appState.soldHomes
      .map(
        (home) => `
          <tr>
            <td>${home.buyerName}</td>
            <td>${home.phone}</td>
            <td>${home.email}</td>
            <td>${home.property}</td>
            <td>${home.price}</td>
            <td>${home.closed}</td>
          </tr>
        `
      )
      .join('');
  }

  const removeTable = document.getElementById('remove-property-body');
  if (removeTable) {
    removeTable.innerHTML = appState.properties
      .map(
        (property) => `
          <tr>
            <td>${property.title}</td>
            <td>${property.address}</td>
            <td><span class="status-pill ${property.status === 'For Rent' ? 'pending' : 'ok'}">${property.status}</span></td>
            <td><button type="button" class="remove-property-btn" data-property-id="${property.id}">Remove</button></td>
          </tr>
        `
      )
      .join('');

    document.querySelectorAll('.remove-property-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const propertyId = button.dataset.propertyId;
        appState.properties = appState.properties.filter((property) => property.id !== propertyId);
        saveState();
        renderPropertyListings();
        renderAdminDashboard();
      });
    });
  }
}

function activateAdminTab(tabKey) {
  const tabs = document.querySelectorAll('.admin-tab');
  const panels = document.querySelectorAll('.admin-panel');
  tabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.adminTab === tabKey);
  });
  panels.forEach((panel) => {
    panel.classList.toggle('active', panel.dataset.panel === tabKey);
  });

  if (tabKey && typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    url.hash = tabKey;
    window.history.replaceState(null, '', url);
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!(file instanceof File) || file.size === 0) {
      resolve('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read selected image.'));
    reader.readAsDataURL(file);
  });
}

function attachAdminControls() {
  const tabs = document.querySelectorAll('.admin-tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => activateAdminTab(tab.dataset.adminTab));
  });

  const panelKey = window.location.hash ? window.location.hash.replace('#', '') : 'overview';
  if (document.querySelector('[data-page="admin"]')) {
    activateAdminTab(panelKey);
  }

  const propertyForm = document.getElementById('add-property-form');
  if (propertyForm) {
    propertyForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(propertyForm);
      const statusElement = document.getElementById('property-form-status');

      const externalImage = formData.get('imageUrl')?.toString().trim();
      const fileInput = formData.get('imageFile');
      let uploadedImage = '';

      try {
        uploadedImage = fileInput && fileInput instanceof File && fileInput.size > 0 ? await readFileAsDataUrl(fileInput) : '';
      } catch (error) {
        if (statusElement) {
          statusElement.textContent = 'Could not upload the selected image. Please try again.';
        }
        return;
      }

      const primaryImage = uploadedImage || externalImage || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80';
      const galleryImages = [
        primaryImage,
        externalImage || 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80'
      ];

      const newProperty = {
        id: String(Date.now()),
        title: formData.get('title').toString().trim(),
        price: formData.get('price').toString().trim(),
        status: formData.get('status').toString(),
        label: formData.get('status') === 'For Rent' ? 'New' : 'Featured',
        address: formData.get('location').toString().trim(),
        meta: `${formData.get('bedrooms')} Beds • ${formData.get('bathrooms')} Baths • ${formData.get('sqft')}`,
        bedrooms: Number(formData.get('bedrooms')) || 1,
        bathrooms: Number(formData.get('bathrooms')) || 1,
        sqft: formData.get('sqft').toString().trim(),
        description: formData.get('description').toString().trim(),
        specs: [
          `${formData.get('bedrooms')} Bedrooms`,
          `${formData.get('bathrooms')} Bathrooms`,
          formData.get('sqft').toString().trim(),
          'Private Parking',
          'Luxury Finish',
          'Family Friendly'
        ],
        roomHighlights: [
          `Bedrooms: ${formData.get('bedrooms')} comfortable rooms`,
          'Living Room: Bright and elegant open-plan space',
          `Bathrooms: ${formData.get('bathrooms')} modern bathrooms`,
          'Outdoor: Private relaxation area'
        ],
        image: primaryImage,
        images: galleryImages
      };

      appState.properties.unshift(newProperty);
      saveState();
      renderPropertyListings();
      renderAdminDashboard();
      propertyForm.reset();

      if (statusElement) {
        statusElement.textContent = 'Property added successfully.';
      }
    });
  }
}

const hero = document.querySelector('.hero');
if (hero) {
  let currentSlide = 0;
  const slideInterval = 4200;
  const backgrounds = [
    'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1800&q=80',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1800&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1800&q=80',
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1800&q=80',
    'https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=1800&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=80'
  ];

  const setSlide = (index) => {
    currentSlide = (index + backgrounds.length) % backgrounds.length;
    hero.classList.toggle('is-2', currentSlide % 2 === 1);
    hero.style.setProperty('--slide-1', `url('${backgrounds[(currentSlide + 1) % backgrounds.length]}')`);
    hero.style.setProperty('--slide-2', `url('${backgrounds[currentSlide]}')`);
    hero.style.backgroundImage = `url('${backgrounds[currentSlide]}')`;
  };

  const nextBtn = document.querySelector('.next-btn');
  const prevBtn = document.querySelector('.prev-btn');

  if (nextBtn) {
    nextBtn.addEventListener('click', () => setSlide(currentSlide + 1));
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => setSlide(currentSlide - 1));
  }

  let intervalId = setInterval(() => setSlide(currentSlide + 1), slideInterval);

  hero.addEventListener('mouseenter', () => clearInterval(intervalId));
  hero.addEventListener('mouseleave', () => {
    intervalId = setInterval(() => setSlide(currentSlide + 1), slideInterval);
  });

  setSlide(0);
}

const tabs = document.querySelectorAll('.tab');
tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((item) => {
      item.classList.remove('active');
      item.setAttribute('aria-selected', 'false');
    });

    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
  });
});

function addLeadBooking(form) {
  const name = form.querySelector('input[placeholder="Your name"]')?.value?.trim();
  const email = form.querySelector('input[type="email"]')?.value?.trim();
  const phone = form.querySelector('input[placeholder*="phone"]')?.value?.trim() || 'Not provided';

  if (!name || !email) return;

  appState.bookings.unshift({
    name,
    phone,
    email,
    property: 'General property consultation',
    type: 'Consultation',
    status: 'New lead'
  });
  saveState();
  renderAdminDashboard();

  const button = form.querySelector('button[type="submit"]');
  if (button) {
    const original = button.textContent;
    button.textContent = 'Booked';
    button.disabled = true;
    setTimeout(() => {
      button.textContent = original;
      button.disabled = false;
      form.reset();
    }, 1800);
  }
}

function handlePropertySearch(form) {
  const locationInput = form.querySelector('input[type="text"]');
  const typeSelect = form.querySelector('select');
  const priceSelect = form.querySelectorAll('select')[1];
  const searchText = (locationInput?.value || '').trim().toLowerCase();
  const typeText = (typeSelect?.value || '').toLowerCase();
  const priceText = (priceSelect?.value || '').toLowerCase();

  const query = searchText || 'accra';
  const matches = appState.properties.filter((property) => {
    const haystack = `${property.title} ${property.address} ${property.meta}`.toLowerCase();
    const locationMatch = haystack.includes(query);
    const typeMatch = !typeText || typeText === 'home' || typeText === 'any' ? true : property.title.toLowerCase().includes(typeText) || property.address.toLowerCase().includes(typeText) || property.meta.toLowerCase().includes(typeText) || property.status.toLowerCase().includes(typeText);

    let priceMatch = true;
    if (priceText && priceText.includes('500k')) {
      priceMatch = Number(property.price.replace(/[^0-9.]/g, '')) <= 500000;
    } else if (priceText && priceText.includes('1m')) {
      priceMatch = Number(property.price.replace(/[^0-9.]/g, '')) >= 500000 && Number(property.price.replace(/[^0-9.]/g, '')) <= 1000000;
    } else if (priceText && priceText.includes('2m')) {
      priceMatch = Number(property.price.replace(/[^0-9.]/g, '')) >= 1000000 && Number(property.price.replace(/[^0-9.]/g, '')) <= 2000000;
    } else if (priceText && priceText.includes('5m')) {
      priceMatch = Number(property.price.replace(/[^0-9.]/g, '')) >= 2000000;
    }

    return locationMatch && typeMatch && priceMatch;
  });

  const selectedProperty = matches[0] || appState.properties[0];

  if (selectedProperty) {
    renderHouseDetail(selectedProperty.id);
    const detailPanel = document.getElementById('property-detail-panel');
    if (detailPanel) {
      detailPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

function notifyAdminViaWhatsApp(property, buyerName, phone, email, paymentPlan, depositAmount) {
  const adminPhone = '233209755466';
  const message = encodeURIComponent(
    `New property purchase request:\nCustomer: ${buyerName}\nPhone: ${phone}\nEmail: ${email}\nProperty: ${property.title}\nPrice: ${property.price}\nPayment plan: ${paymentPlan}\nDeposit: GH₵ ${depositAmount}\nPlease follow up with the buyer.`
  );

  const whatsappUrl = `https://wa.me/${adminPhone}?text=${message}`;
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
}

function handlePurchaseSubmission(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const propertyId = form.dataset.propertyId;
  const property = propertyId ? getPropertyById(propertyId) : null;
  const statusText = form.querySelector('.purchase-status');

  if (!property) {
    if (statusText) {
      statusText.textContent = 'Please choose a property before payment.';
      statusText.style.color = '#b91c1c';
    }
    return;
  }

  const name = form.querySelector('input[name="buyerName"]')?.value.trim();
  const email = form.querySelector('input[name="buyerEmail"]')?.value.trim();
  const phone = form.querySelector('input[name="buyerPhone"]')?.value.trim();
  const paymentPlan = form.querySelector('.payment-plan')?.value;
  const depositAmount = Number(form.querySelector('.payment-amount')?.value || 0);
  const cardNumber = form.querySelector('input[name="cardNumber"]')?.value.replace(/\s+/g, '');

  if (!name || !email || !phone || cardNumber?.length < 12 || !depositAmount) {
    if (statusText) {
      statusText.textContent = 'Please complete all payment details before continuing.';
      statusText.style.color = '#b91c1c';
    }
    return;
  }

  notifyAdminViaWhatsApp(property, name, phone, email, paymentPlan, depositAmount);

  appState.bookings.unshift({
    name,
    phone,
    email,
    property: property.title,
    type: 'Purchase',
    status: 'Paid'
  });
  saveState();
  renderAdminDashboard();

  if (STRIPE_CONFIG.paymentLinkUrl) {
    if (statusText) {
      statusText.textContent = 'Redirecting to secure Stripe checkout...';
      statusText.style.color = '#166534';
    }
    window.location.href = STRIPE_CONFIG.paymentLinkUrl;
    return;
  }

  if (statusText) {
    statusText.textContent = `Demo payment success: ${name}, your reservation for ${property.title} has been noted. Add a Stripe Payment Link to enable real online payments.`;
    statusText.style.color = '#166534';
  }

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.textContent = 'Ready for Stripe';
    submitButton.disabled = true;
  }
}

const forms = document.querySelectorAll('form');
forms.forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (form.id === 'purchase-form') {
      handlePurchaseSubmission(event);
      return;
    }

    if (form.id === 'add-property-form') {
      return;
    }

    if (form.classList.contains('search-form')) {
      handlePropertySearch(form);
      return;
    }

    if (form.classList.contains('cta-form')) {
      addLeadBooking(form);
    }

    const button = form.querySelector('button[type="submit"]');
    if (button) {
      const original = button.textContent;
      button.textContent = 'Submitted';
      button.disabled = true;
      setTimeout(() => {
        button.textContent = original;
        button.disabled = false;
        form.reset();
      }, 1600);
    }
  });
});

renderPropertyListings();
renderAdminDashboard();
attachAdminControls();
attachAdminAuth();
