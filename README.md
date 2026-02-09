# 📚 Bookstore Chatbot - Complete Setup Guide

A beautiful, intelligent bookstore chatbot application with admin analytics dashboard, built with vanilla JavaScript, CSS, and n8n workflow automation.

## ✨ Features

### 🤖 Chatbot
- Interactive AI-powered chatbot for bookstore inquiries
- Conversation context memory (remembers last 5 messages)
- Real-time responses with typing indicators
- Session management with localStorage
- Beautiful gradient UI with animations

### 📊 Admin Dashboard
- **Real-time Analytics**: Order status distribution, chat activity trends
- **Top Books**: Track best-selling books based on actual order data
- **Recent Activity Timeline**: View latest orders and customer queries
- **Genre Distribution**: Visual breakdown of book genres
- **Statistics Cards**: Total books, orders, chats, and revenue with trend indicators

### 🎨 User Interface
- Modern gradient design (Purple/Blue theme)
- Smooth animations and transitions
- Responsive layout for all devices
- Client-side routing (SPA experience)
- Font Awesome icons integration

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have one of the following installed:

- **Python 3.x** (Recommended) - [Download](https://www.python.org/downloads/)
- **Node.js** (Optional) - [Download](https://nodejs.org/)
- **VS Code with Live Server Extension** (Optional) - [Install Extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)

### Installation Steps

#### Step 1: Clone or Download the Project

```bash
cd d:\anuyog_assignment
```

Or download and extract the ZIP file to `d:\anuyog_assignment`

#### Step 2: Verify File Structure

Ensure your directory has the following structure:

```
d:\anuyog_assignment\
│
├── index.html              # Main HTML file
├── app.js                  # Application logic and routing
├── styles.css              # All CSS styles and animations
├── README.md               # This file
│
├── datasets/
│   ├── books.csv           # Book inventory data
│   ├── orders.csv          # Order history data
│   └── faq.csv             # FAQ data
│
└── n8n/
    └── workflow.bookstore-chatbot.json   # n8n automation workflow
```

#### Step 3: Choose a Method to Run the Application

You **MUST** use a local web server (file:// protocol won't work due to CORS restrictions on CSV files).

---

### 🐍 **Option A: Python HTTP Server (Recommended)**

1. Open **PowerShell** or **Command Prompt**
2. Navigate to the project folder:
   ```powershell
   cd d:\anuyog_assignment
   ```

3. Run the Python server:
   ```powershell
   # Python 3
   python -m http.server 8000
   ```

4. Open your browser and go to:
   ```
   http://localhost:8000
   ```

---

### 💻 **Option B: VS Code Live Server**

1. Open **VS Code**
2. Install the **Live Server** extension (if not already installed):
   - Press `Ctrl+Shift+X`
   - Search for "Live Server"
   - Click Install

3. Open the project folder in VS Code:
   ```
   File → Open Folder → Select d:\anuyog_assignment
   ```

4. Right-click on `index.html` → **"Open with Live Server"**

5. Browser will automatically open at:
   ```
   http://localhost:5500
   ```

---

### 🟢 **Option C: Node.js HTTP Server**

1. Open **PowerShell** or **Command Prompt**
2. Navigate to the project folder:
   ```powershell
   cd d:\anuyog_assignment
   ```

3. Run the http-server:
   ```powershell
   npx http-server -p 8000
   ```

4. Open your browser and go to:
   ```
   http://localhost:8000
   ```

---

## 🔧 Configuration

### Admin Credentials

Default admin login credentials (configured in `app.js`):

```javascript
Username: admin
Password: admin123
```

**To change credentials:**

1. Open `app.js`
2. Find the `CONFIG` object (around line 6-9):
   ```javascript
   adminCredentials: {
     username: "admin",
     password: "admin123"
   }
   ```
3. Update with your desired credentials

### n8n Webhook Configuration

The chatbot uses n8n for processing chat messages.

**Current webhook URL** (in `app.js` line 3):
```javascript
webhookUrl: "http://localhost:5678/webhook/bookstore-chat"
```

#### Setting up n8n Workflow:

1. **Install n8n** (if not already installed):
   ```bash
   npm install n8n -g
   ```

2. **Start n8n**:
   ```bash
   n8n start
   ```

3. **Import the workflow**:
   - Open n8n interface: `http://localhost:5678`
   - Go to **Workflows** → **Import from File**
   - Select `n8n/workflow.bookstore-chatbot.json`

4. **Activate the workflow**:
   - Open the imported workflow
   - Click **Active** toggle in the top-right

5. **Update webhook URL** (if using different port):
   - Edit `app.js` line 3 with your n8n webhook URL

**Mock Mode**: If n8n is not running, set in `app.js`:
```javascript
enableMockResponses: true  // Line 4
```

---

## 📖 Usage Guide

### For Customers (Chatbot)

1. **Access the Chatbot**:
   - Open the application in your browser
   - You'll see the chatbot interface by default

2. **Ask Questions**:
   - Type your question in the input box
   - Press Enter or click the Send button
   - Get instant responses about books, orders, FAQs

3. **Sample Questions**:
   - "Show me fiction books"
   - "Do you have books by J.K. Rowling?"
   - "What are your store timings?"
   - "Track order 1001"

### For Administrators (Admin Panel)

1. **Login to Admin Panel**:
   - Click the **"Admin"** button in the top-right header
   - Enter credentials:
     - Username: `admin`
     - Password: `admin123`
   - Click **Login**

2. **View Analytics Dashboard**:
   - **Statistics Cards**: Overview of total books, orders, chats, revenue
   - **Order Status Chart**: Pie chart showing order distribution
   - **Chat Activity**: 7-day bar chart of customer interactions
   - **Top Books**: Best-selling books ranked by orders
   - **Recent Activity**: Timeline of latest orders and chats
   - **Genre Distribution**: Book categories breakdown

3. **Refresh Data**:
   - Click the **Refresh** button (🔄) at the top of the analytics section

4. **Logout**:
   - Click the **Logout** button at the bottom of the admin panel

---

## 📊 Data Files (CSV Format)

### `datasets/books.csv`
Contains book inventory information:
```csv
id,title,author,genre,price,available
1,The Alchemist,Paulo Coelho,Fiction,350,In Stock
```

**Columns**:
- `id`: Unique book identifier
- `title`: Book name
- `author`: Author name
- `genre`: Book category
- `price`: Price in INR
- `available`: Stock status

### `datasets/orders.csv`
Contains order history:
```csv
order_id,book_id,title,customer_name,order_date,status
1001,1,The Alchemist,John Doe,2024-01-15,Delivered
```

**Columns**:
- `order_id`: Unique order number
- `book_id`: Reference to book
- `title`: Book title
- `customer_name`: Customer name
- `order_date`: Order date (YYYY-MM-DD)
- `status`: Order status (Pending/Processing/Shipped/Delivered)

### `datasets/faq.csv`
Contains frequently asked questions:
```csv
question,answer
What are your store timings?,We are open from 9 AM to 9 PM
```

---

## 🎯 Routing System

The application uses client-side routing (SPA):

- **`/`** or **`/chatbot`** - Chatbot interface (default)
- **`/admin`** - Admin panel (requires authentication)

**Important Notes**:
- ❌ Don't manually type `/chatbot` or `/admin` in the URL bar
- ✅ Use the **Chatbot** and **Admin** buttons in the header
- ✅ Browser back/forward buttons work correctly
- ⚠️ If you refresh on `/chatbot` or `/admin`, you may get a 404 (this is normal for client-side routing)

---

## 🛠️ Troubleshooting

### Issue: "Cannot find file 'chatbot'"

**Cause**: Trying to access routes without a web server

**Solution**: Use one of the methods in **Step 3** (Python server, Live Server, or Node server)

---

### Issue: CSV files not loading / "No data available"

**Cause**: CORS restrictions when using `file://` protocol

**Solution**: 
1. Make sure you're using a local web server (http://localhost)
2. Check browser console for errors (F12)
3. Verify CSV files exist in `datasets/` folder

---

### Issue: Chatbot not responding

**Possible causes & solutions**:

1. **n8n not running**:
   - Check if n8n is running: `http://localhost:5678`
   - Or enable mock mode in `app.js`:
     ```javascript
     enableMockResponses: true
     ```

2. **Webhook URL incorrect**:
   - Verify URL in `app.js` line 3 matches your n8n webhook

3. **Network error**:
   - Check browser console (F12) for errors
   - Ensure no firewall blocking localhost

---

### Issue: Admin panel not opening

**Solution**:
1. Make sure you're logged in with correct credentials
2. Check browser localStorage is not disabled
3. Try clearing browser cache and localStorage:
   ```javascript
   // In browser console (F12):
   localStorage.clear();
   location.reload();
   ```

---

### Issue: Analytics showing "No data"

**Solution**:
1. Ensure CSV files have data (check `datasets/` folder)
2. Click the Refresh button (🔄) in analytics section
3. Check browser console for loading errors

---

## 🌐 Browser Compatibility

Tested and working on:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+
- ✅ Opera 76+

**Required browser features**:
- ES6+ JavaScript
- Canvas API
- LocalStorage
- Fetch API
- History API

---

## 📱 Responsive Design

The application is fully responsive and works on:
- 💻 Desktop (1920px+)
- 💻 Laptop (1366px - 1920px)
- 📱 Tablet (768px - 1366px)
- 📱 Mobile (320px - 768px)

---

## 🔐 Security Notes

⚠️ **This is a development/demo application**. For production use:

1. **Authentication**: Replace localStorage auth with secure backend authentication (JWT, OAuth)
2. **Credentials**: Never hardcode credentials in frontend JavaScript
3. **API**: Use environment variables for webhook URLs
4. **HTTPS**: Deploy with SSL/TLS certificates
5. **Input Validation**: Add server-side validation for all inputs
6. **CSRF Protection**: Implement CSRF tokens for form submissions

---

## 📁 Project Structure Details

```
d:\anuyog_assignment\
│
├── index.html                 # Main HTML structure
│   ├── Header (Chatbot/Admin buttons)
│   ├── Chatbot interface (default view)
│   ├── Admin Panel (login + analytics)
│   └── Canvas elements for charts
│
├── app.js                     # Application logic (911 lines)
│   ├── CONFIG object (webhook, routes, credentials)
│   ├── Router (navigate, handleRoute, init)
│   ├── Session management (localStorage)
│   ├── Chat functions (sendMessage, displayMessage)
│   ├── Admin functions (login, logout, updateStats)
│   ├── Analytics rendering (6 functions)
│   │   ├── renderOrderStatusChart()
│   │   ├── renderChatActivityChart()
│   │   ├── renderTopBooks()
│   │   ├── renderRecentActivity()
│   │   ├── renderGenreDistribution()
│   │   └── updateTrendIndicators()
│   └── Dataset loading (CSV parser)
│
├── styles.css                 # Complete styling (1800+ lines)
│   ├── Base styles & CSS variables
│   ├── Header & navigation
│   ├── Chatbot UI (messages, input, welcome screen)
│   ├── Admin panel & login form
│   ├── Analytics dashboard (cards, charts, timeline)
│   ├── Animations (@keyframes)
│   └── Responsive (@media queries)
│
├── datasets/                  # Data files
│   ├── books.csv             # Book inventory
│   ├── orders.csv            # Order history
│   └── faq.csv               # FAQs
│
└── n8n/                       # Automation
    └── workflow.bookstore-chatbot.json
```

---

## 🚀 Advanced Configuration

### Changing Theme Colors

Edit CSS variables in `styles.css` (lines 1-20):

```css
:root {
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --primary-color: #667eea;
  --primary-dark: #5568d3;
  /* ... more variables ... */
}
```

### Adding New Routes

1. Add route to `CONFIG.routes` in `app.js`:
   ```javascript
   routes: {
     home: '/',
     chatbot: '/chatbot',
     admin: '/admin',
     newRoute: '/new-route'  // Add this
   }
   ```

2. Add case in `router.handleRoute()`:
   ```javascript
   case CONFIG.routes.newRoute:
     // Your logic here
     break;
   ```

### Conversation Context Memory

Adjust memory in `app.js` line 5:
```javascript
maxContextMessages: 5  // Remember last N messages
```

---

## 📞 Support

For issues or questions:

1. Check **Troubleshooting** section above
2. Review browser console for errors (F12)
3. Verify all files are in correct locations
4. Ensure web server is running properly

---

## 🎉 Success Checklist

Before considering setup complete, verify:

- [ ] Web server is running (Python/Live Server/Node)
- [ ] Application opens at `http://localhost:XXXX`
- [ ] Chatbot interface loads with welcome message
- [ ] Can send messages in chatbot (even without n8n)
- [ ] Admin button visible in header
- [ ] Can login to admin panel (admin/admin123)
- [ ] Analytics dashboard shows data
- [ ] All 6 analytics components render correctly
- [ ] CSV data loads (check browser console)
- [ ] No errors in browser console (F12)

---

## 📝 License

This project is for educational/demonstration purposes.

---

## 🎨 Credits

- **Fonts**: Google Fonts (Poppings, Inter)
- **Icons**: Font Awesome 6.4.0
- **Automation**: n8n workflow engine
- **Design**: Custom gradient theme with modern UI/UX

---

## 🔄 Version History

- **v1.0** - Initial release with basic chatbot
- **v1.1** - Added admin panel and routing
- **v1.2** - UI beautification with gradients
- **v1.3** - Complete analytics dashboard with real data
- **v1.4** - Fixed hardcoded data, using actual CSV + localStorage

---

**🚀 Happy Coding! Ready to chat with your bookstore AI assistant!**

For the best experience, start with **Python HTTP Server** method (Step 3, Option A).
