/* Step 1: Unpivot the raw data from a wide to a long format */
CREATE TABLE RawData AS   
SELECT  
       Country,
	   HTSNumber,
	   Description,
	   Year,
	   'Q1' AS Quarter,
	   First_quarter AS TradeValue
FROM RawExportsData

UNION ALL

SELECT 
       Country,
	   HTSNumber,
	   Description,
	   Year,
	   'Q2' AS Quarter,
	   Second_quarter AS TradeValue
FROM RawExportsData

UNION ALL

SELECT 
       Country,
	   HTSNumber,
	   Description,
	   Year,
	   'Q3' AS Quarter,
	   Third_quarter AS TradeValue
FROM RawExportsData

UNION ALL

SELECT 
       Country,
	   HTSNumber,
	   Description,
	   Year,
	   'Q4' AS Quarter,
	   Fourth_quarter AS TradeValue
FROM RawExportsData;

/* Step 2: Create the Time dimension table */
CREATE TABLE Time (
       TimeKey INTEGER PRIMARY KEY,
	   Year INTEGER NOT NULL,
	   Quarter INTEGER NOT NULL,
	   QuarterName TEXT NOT NULL);

/* Step 3: Populate the Time dimension table with unique year/quarter combination */
INSERT INTO Time (TimeKey, Year, Quarter, QuarterName)
SELECT DISTINCT 
       CAST(Year AS INTEGER) * 10 + CAST(SUBSTR(Quarter,2,1) AS INTEGER) AS TimeKey, 
	   CAST(Year AS INTEGER) AS Year,
	   CAST(SUBSTR(Quarter,2,1) AS INTEGER) AS Quarter,
	   Quarter AS QuarterName
FROM RawData
ORDER BY Year, Quarter;

/* Step 4: Create the Countries dimension table */
CREATE TABLE Countries (
       CountryKey INTEGER PRIMARY KEY AUTOINCREMENT,
	   CountryName TEXT NOT NULL,
	   Continent TEXT NOT NULL);

/* Step 5: Populate the Countries dimension table and assign continents */
INSERT INTO Countries(CountryName, Continent)
SELECT DISTINCT
       Country,
	   CASE
	       WHEN Country = 'China' THEN 'Asia'
		   WHEN Country = 'Japan' THEN 'Asia'
		   WHEN Country = 'Australia' THEN 'Oceania'
		   WHEN Country = 'New Zealand' THEN 'Oceania'
		   WHEN Country = 'United Kingdom' THEN 'Europe'
		   WHEN Country = 'Canada' THEN 'North America'
		   ELSE 'Other'
	   END AS Continent
FROM RawData;

/* Step 6: Create the Products dimension table */
CREATE TABLE Products (
       ProductKey INTEGER PRIMARY KEY AUTOINCREMENT,
	   ProductHS6 TEXT NOT NULL,
	   ProductDescription TEXT, 
	   ProductHS4 TEXT,
	   ProductHS2 TEXT);

/* Step 7: Populate the Products dimension table with unique products */
INSERT INTO Products (ProductHS6, ProductDescription)
SELECT DISTINCT
       HTSNumber,
	   Description
FROM RawData;

/* Step 8: Add HS4 and HS2 codes by extracting substrings from the HS6 code */
UPDATE Products
SET
   ProductHS4 = SUBSTR(ProductHS6,1,4),
   ProductHS2 = SUBSTR(ProductHS6,1,2);

/* Step 9: Add a new column to classify products by environmental impact */ 
ALTER TABLE Products
ADD COLUMN EnvironmentalCategory TEXT DEFAULT 'Standard';

/* Step 10: Tag products as 'Green' based on an external list */
UPDATE Products
SET EnvironmentalCategory = 'Green'
WHERE ProductHS6 IN (SELECT HTSNumber FROM GreenProducts);

/* Step 11: Tag products as 'Polluting' based on an external list */
UPDATE Products
SET EnvironmentalCategory = 'Polluting'
WHERE ProductHS6 IN (SELECT HTSNumber FROM PollutingProducts);


/* Step 12: Create the main TradeFacts fact table with foreign keys */
CREATE TABLE TradeFacts (
    TradeID INTEGER PRIMARY KEY AUTOINCREMENT,
    ProductKey INTEGER,
    CountryKey INTEGER,
    TimeKey INTEGER,
    TradeValue REAL,
	
    FOREIGN KEY (ProductKey) REFERENCES Products(ProductKey),
    FOREIGN KEY (CountryKey) REFERENCES Countries(CountryKey),
    FOREIGN KEY (TimeKey) REFERENCES Time(TimeKey)
);

/* Step 13: Populate the fact table by joining the raw data with the dimension tables */
INSERT INTO TradeFacts (ProductKey, CountryKey, TimeKey, TradeValue)
SELECT
    p.ProductKey, 
    c.CountryKey, 
    t.TimeKey,
    raw.TradeValue
FROM
    RawData raw
JOIN
    Products p ON raw.HTSNumber = p.ProductHS6
JOIN
    Countries c ON raw.Country = c.CountryName
JOIN
    Time t ON raw.Year = t.Year AND raw.Quarter = t.QuarterName;


--Star Schema Code in Mermaid
---
config:
  theme: default
---
erDiagram
  Time {
    INTEGER TimeKey PK
    INTEGER Year
    INTEGER Quarter
    TEXT QuarterName
  }
  Countries {
    INTEGER CountryKey PK
    TEXT CountryName
    TEXT Continent
  }
  Product {
    INTEGER ProductKey PK
    TEXT ProductHS6
    TEXT ProductDescription
    TEXT ProductHS4
    TEXT ProductHS2
    TEXT EnvironmentalCategory
  }
  TradeFacts {
    INTEGER TradeID PK
    INTEGER ProductKey FK
    INTEGER CountryKey FK
    INTEGER TimeKey FK
    REAL     TradeValue
  }
  Countries||--o{ TradeFacts : "involves"
  Time     ||--o{ TradeFacts : "occurs_at"
  Product  ||--o{ TradeFacts : "of"
