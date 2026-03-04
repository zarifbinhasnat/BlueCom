# BLUECON Backend API

RESTful API for the BLUECON Aquaculture Management System.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your PostgreSQL credentials:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=bluecon
PORT=5000
```

4. Initialize database (from project root):
```bash
psql -U your_username -d bluecon -f database/schema.sql
psql -U your_username -d bluecon -f database/feed_cost_auto_update.sql
psql -U your_username -d bluecon -f database/triggers.sql
psql -U your_username -d bluecon -f database/business_logic.sql
psql -U your_username -d bluecon -f database/seeds.sql
```

5. Start server:
```bash
npm run dev    # Development with nodemon
npm start      # Production
```

## API Endpoints

### Master Data

#### Species
- `GET /api/species` - Get all species
- `GET /api/species/:id` - Get species by ID
- `POST /api/species` - Create new species
- `PUT /api/species/:id` - Update species
- `DELETE /api/species/:id` - Delete species

#### Farms
- `GET /api/farms` - Get all farms
- `GET /api/farms/performance` - Get farm performance summary
- `GET /api/farms/:id` - Get farm by ID
- `POST /api/farms` - Create new farm
- `PUT /api/farms/:id` - Update farm
- `DELETE /api/farms/:id` - Delete farm

#### Tanks
- `GET /api/tanks?farm_id=1` - Get all tanks (filter by farm)
- `GET /api/tanks/:id` - Get tank by ID
- `POST /api/tanks` - Create new tank
- `PUT /api/tanks/:id` - Update tank
- `DELETE /api/tanks/:id` - Delete tank

### Operational Data

#### Batches
- `GET /api/batches?farm_id=1&species_id=2&stage=Adult` - Get all batches (with filters)
- `GET /api/batches/:id` - Get batch by ID
- `GET /api/batches/:id/financials` - Get batch financial data
- `GET /api/batches/:id/pricing` - Get batch pricing info
- `POST /api/batches` - Create new batch
- `PUT /api/batches/:id` - Update batch
- `PUT /api/batches/:id/financials` - Update batch financials
- `DELETE /api/batches/:id` - Delete batch

#### Water Logs
- `GET /api/water-logs?tank_id=1&start_date=2026-01-01` - Get water logs (with filters)
- `GET /api/water-logs/tank/:tank_id/compliance` - Check water quality compliance
- `POST /api/water-logs` - Create water log (triggers biosecurity alerts)

#### Feeding Logs
- `GET /api/feeding-logs?batch_id=1` - Get feeding logs
- `GET /api/feeding-logs/batch/:batch_id/summary` - Get feeding summary
- `POST /api/feeding-logs` - Create feeding log (auto-updates financials)

#### Health Logs
- `GET /api/health-logs?batch_id=1` - Get health logs
- `GET /api/health-logs/batch/:batch_id/summary` - Get health summary
- `POST /api/health-logs` - Create health log (auto-updates batch quantity)

### Commercial Data

#### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

#### Orders
- `GET /api/orders?customer_id=1&status=pending` - Get all orders (with filters)
- `GET /api/orders/:id` - Get order by ID with items
- `POST /api/orders` - Create new order with items
- `PATCH /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Delete order

#### Shipments
- `GET /api/shipments?order_id=1&status=in_transit` - Get all shipments
- `GET /api/shipments/:id` - Get shipment by ID with details
- `GET /api/shipments/:id/traceability` - Get traceability for shipment
- `POST /api/shipments` - Create new shipment with batch allocations
- `PATCH /api/shipments/:id/status` - Update shipment status

### Business Intelligence & Analytics

#### Alerts
- `GET /api/analytics/alerts?status=open&severity=critical` - Get all alerts
- `GET /api/analytics/alerts/biosecurity` - Get active biosecurity alerts
- `PATCH /api/analytics/alerts/:id/status` - Update alert status

#### Mortality Analysis
- `GET /api/analytics/mortality/analysis` - Get species mortality analysis
- `GET /api/analytics/mortality/high-risk?threshold=20` - Get high-risk batches

#### Traceability
- `GET /api/analytics/traceability/batch/:batch_id` - Get complete batch traceability
- `GET /api/analytics/traceability/report?start_date=2026-01-01` - Get traceability report

#### Dynamic Pricing
- `GET /api/analytics/pricing/overview?farm_id=1` - Get batch pricing overview
- `GET /api/analytics/pricing/batch/:batch_id/calculate?transport_cost=100&packaging_cost=50` - Calculate selling price

## Request Examples

### Create a Batch
```json
POST /api/batches
{
  "species_id": 1,
  "tank_id": 2,
  "birth_date": "2026-01-15",
  "initial_quantity": 1000,
  "stage": "Fry",
  "estimated_harvest_date": "2026-06-15"
}
```

### Log Water Quality
```json
POST /api/water-logs
{
  "tank_id": 2,
  "ph_level": 7.5,
  "temperature": 25.5,
  "dissolved_oxygen": 6.2,
  "ammonia_level": 0.3,
  "measured_by_user_id": 1
}
```

### Create Order with Items
```json
POST /api/orders
{
  "customer_id": 1,
  "delivery_address": "123 Main St, Tokyo, Japan",
  "currency_code": "USD",
  "items": [
    {
      "species_id": 1,
      "quantity_requested": 500,
      "unit_price": 12.50
    },
    {
      "species_id": 2,
      "quantity_requested": 300,
      "unit_price": 8.75
    }
  ]
}
```

### Create Shipment
```json
POST /api/shipments
{
  "order_id": 1,
  "airway_bill_no": "AWB123456789",
  "driver_name": "John Doe",
  "transport_cost": 250.00,
  "packaging_cost": 75.00,
  "details": [
    {
      "batch_id": 5,
      "quantity_shipped": 500,
      "box_label_id": "BOX-001"
    },
    {
      "batch_id": 7,
      "quantity_shipped": 300,
      "box_label_id": "BOX-002"
    }
  ]
}
```

## Key Features

### Automated Business Logic
- **Feed Cost Tracking**: Automatically updates batch_financials when feeding is logged
- **Biosecurity Alerts**: Auto-creates alerts when water parameters violate species requirements
- **Mortality Tracking**: Auto-updates batch quantities when deaths are logged
- **Inventory Management**: Prevents over-shipping and maintains accurate stock levels
- **Dynamic Pricing**: Calculates selling prices based on production costs + margins

### Data Integrity
- Triggers enforce business rules and maintain traceability
- Prevents deletion of batches with shipment history
- Validates tank availability before batch assignment
- Automatically recalculates order totals when items change

### Compliance & Traceability
- Complete farm-to-customer tracking for customs
- Disease history and mortality rate reporting
- Water quality compliance monitoring
- Export documentation support

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DB_HOST | PostgreSQL host | localhost |
| DB_PORT | PostgreSQL port | 5432 |
| DB_USER | Database user | postgres |
| DB_PASSWORD | Database password | - |
| DB_NAME | Database name | bluecon |
| PORT | Server port | 5000 |
| NODE_ENV | Environment | development |

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message description"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error
