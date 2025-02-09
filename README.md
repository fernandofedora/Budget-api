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
