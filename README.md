# nightly-stats

## Creating metrics database

```sql
-- Create database
CREATE DATABASE metrics WITH OWNER = metrics;

-- Create metrics table
CREATE TABLE IF NOT EXISTS
  basic_metrics
(
  time timestamp,
  metric TEXT,
  data jsonb
);

CREATE INDEX IF NOT EXISTS metric_idx ON basic_metrics (metric);

SELECT time, metric, (data->'user_count')::integer AS value FROM basic_metrics WHERE metric = 'user_count' AND $__timeFilter("time")  ORDER BY time;

SELECT time, metric, (data->'signed_in_users_last_seven_days')::integer AS value FROM basic_metrics WHERE metric = 'signed_in_users_last_seven_days' AND $__timeFilter("time")  ORDER BY time;
```

## Metric visualization queries

```sql
-- User Count
SELECT time, metric, (data->'user_count')::integer AS value FROM basic_metrics WHERE metric = 'user_count' AND $__timeFilter("time")  ORDER BY time;
-- User Signins (last 24 hours)
SELECT time, metric, (data->'signed_in_users_last_day')::integer AS value FROM basic_metrics WHERE metric = 'signed_in_users_last_day' AND $__timeFilter("time")  ORDER BY time;
```
