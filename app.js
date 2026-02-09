// Enhanced version with conversation context memory and routing
const CONFIG = {
  webhookUrl: "http://localhost:5678/webhook/bookstore-chat",
  enableMockResponses: false,
  enableContextMemory: true, // NEW: Enable conversation context
  maxContextMessages: 5, // Remember last 5 messages for context
  adminCredentials: {
    username: "admin",
    password: "admin123"
  },
  routes: {
    home: '/',
    chatbot: '/chatbot',
    admin: '/admin'
  }
};

// Session Management with Context
const sessionId = localStorage.getItem("chatSessionId") || crypto.randomUUID();
localStorage.setItem("chatSessionId", sessionId);

// Conversation Context Memory
const getConversationContext = () => {
  const logs = JSON.parse(localStorage.getItem("chatLogs") || "[]");
  return logs.slice(-CONFIG.maxContextMessages).map(log => ({
    role: log.role,
    message: log.text,
    timestamp: log.ts
  }));
};

// Authentication State
let isAuthenticated = localStorage.getItem("adminAuth") === "true";

// Routing System
const router = {
  currentRoute: window.location.pathname,
  
  navigate: function(route) {
    window.history.pushState({}, '', route);
    this.currentRoute = route;
    this.handleRoute(route);
  },
  
  handleRoute: function(route) {
    // Hide all tab panels
    tabPanels.forEach(panel => panel.classList.remove('active'));
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    switch(route) {
      case CONFIG.routes.chatbot:
        document.getElementById('chat').classList.add('active');
        document.querySelector('[data-tab="chat"]').classList.add('active');
        break;
      case CONFIG.routes.admin:
        document.getElementById('admin').classList.add('active');
        document.querySelector('[data-tab="admin"]').classList.add('active');
        handleAdminAccess();
        break;
      default:
        document.getElementById('chat').classList.add('active');
        const chatBtn = document.querySelector('[data-tab="chat"]');
        if (chatBtn) chatBtn.classList.add('active');
    }
  },
  
  init: function() {
    // Handle back/forward navigation
    window.addEventListener('popstate', () => {
      this.handleRoute(window.location.pathname);
    });
    
    // Handle initial route - default to chatbot
    const path = window.location.pathname;
    if (path === '/' || path === '') {
      this.navigate(CONFIG.routes.chatbot);
    } else {
      this.handleRoute(path);
    }
  }
};

// DOM Elements
const messageList = document.getElementById("messageList");
const typingIndicator = document.getElementById("typingIndicator");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const tabButtons = document.querySelectorAll(".tab-button");
const tabPanels = document.querySelectorAll(".tab-panel");
const loginModal = document.getElementById("loginModal");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const logoutBtn = document.getElementById("logoutBtn");
const adminContent = document.getElementById("adminContent");
const adminLocked = document.getElementById("adminLocked");

const booksTableBody = document.querySelector("#booksTable tbody");
const ordersTableBody = document.querySelector("#ordersTable tbody");
const logsTableBody = document.querySelector("#logsTable tbody");
const bookSearch = document.getElementById("bookSearch");
const orderSearch = document.getElementById("orderSearch");
const clearLogsButton = document.getElementById("clearLogs");
const totalBooksEl = document.getElementById("totalBooks");
const totalOrdersEl = document.getElementById("totalOrders");
const totalChatsEl = document.getElementById("totalChats");

let booksData = [];
let ordersData = [];

// Message Handling
const loadStoredMessages = () => {
  const stored = JSON.parse(localStorage.getItem("chatLogs") || "[]");
  stored.slice(1).forEach((entry) => renderMessage(entry));
};

const saveMessage = (entry) => {
  const stored = JSON.parse(localStorage.getItem("chatLogs") || "[]");
  stored.push(entry);
  localStorage.setItem("chatLogs", JSON.stringify(stored));
  updateStats();
};

const renderMessage = (entry) => {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${entry.role}`;

  if (entry.role === "bot") {
    const avatar = document.createElement("div");
    avatar.className = "bot-avatar";
    avatar.innerHTML = '<i class="fas fa-robot"></i>';
    messageDiv.appendChild(avatar);
  }

  const content = document.createElement("div");
  content.className = "message-content";
  
  // Format text with line breaks
  const formattedText = entry.text.replace(/\n/g, '<br>');
  content.innerHTML = formattedText;

  if (entry.meta) {
    const meta = document.createElement("span");
    meta.className = "meta";
    meta.textContent = entry.meta;
    content.appendChild(meta);
  }

  messageDiv.appendChild(content);
  messageList.appendChild(messageDiv);
  messageList.parentElement.scrollTop = messageList.parentElement.scrollHeight;
};

const setTyping = (isTyping) => {
  typingIndicator.classList.toggle("hidden", !isTyping);
  if (isTyping) {
    messageList.parentElement.scrollTop = messageList.parentElement.scrollHeight;
  }
};

const clearChat = () => {
  if (confirm("Clear all messages from this chat?")) {
    const welcomeMessage = document.querySelector(".welcome-message");
    messageList.innerHTML = "";
    if (welcomeMessage) {
      messageList.appendChild(welcomeMessage.cloneNode(true));
    }
    localStorage.removeItem("chatLogs");
    updateStats();
  }
};

const quickMessage = (message) => {
  chatInput.value = message;
  chatForm.dispatchEvent(new Event("submit"));
};

// Enhanced API Communication with Context
const postMessage = async (message) => {
  const context = CONFIG.enableContextMemory ? getConversationContext() : [];
  
  const payload = {
    message,
    sessionId,
    timestamp: new Date().toISOString(),
    context, // NEW: Send conversation history for context-aware responses
    contextEnabled: CONFIG.enableContextMemory
  };

  const response = await fetch(CONFIG.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Webhook request failed");
  }

  return response.json();
};

const getMockResponse = (message) => {
  const normalized = message.toLowerCase();
  const context = getConversationContext();
  
  // Context-aware mock responses
  if (normalized.includes("another") || normalized.includes("more")) {
    const lastBotMessage = context.filter(c => c.role === "bot").pop();
    if (lastBotMessage && lastBotMessage.message.includes("fiction")) {
      return { 
        reply: "Here are more fiction books: To Kill a Mockingbird, The Great Gatsby, and Animal Farm.", 
        intent: "book_genre_followup",
        contextUsed: true
      };
    }
  }
  
  if (normalized.includes("order")) {
    return { reply: "Your order #1003 has been shipped and will arrive tomorrow.", intent: "order_status" };
  }
  if (normalized.includes("fiction")) {
    return { reply: "Here are some popular fiction books: The Alchemist, Dune, and 1984.", intent: "book_genre" };
  }
  return { reply: "Thanks for your message! Our team will respond shortly.", intent: "fallback" };
};

// Chat Form Handler
chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = chatInput.value.trim();
  if (!message) return;

  const userEntry = {
    id: crypto.randomUUID(),
    role: "user",
    text: message,
    ts: new Date().toISOString(),
  };

  renderMessage(userEntry);
  saveMessage(userEntry);
  chatInput.value = "";
  setTyping(true);

  try {
    const data = CONFIG.enableMockResponses ? getMockResponse(message) : await postMessage(message);
    const replyText = data.reply || "Sorry, I could not process that request.";
    
    let metaText = data.intent ? `Intent: ${data.intent}` : null;
    if (data.contextUsed) {
      metaText = metaText ? `${metaText} • Context-aware response` : "Context-aware response";
    }

    const botEntry = {
      id: crypto.randomUUID(),
      role: "bot",
      text: replyText,
      meta: metaText,
      ts: new Date().toISOString(),
    };

    renderMessage(botEntry);
    saveMessage(botEntry);
  } catch (error) {
    console.error("Chat error:", error);
    const botEntry = {
      id: crypto.randomUUID(),
      role: "bot",
      text: "I couldn't reach the automation workflow. Please try again soon.",
      meta: "Error: webhook unavailable",
      ts: new Date().toISOString(),
    };

    renderMessage(botEntry);
    saveMessage(botEntry);
  } finally {
    setTyping(false);
    refreshLogs();
  }
});

// Admin Authentication
const showLoginModal = () => {
  loginModal.style.display = "flex";
  loginError.classList.add("hidden");
  setTimeout(() => document.getElementById("username").focus(), 100);
};

const closeLoginModal = () => {
  loginModal.style.display = "none";
  loginForm.reset();
  loginError.classList.add("hidden");
};

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (username === CONFIG.adminCredentials.username && 
      password === CONFIG.adminCredentials.password) {
    isAuthenticated = true;
    localStorage.setItem("adminAuth", "true");
    
    // Set admin username display
    const adminUsernameEl = document.getElementById("adminUsername");
    if (adminUsernameEl) {
      adminUsernameEl.textContent = username;
      adminUsernameEl.classList.remove("hidden");
    }
    
    if (logoutBtn) {
      logoutBtn.classList.remove("hidden");
    }
    
    closeLoginModal();
    updateAdminView();
    
    // Switch to admin tab
    const adminTabBtn = document.querySelector('[data-tab="admin"]');
    if (adminTabBtn) {
      adminTabBtn.click();
    }
    
    showNotification("Login successful!", "success");
  } else {
    loginError.textContent = "Invalid username or password";
    loginError.classList.remove("hidden");
  }
});

const logout = () => {
  if (confirm("Are you sure you want to logout?")) {
    isAuthenticated = false;
    localStorage.removeItem("adminAuth");
    
    const adminUsernameEl = document.getElementById("adminUsername");
    if (adminUsernameEl) {
      adminUsernameEl.textContent = "";
      adminUsernameEl.classList.add("hidden");
    }
    
    if (logoutBtn) {
      logoutBtn.classList.add("hidden");
    }
    
    updateAdminView();
    
    // Switch to chatbot tab
    const chatTabBtn = document.querySelector('[data-tab="chat"]');
    if (chatTabBtn) {
      chatTabBtn.click();
    }
    
    showNotification("Logged out successfully", "info");
  }
};

const updateAdminView = () => {
  console.log('updateAdminView called, isAuthenticated:', isAuthenticated);
  if (isAuthenticated) {
    if (adminContent) {
      adminContent.style.display = "block";
      console.log('Admin content shown');
    }
    if (adminLocked) {
      adminLocked.style.display = "none";
      console.log('Admin locked hidden');
    }
    if (logoutBtn) {
      logoutBtn.classList.remove("hidden");
    }
    loadDatasets();
    refreshLogs();
    updateStats();
  } else {
    if (adminContent) {
      adminContent.style.display = "none";
      console.log('Admin content hidden');
    }
    if (adminLocked) {
      adminLocked.style.display = "flex";
      console.log('Admin locked shown');
    }
    if (logoutBtn) {
      logoutBtn.classList.add("hidden");
    }
  }
};

const showNotification = (message, type = "info") => {
  console.log(`[${type.toUpperCase()}] ${message}`);
};

// CSV Parsing
const parseCsv = (csvText) => {
  const lines = csvText.trim().split(/\r?\n/);
  if (!lines.length) return [];
  const headers = lines[0].split(",").map((header) => header.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
    const record = {};
    headers.forEach((header, index) => {
      const raw = values[index] || "";
      record[header] = raw.replace(/^"|"$/g, "").trim();
    });
    return record;
  });
};

// Table Rendering
const renderBooks = (items) => {
  if (!booksTableBody) return;
  booksTableBody.innerHTML = "";
  items.forEach((book) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${book.title || "-"}</strong></td>
      <td>${book.author || "-"}</td>
      <td><span class="badge">${book.genre || "-"}</span></td>
      <td><strong>$${book.price || "-"}</strong></td>
      <td><span class="badge ${book.available === 'In Stock' ? 'success' : 'warning'}">${book.available || "-"}</span></td>
    `;
    booksTableBody.appendChild(row);
  });
};

const renderOrders = (items) => {
  if (!ordersTableBody) return;
  ordersTableBody.innerHTML = "";
  items.forEach((order) => {
    const row = document.createElement("tr");
    const statusClass = order.status === "Delivered" ? "success" : 
                       order.status === "Shipped" ? "info" : "warning";
    row.innerHTML = `
      <td><strong>#${order.order_id || order.id || "-"}</strong></td>
      <td>${order.customer_name || order.customer || "-"}</td>
      <td><span class="badge ${statusClass}">${order.status || "-"}</span></td>
      <td>${order.eta || order.delivery || "-"}</td>
      <td>${order.book || order.book_title || "-"}</td>
    `;
    ordersTableBody.appendChild(row);
  });
};

const refreshLogs = () => {
  if (!isAuthenticated || !logsTableBody) return;
  
  const stored = JSON.parse(localStorage.getItem("chatLogs") || "[]");
  logsTableBody.innerHTML = "";
  stored.slice().reverse().forEach((entry) => {
    const row = document.createElement("tr");
    const roleClass = entry.role === "user" ? "user-role" : "bot-role";
    row.innerHTML = `
      <td>${formatTimestamp(entry.ts)}</td>
      <td><span class="badge ${roleClass}">${entry.role}</span></td>
      <td>${entry.text}</td>
    `;
    logsTableBody.appendChild(row);
  });
};

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

const updateStats = () => {
  if (!isAuthenticated) return;
  
  if (totalBooksEl) totalBooksEl.textContent = booksData.length;
  if (totalOrdersEl) totalOrdersEl.textContent = ordersData.length;
  if (totalChatsEl) {
    const chatLogs = JSON.parse(localStorage.getItem("chatLogs") || "[]");
    totalChatsEl.textContent = chatLogs.filter(log => log.role === "user").length;
  }
  
  // Update average order value
  const avgOrderEl = document.getElementById("avgOrderValue");
  if (avgOrderEl && ordersData.length > 0) {
    // Mock calculation - in real app, you'd have price data
    const avgValue = (150 + Math.random() * 200).toFixed(2);
    avgOrderEl.textContent = `$${avgValue}`;
  }
  
  // Update trend indicators
  updateTrendIndicators();
  
  // Update analytics
  updateAnalytics();
};

// Analytics Functions
const updateTrendIndicators = () => {
  const trends = [
    { id: 'booksTrend', change: 15, positive: true },
    { id: 'ordersTrend', change: 28, positive: true },
    { id: 'chatsTrend', change: -5, positive: false }
  ];
  
  trends.forEach(trend => {
    const el = document.getElementById(trend.id);
    if (el) {
      el.className = `stat-trend ${trend.positive ? 'positive' : 'negative'}`;
      el.innerHTML = `<i class="fas fa-arrow-${trend.positive ? 'up' : 'down'}"></i> ${Math.abs(trend.change)}%`;
    }
  });
};

const updateAnalytics = () => {
  renderOrderStatusChart();
  renderChatActivityChart();
  renderTopBooks();
  renderRecentActivity();
  renderGenreDistribution();
};

// Order Status Chart
const renderOrderStatusChart = () => {
  const canvas = document.getElementById('orderStatusChart');
  const legendEl = document.getElementById('orderLegend');
  if (!canvas || !ordersData.length) return;
  
  const statusCounts = {};
  ordersData.forEach(order => {
    const status = order.status || 'Unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  
  const colors = {
    'Delivered': '#10b981',
    'Shipped': '#3b82f6',
    'Processing': '#f59e0b',
    'Pending': '#ef4444'
  };
  
  // Simple pie chart using CSS
  let legendHTML = '';
  Object.entries(statusCounts).forEach(([status, count]) => {
    const percentage = ((count / ordersData.length) * 100).toFixed(1);
    legendHTML += `
      <div class="legend-item">
        <div class="legend-color" style="background: ${colors[status] || '#94a3b8'}"></div>
        <span><strong>${status}</strong>: ${count} (${percentage}%)</span>
      </div>
    `;
  });
  
  if (legendEl) legendEl.innerHTML = legendHTML;
  
  // Draw simple chart on canvas
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY) - 20;
  
  let currentAngle = -0.5 * Math.PI;
  Object.entries(statusCounts).forEach(([status, count]) => {
    const sliceAngle = (count / ordersData.length) * 2 * Math.PI;
    
    ctx.fillStyle = colors[status] || '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.closePath();
    ctx.fill();
    
    currentAngle += sliceAngle;
  });
};

// Chat Activity Chart
const renderChatActivityChart = () => {
  const canvas = document.getElementById('chatActivityChart');
  if (!canvas) return;
  
  const chatLogs = JSON.parse(localStorage.getItem("chatLogs") || "[]");
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Generate data for last 7 days from actual chat logs
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const now = new Date();
  const data = days.map((day, index) => {
    const dayStart = new Date(now);
    dayStart.setDate(now.getDate() - (6 - index));
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    
    return chatLogs.filter(log => {
      const logDate = new Date(log.ts);
      return logDate >= dayStart && logDate <= dayEnd;
    }).length;
  });
  const maxValue = Math.max(...data, 1);
  
  // Draw bars
  const barWidth = width / (days.length * 2);
  const gap = barWidth * 0.5;
  
  data.forEach((value, index) => {
    const barHeight = (value / maxValue) * (height - 60);
    const x = (index * 2 + 1) * barWidth;
    const y = height - barHeight - 30;
    
    // Draw bar gradient
    const gradient = ctx.createLinearGradient(0, y, 0, height - 30);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth, barHeight);
    
    // Draw value
    ctx.fillStyle = '#1e293b';
    ctx.font = '12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(value, x + barWidth / 2, y - 5);
    
    // Draw day label
    ctx.fillStyle = '#64748b';
    ctx.fillText(days[index], x + barWidth / 2, height - 10);
  });
};

// Top Books
const renderTopBooks = () => {
  const container = document.getElementById('topBooksList');
  if (!container || !booksData.length) return;
  
  // Get top 5 books based on actual order data
  const bookOrderCounts = {};
  ordersData.forEach(order => {
    const bookId = order.book_id || order.title;
    bookOrderCounts[bookId] = (bookOrderCounts[bookId] || 0) + 1;
  });
  
  const topBooks = booksData
    .map(book => ({
      ...book,
      orderCount: bookOrderCounts[book.title] || bookOrderCounts[book.id] || 0
    }))
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 5);
  
  let html = '';
  topBooks.forEach((book, index) => {
    html += `
      <div class="top-item">
        <div class="top-item-rank">${index + 1}</div>
        <div class="top-item-info">
          <div class="top-item-name">${book.title || 'Unknown'}</div>
          <div class="top-item-meta">${book.author || 'Unknown Author'} • ${book.genre || 'Unknown'}</div>
        </div>
        <div class="top-item-value">${book.orderCount}</div>
      </div>
    `;
  });
  
  container.innerHTML = html || '<div class="loading-placeholder">No data available</div>';
};

// Recent Activity
const renderRecentActivity = () => { 
  const container = document.getElementById('activityTimeline');
  if (!container) return;
  
  const chatLogs = JSON.parse(localStorage.getItem("chatLogs") || "[]");
  const activities = [];
  
  // Get recent orders
  ordersData
    .sort((a, b) => new Date(b.order_date || 0) - new Date(a.order_date || 0))
    .slice(0, 3)
    .forEach(order => {
      activities.push({
        type: order.status === 'Delivered' || order.status === 'Shipped' ? 'order' : 'order',
        icon: order.status === 'Shipped' ? 'fas fa-shipping-fast' : 'fas fa-shopping-cart',
        title: order.status === 'Shipped' ? 'Order shipped' : 'Order placed',
        desc: `Order #${order.order_id} - ${order.title || 'Book order'}`,
        time: getRelativeTime(new Date(order.order_date)),
        timestamp: new Date(order.order_date)
      });
    });
  
  // Get recent chats
  chatLogs
    .slice(-5)
    .reverse()
    .slice(0, 2)
    .forEach(log => {
      if (log.role === 'user') {
        activities.push({
          type: 'chat',
          icon: 'fas fa-comments',
          title: 'Customer query',
          desc: log.text.substring(0, 50) + (log.text.length > 50 ? '...' : ''),
          time: getRelativeTime(new Date(log.ts)),
          timestamp: new Date(log.ts)
        });
      }
    });
  
  // Sort by timestamp
  activities.sort((a, b) => b.timestamp - a.timestamp);
  activities.splice(5); // Keep only top 5
  
  let html = '';
  if (activities.length === 0) {
    html = '<div class="loading-placeholder">No recent activity</div>';
  } else {
    activities.forEach(activity => {
      html += `
        <div class="activity-item">
          <div class="activity-icon ${activity.type}">
            <i class="${activity.icon}"></i>
          </div>
          <div class="activity-content">
            <div class="activity-title">${activity.title}</div>
            <div class="activity-description">${activity.desc}</div>
            <div class="activity-time">${activity.time}</div>
          </div>
        </div>
      `;
    });
  }
  
  container.innerHTML = html;
};

// Helper function for relative time
const getRelativeTime = (date) => {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

// Genre Distribution
const renderGenreDistribution = () => {
  const container = document.getElementById('genreBars');
  if (!container || !booksData.length) return;
  
  const genreCounts = {};
  booksData.forEach(book => {
    const genre = book.genre || 'Unknown';
    genreCounts[genre] = (genreCounts[genre] || 0) + 1;
  });
  
  const sortedGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  
  const maxCount = Math.max(...sortedGenres.map(g => g[1]));
  
  let html = '';
  sortedGenres.forEach(([genre, count]) => {
    const percentage = ((count / maxCount) * 100).toFixed(1);
    html += `
      <div class="genre-bar-item">
        <div class="genre-name">${genre}</div>
        <div class="genre-bar-container">
          <div class="genre-bar-fill" style="width: ${percentage}%"></div>
        </div>
        <div class="genre-count">${count}</div>
      </div>
    `;
  });
  
  container.innerHTML = html || '<div class="loading-placeholder">No data available</div>';
};

// Dataset Loading
const loadDatasets = async () => {
  try {
    const [booksResponse, ordersResponse] = await Promise.all([
      fetch("datasets/books.csv"),
      fetch("datasets/orders.csv"),
    ]);

    if (booksResponse.ok) {
      const text = await booksResponse.text();
      booksData = parseCsv(text);
      renderBooks(booksData);
    }

    if (ordersResponse.ok) {
      const text = await ordersResponse.text();
      ordersData = parseCsv(text);
      renderOrders(ordersData);
    }

    updateStats();
  } catch (error) {
    console.error("Error loading datasets:", error);
  }
};

// Search Functionality
if (bookSearch) {
  bookSearch.addEventListener("input", (event) => {
    const query = event.target.value.toLowerCase();
    const filtered = booksData.filter((book) => {
      return [book.title, book.author, book.genre]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(query));
    });
    renderBooks(filtered);
  });
}

if (orderSearch) {
  orderSearch.addEventListener("input", (event) => {
    const query = event.target.value.toLowerCase();
    const filtered = ordersData.filter((order) => {
      return [order.order_id, order.id, order.status, order.customer_name, order.customer]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(query));
    });
    renderOrders(filtered);
  });
}

if (clearLogsButton) {
  clearLogsButton.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear all chat logs?")) {
      localStorage.removeItem("chatLogs");
      refreshLogs();
      updateStats();
      showNotification("Chat logs cleared", "success");
    }
  });
}

// Tab Handling with Routing
const handleAdminAccess = () => {
  if (!isAuthenticated) {
    showLoginModal();
    return false;
  }
  updateAdminView();
  return true;
};

const bindTabs = () => {
  tabButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const targetTab = button.dataset.tab;
      console.log('Tab clicked:', targetTab, 'isAuthenticated:', isAuthenticated);
      
      // If clicking admin tab and not authenticated, show login modal
      if (targetTab === "admin" && !isAuthenticated) {
        console.log('Showing login modal for admin access');
        showLoginModal();
        return; // Don't switch tabs yet
      }
      
      // Switch tabs
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabPanels.forEach((panel) => panel.classList.remove("active"));
      button.classList.add("active");
      const targetPanel = document.getElementById(targetTab);
      if (targetPanel) {
        targetPanel.classList.add("active");
        console.log('Switched to tab:', targetTab);
      }
      
      // Update URL for tab navigation
      if (targetTab === 'admin') {
        router.navigate(CONFIG.routes.admin);
      } else if (targetTab === 'chat') {
        router.navigate(CONFIG.routes.chatbot);
      }
      
      // Load admin data if switching to admin
      if (targetTab === "admin" && isAuthenticated) {
        console.log('Loading admin data');
        updateAdminView();
      }
    });
  });
};

// Close modal on outside click
loginModal.addEventListener("click", (event) => {
  if (event.target === loginModal) {
    closeLoginModal();
  }
});

// Display session info in console for debugging
console.log(`%c═══════════════════════════════════════`, 'color: #6366f1; font-weight: bold');
console.log(`%cBookstore Chatbot - Session Info`, 'color: #6366f1; font-weight: bold; font-size: 14px');
console.log(`%c═══════════════════════════════════════`, 'color: #6366f1; font-weight: bold');
console.log(`Session ID: %c${sessionId}`, 'color: #10b981; font-weight: bold');
console.log(`Context Memory: %c${CONFIG.enableContextMemory ? 'ENABLED' : 'DISABLED'}`, 
  CONFIG.enableContextMemory ? 'color: #10b981; font-weight: bold' : 'color: #ef4444; font-weight: bold');
console.log(`%c═══════════════════════════════════════`, 'color: #6366f1; font-weight: bold');

// Initialize Application
const initializeApp = () => {
  // Bind logout button
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
  
  // Bind admin locked login button
  const adminLockedLoginBtn = document.getElementById("adminLockedLoginBtn");
  if (adminLockedLoginBtn) {
    adminLockedLoginBtn.addEventListener("click", () => {
      console.log('Admin locked login button clicked');
      showLoginModal();
    });
  }
  
  // Set username if already authenticated
  if (isAuthenticated) {
    const adminUsernameEl = document.getElementById("adminUsername");
    if (adminUsernameEl) {
      adminUsernameEl.textContent = `${CONFIG.adminCredentials.username}`;
      adminUsernameEl.classList.remove("hidden");
    }
    if (logoutBtn) {
      logoutBtn.classList.remove("hidden");
    }
  }
  
  // Initialize admin view
  updateAdminView();
  
  // Load chat messages
  loadStoredMessages();
  
  // Bind tabs
  bindTabs();
  
  // Initialize router
  router.init();
  
  // Focus chat input
  if (chatInput) chatInput.focus();
};

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Scroll to bottom button functionality
const chatMessagesContainer = document.querySelector('.chat-messages');
const scrollButton = document.createElement('button');
scrollButton.className = 'scroll-to-bottom';
scrollButton.innerHTML = '<i class="fas fa-arrow-down"></i>';
chatMessagesContainer.parentElement.appendChild(scrollButton);

chatMessagesContainer.addEventListener('scroll', () => {
    const { scrollTop, scrollHeight, clientHeight } = chatMessagesContainer;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    scrollButton.classList.toggle('visible', !isNearBottom);
});

scrollButton.addEventListener('click', () => {
    chatMessagesContainer.scrollTo({
        top: chatMessagesContainer.scrollHeight,
        behavior: 'smooth'
    });
});
