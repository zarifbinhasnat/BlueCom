# 🐟 Bluecon - Aquaculture Management System

> A centralized database for managing aquarium fish farms and global trade operations.

**Team 0blue4brown** | IUT | RDBMS (CSE 4508)

---

## 🎯 Why Bluecon?

Live aquarium fish import needs strict environmental and quarantine control, but most records are still **manual**. Global buyers expect clear **traceability**, disease history, and accurate data. Current workflows rely on paper records, leading to errors, unclear pricing, and compliance issues.

**Bluecon solves this** by digitizing the entire supply chain from farm → batch → shipment with transparent cost tracking and real-time monitoring.

---

## ✨ Key Features

### 🔍 End-to-End Traceability
Track exported fish back to original farm, tank, and water logs for customs compliance.

### 💰 Dynamic Pricing Calculator
Auto-calculate selling prices from production costs (feed, labor, utilities) + logistics + profit margin.

### 📊 Mortality Risk Analysis
Compare death rates across species to identify high-risk breeds and optimize farm profitability.

### 🚨 Real-Time Biosecurity Alerts
Monitor water conditions (pH, temperature) and flag tanks deviating from safe parameters.

---

## 🗄️ Database Structure

**13 Tables | 3 Categories**

```
Master Data      Operational              Commercial
├─ Species       ├─ Batches               ├─ Customers
├─ Farms         ├─ Financials            ├─ Orders
└─ Tanks         ├─ Feeding Logs          ├─ Order Items
                 ├─ Health Logs           ├─ Shipments
                 └─ Water Quality Logs    └─ Shipment Details
```

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                      │
│          (psql CLI | pgAdmin | Custom Apps)                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL 14+                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              SQL Parser & Planner                    │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     ▼                                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Transaction Management (ACID)               │  │
│  │   • Atomicity  • Consistency  • Isolation  • Durability│
│  └──────────────────┬───────────────────────────────────┘  │
│                     ▼                                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Storage Engine                          │  │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────┐   │  │
│  │  │   Tables   │  │  Functions │  │   Triggers   │   │  │
│  │  │ (13 tables)│  │  (Profit)  │  │ (Feed Cost)  │   │  │
│  │  └────────────┘  └────────────┘  └──────────────┘   │  │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────┐   │  │
│  │  │   Indexes  │  │ Procedures │  │ Constraints  │   │  │
│  │  │  (B-Tree)  │  │ (Shipment) │  │(CHECK/FK/PK) │   │  │
│  │  └────────────┘  └────────────┘  └──────────────┘   │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     ▼                                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Write-Ahead Log (WAL)                      │  │
│  │          Ensures crash recovery                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      ▼
              ┌───────────────┐
              │  Disk Storage │
              │   (Persistent)│
              └───────────────┘
```

---

## 🐘 Why PostgreSQL?

| Feature | Why It Matters |
|---------|----------------|
| **ACID Compliance** | Prevents "ghost inventory" - if a batch is sold, stock updates instantly |
| **Complex Joins** | Calculates dynamic pricing across 5+ tables (feed, labor, water, logistics) |
| **CHECK Constraints** | Enforces biological rules (e.g., pH must be 0-14, temp must be realistic) |
| **Triggers & Functions** | Auto-updates costs when feeding occurs, calculates profits on-demand |

---

## 📁 Project Structure

```
database/
├── schema.sql                    # 13 tables with constraints
├── batch_profit_calculation.sql  # Dynamic pricing function
├── feed_cost_auto_update.sql     # Real-time cost tracking trigger
└── seeds.sql                     # 350+ sample records

docs/
├── PRESENTATION_2_DEMO.md        # Demo script
└── SETUP_GUIDE.md                # Installation guide
```



---

**Team Members**: Rahinur Bin Naushad | Zarif Bin Hasnat | Arifin Rafi | Farhan Ishraq Ayon
