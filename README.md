# Budget-api
RESTful API for managing budgets and expenses, designed to be the backend for personal finance or budget control applications

## Key Features 🚀
- **Budget CRUD**: Create, read, update, and delete budgets.
- **Expense Management**: Track expenses associated with specific budgets.
- **Auto-Calculation**: Real-time updates of remaining budget amounts.
- **Security**: Fund validation before recording expenses.
- **Relational Database**: Uses MySQL with cascading deletion for referential integrity.

## Technologies Used 💻
- **Backend**: Node.js + Express.js
- **Database**: MySQL
- **Middlewares**: CORS, Express JSON parser
- **Environment Variables**: Configuration via `.env` file

## Endpoints 📡
| Method | Route               | Description                     |
|--------|--------------------|---------------------------------|
| GET    | /budgets           | Get all budgets                 |
| POST   | /budgets           | Create a new budget             |
| DELETE | /budgets/:id       | Delete a budget and its expenses|
| POST   | /expenses          | Record a new expense            |
| GET    | /expenses          | Get expenses by budget          |

## Installation & Setup ⚙️

### Prerequisites
- Node.js v16+
- MySQL Server
- npm

### Steps:
1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/budget-api.git
   cd budget-api

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your credentials:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=budgets_db
   PORT=3000
   ```

4. **Initialize database**:
   ```bash
   node app.js
   ```
   This will:
   - Create tables
   - Set up relationships
   - Enable cascading deletions

5. **Start the server**:
   ```bash
   node app.js
   ```
   Successful output:
   ```
   Server running on http://localhost:3000
   Connected to MySQL
   Old tables deleted
   Budgets table created
   Expenses table created with CASCADE
   ```

## 💡 Usage Examples

### Create Budget
```http
POST http://localhost:3000/budgets
Content-Type: application/json

{
  "name": "Marketing Campaign",
  "amount": 5000.00
}
```

### Add Expense
```http
POST http://localhost:3000/expenses
Content-Type: application/json

{
  "budgetId": 1,
  "description": "Facebook Ads",
  "amount": 1200.00
}
```

## 🗃️ Database Schema
```sql
CREATE TABLE budgets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  remaining DECIMAL(10,2) NOT NULL
);

CREATE TABLE expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  budget_id INT NOT NULL,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (budget_id) 
    REFERENCES budgets(id) 
    ON DELETE CASCADE
);
```

## 🤝 Contributing
1. Fork the repository
2. Create feature branch:
   ```bash
   git checkout -b feature/new-feature
   ```
3. Commit changes:
   ```bash
   git commit -m 'Add awesome feature'
   ```
4. Push to branch:
   ```bash
   git push origin feature/new-feature
   ```
5. Open a Pull Request
   
### Key Fixes:
1. **Continuous Numbering**: Steps 1-5 now maintain numerical sequence.  
2. **Consistent Indentation**: Code blocks use 3-space indentation.  
3. **Valid Markdown Syntax**:  
   - Empty lines between lists and code blocks  
   - Triple backticks for code blocks  
   - Consistent headers with `##`  
4. **Step-by-Step Execution**: Terminal commands clearly separated.  
5. **Visual Feedback**: Expected output included in step 5.

 ## 📄 License

This project is licensed under the **MIT License**.  
For more details, see the [LICENSE](LICENSE) file.

