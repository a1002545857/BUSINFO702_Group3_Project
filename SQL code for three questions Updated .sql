-- Query 1: Annual green share of U.S. exports (2020–2024)
-- Groups: Four Partner Countries (AU, CA, NZ, UK) vs China
WITH Annualized AS (
  SELECT
    r.Year,
    c.CountryName,
    r.HTSNumber AS HTSNumber,
    (r.First_quarter + r.Second_quarter + r.Third_quarter + r.Fourth_quarter) AS AnnualValue -- Formula: AnnualValue = Q1 + Q2 + Q3 + Q4
  FROM RawExportsData r
  JOIN Countries c
    ON r.Country = c.CountryName                -- Match country dimension
  WHERE r.Year BETWEEN 2020 AND 2024
    AND c.CountryName IN ('Australia','Canada','New Zealand','United Kingdom','China')
)SELECT a.Year,
  CASE
    WHEN a.CountryName IN ('Australia','Canada','New Zealand','United Kingdom')
      THEN 'Other Five Eyes countries'
    WHEN a.CountryName = 'China'
      THEN 'China'
  END AS DestinationGroup,
  SUM(a.AnnualValue) AS TotalExports,                                                                        -- Formula: TotalExports = Σ AnnualValue
  SUM(CASE WHEN g.HTSNumber IS NOT NULL THEN a.AnnualValue ELSE 0 END) AS GreenExports,                      -- Formula: GreenExports = Σ AnnualValue (only for HTS in GreenProducts)
  ROUND( 100.0 * SUM(CASE WHEN g.HTSNumber IS NOT NULL THEN a.AnnualValue ELSE 0 END) / NULLIF(SUM(a.AnnualValue), 0), 2) AS GreenSharePercent  -- Formula: GreenSharePercent = (GreenExports / TotalExports) × 100
FROM Annualized a
LEFT JOIN GreenProducts g
  ON a.HTSNumber = g.HTSNumber                -- Match HS codes against green product list
GROUP BY a.Year, DestinationGroup
ORDER BY a.Year, DestinationGroup;


-- Query 2: Top product lines by green-export growth (2020Q1 → 2024Q4)
WITH unpivot AS (
  SELECT Year, 1 AS Quarter, Country, HTSNumber, COALESCE(First_quarter, 0) AS TradeValue      -- Step 1: Convert Q1–Q4 columns into rows (Quarter = 1..4)
  FROM RawExportsData
  UNION ALL
  SELECT Year, 2, Country, HTSNumber, COALESCE(Second_quarter, 0)                              -- Formula: TradeValue = COALESCE(QuarterValue, 0)
  FROM RawExportsData
  UNION ALL
  SELECT Year, 3, Country, HTSNumber, COALESCE(Third_quarter, 0)
  FROM RawExportsData
  UNION ALL
  SELECT Year, 4, Country, HTSNumber, COALESCE(Fourth_quarter, 0)
  FROM RawExportsData
),
green_filtered AS (                                   -- Step 2: Keep only destination groups (Four Partners vs China) and green products
  SELECT
    CASE
      WHEN c.CountryName IN ('Australia','Canada','New Zealand','United Kingdom')
        THEN 'Other Five Eyes countries'
      WHEN c.CountryName = 'China'
        THEN 'China'
    END AS DestinationGroup,
    u.HTSNumber,
    u.Year, u.Quarter,
    u.TradeValue
  FROM unpivot u
  JOIN Countries c ON u.Country = c.CountryName
  JOIN (SELECT DISTINCT HTSNumber FROM GreenProducts) g
    ON u.HTSNumber = g.HTSNumber
),
minmax_quarters AS (                                                     -- Step 3: Identify first and last quarter across the dataset
  SELECT MIN(Year*10+Quarter) AS MinYQ, MAX(Year*10+Quarter) AS MaxYQ    -- Formula: Encode Year+Quarter as (Year*10+Quarter) for easy comparison
  FROM green_filtered
),                                        
compare_quarters AS (                                                    -- Step 4(a): Compute start (2020Q1) vs end (2024Q4) values per product and group
  SELECT
    gf.DestinationGroup,
    gf.HTSNumber,
    SUM(CASE WHEN gf.Year*10+gf.Quarter = mm.MinYQ THEN gf.TradeValue ELSE 0 END) AS StartValue,
    SUM(CASE WHEN gf.Year*10+gf.Quarter = mm.MaxYQ THEN gf.TradeValue ELSE 0 END) AS EndValue
  FROM green_filtered gf, minmax_quarters mm
  GROUP BY gf.DestinationGroup, gf.HTSNumber
),
/* compare_quarters AS (                                                                   -- Step 4(b): Compute start (2020) vs end (2024) values per product and group
    SELECT
        gf.DestinationGroup,
        gf.HTSNumber,
        SUM(CASE WHEN gf.Year = 2020 THEN gf.TradeValue ELSE 0 END) AS StartValue,       -- New logic: Sum all quarters for 2020
        SUM(CASE WHEN gf.Year = 2024 THEN gf.TradeValue ELSE 0 END) AS EndValue          -- New logic: Sum all quarters for 2024
    FROM green_filtered gf
    GROUP BY gf.DestinationGroup, gf.HTSNumber
), */
with_growth AS (                                                        -- Step 5: Calculate growth metrics
  SELECT
    cq.DestinationGroup,
    cq.HTSNumber,
    p.ProductDescription,
    cq.StartValue,
    cq.EndValue,
    ROUND(cq.EndValue - cq.StartValue, 2) AS AbsChange,                 -- Formula: AbsChange = EndValue − StartValue
    CASE WHEN cq.StartValue > 0
         THEN ROUND(100.0 * (cq.EndValue - cq.StartValue) / cq.StartValue, 2)
         ELSE NULL END AS PctChange                                     -- Formula: PctChange = ((EndValue − StartValue) / StartValue) × 100
  FROM compare_quarters cq
  LEFT JOIN Products p ON p.ProductHS6 = CAST(cq.HTSNumber AS TEXT)
),
ranked_abs AS (                                                         -- Step 6a: Rank products by absolute growth (descending)
  SELECT *, RANK() OVER (PARTITION BY DestinationGroup ORDER BY AbsChange DESC) AS Rank_Abs
  FROM with_growth
),
ranked_pct AS (                                                         -- Step 6b: Rank products by percentage growth (descending)
  SELECT *, RANK() OVER (PARTITION BY DestinationGroup ORDER BY PctChange DESC) AS Rank_Pct
  FROM with_growth
  WHERE PctChange IS NOT NULL
)                                                                       -- Step 7: Final output: Top 10 by absolute growth + Top 10 by percentage growth
SELECT 'Top10_Abs' AS ListType, DestinationGroup, HTSNumber, ProductDescription,
       StartValue AS Export_2020Q1, EndValue AS Export_2024Q4,
       AbsChange, PctChange, Rank_Abs AS RankInGroup
FROM ranked_abs
WHERE Rank_Abs <= 10

UNION ALL

SELECT 'Top10_Pct' AS ListType, DestinationGroup, HTSNumber, ProductDescription,
       StartValue AS Export_2020Q1, EndValue AS Export_2024Q4,
       AbsChange, PctChange, Rank_Pct AS RankInGroup
FROM ranked_pct
WHERE Rank_Pct <= 10
ORDER BY ListType, DestinationGroup, RankInGroup;


-- Query 3: Pearson correlation between YoY polluting-share change and YoY export growth
WITH unpivot AS (                                                                          -- Step 1) Unpivot Q1–Q4 columns to rows (Quarter = 1..4)  
  SELECT Year, 1 AS Quarter, Country, HTSNumber, COALESCE(First_quarter,0) AS TradeValue   -- TradeValue = COALESCE(quarter_value, 0)
  FROM RawExportsData
  UNION ALL
  SELECT Year, 2, Country, HTSNumber, COALESCE(Second_quarter,0)
  FROM RawExportsData
  UNION ALL
  SELECT Year, 3, Country, HTSNumber, COALESCE(Third_quarter,0)
  FROM RawExportsData
  UNION ALL
  SELECT Year, 4, Country, HTSNumber, COALESCE(Fourth_quarter,0)
  FROM RawExportsData
),
grp AS (                                                                                  -- Step 2) Tag destination groups and filter years/countries
  SELECT
    CASE
      WHEN c.CountryName IN ('Australia','Canada','New Zealand','United Kingdom')
        THEN 'Other Five Eyes countries'
      WHEN c.CountryName = 'China'
        THEN 'China'
    END AS DestinationGroup,
    u.Year, u.Quarter, u.HTSNumber, u.TradeValue
  FROM unpivot u
  JOIN Countries c ON u.Country = c.CountryName
  WHERE u.Year BETWEEN 2020 AND 2024
    AND c.CountryName IN ('Australia','Canada','New Zealand','United Kingdom','China')
),
agg AS (                                                                                   
  SELECT                                                                                     -- Step 3) Quarterly totals by group: Total exports and high-pollution exports
    g.DestinationGroup, g.Year, g.Quarter,                             
    SUM(g.TradeValue) AS TotalExport,                                                        -- TotalExport(q)   = Σ TradeValue
    SUM(CASE WHEN hp.HTSNumber IS NOT NULL THEN g.TradeValue ELSE 0 END) AS PollutingExport  -- PollutingExport(q) = Σ TradeValue where HTS in PollutingProducts
  FROM grp g
  LEFT JOIN (SELECT DISTINCT HTSNumber FROM PollutingProducts) hp
    ON g.HTSNumber = hp.HTSNumber
  GROUP BY g.DestinationGroup, g.Year, g.Quarter
),
with_yoy AS (                                                                               -- Step 4) Build YoY series per group and quarter
  SELECT
    a.DestinationGroup, a.Year, a.Quarter,
    100.0 * a.PollutingExport / NULLIF(a.TotalExport,0) AS PollutingShare,                  -- PollutingShare(q) = 100 * PollutingExport / TotalExport     (percent) 
    100.0 * (                                                                               -- TotalExportYoY(q) = 100 * (TotalExport(q) - TotalExport(q-4)) / TotalExport(q-4)   (percent growth)
      a.TotalExport -
      (SELECT b.TotalExport FROM agg b
       WHERE b.DestinationGroup=a.DestinationGroup
         AND b.Year=a.Year-1 AND b.Quarter=a.Quarter)
    ) / NULLIF((
      SELECT b.TotalExport FROM agg b
      WHERE b.DestinationGroup=a.DestinationGroup
        AND b.Year=a.Year-1 AND b.Quarter=a.Quarter
    ),0) AS TotalExportYoY,
    (
      (100.0 * a.PollutingExport / NULLIF(a.TotalExport,0)) -                                
      (SELECT 100.0 * b.PollutingExport / NULLIF(b.TotalExport,0)
       FROM agg b
       WHERE b.DestinationGroup=a.DestinationGroup
         AND b.Year=a.Year-1 AND b.Quarter=a.Quarter)
    ) AS PollutingShareYoYChange
  FROM agg a
  WHERE a.Year >= 2021                                                                     -- need prior-year quarter for YoY
),
stats AS (                                                                                 -- Step 5) Compute summary moments needed for Pearson r (SQLite has no corr())
  SELECT
    DestinationGroup,
    COUNT(*) AS N,
    AVG(TotalExportYoY) AS avg_x,
    AVG(PollutingShareYoYChange) AS avg_y,
    AVG(TotalExportYoY * PollutingShareYoYChange) AS avg_xy,                               -- avg_xy = avg(X*Y), avg_x2 = avg(X^2), avg_y2 = avg(Y^2)
    AVG(TotalExportYoY * TotalExportYoY) AS avg_x2,
    AVG(PollutingShareYoYChange * PollutingShareYoYChange) AS avg_y2
  FROM with_yoy
  WHERE TotalExportYoY IS NOT NULL AND PollutingShareYoYChange IS NOT NULL
  GROUP BY DestinationGroup                                                                
)
SELECT                                                                                     -- Step 6) Pearson correlation and t-statistic
  DestinationGroup, 
  N,
  ROUND(                                                                                   -- PearsonCorr r = (avg_xy - avg_x*avg_y) / ( sqrt(avg_x2 - avg_x^2) * sqrt(avg_y2 - avg_y^2) )
    (avg_xy - avg_x*avg_y) /
    (SQRT(NULLIF(avg_x2 - avg_x*avg_x,0)) * SQRT(NULLIF(avg_y2 - avg_y*avg_y,0)))
  , 4) AS PearsonCorr,
  (N - 2) AS df,                                                                           -- df = N - 2
  ROUND(                                                                                   -- t = r * sqrt(df) / sqrt(1 - r^2)
    ((avg_xy - avg_x*avg_y) /
     (SQRT(NULLIF(avg_x2 - avg_x*avg_x,0)) * SQRT(NULLIF(avg_y2 - avg_y*avg_y,0))))
    * SQRT((N - 2.0) /
           NULLIF(1.0 - POWER(
             (avg_xy - avg_x*avg_y) /
             (SQRT(NULLIF(avg_x2 - avg_x*avg_x,0)) * SQRT(NULLIF(avg_y2 - avg_y*avg_y,0)))
           , 2), 0))
  , 3) AS t_stat
FROM stats;


