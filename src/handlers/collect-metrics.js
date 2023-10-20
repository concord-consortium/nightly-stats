const mysql = require('mysql');
const { Client: PGClient } = require('pg');

const queryPortalMetricFn = (conn) => async (query) => {
  return new Promise((resolve, reject) => {
    conn.query(query, (err, results, fields) => {
      if (err) {
        reject(err);
      } else {
        resolve(results[0]);
      }
    });
  });
};

const saveMetricFn = (conn) => async (name, data) => {
  console.log(name, data);
  await conn.query(
    `INSERT INTO basic_metrics
          (time, metric, data)
        VALUES
          (CURRENT_TIMESTAMP, $1, $2)`,
    [name, data],
  );
}

exports.collectMetrics = async () => {
  return new Promise(async (resolve, reject) => {
    let portalConnection, metricsClient;

    const {
      PORTAL_DATABASE_NAME,
      PORTAL_DATABASE_USERNAME,
      PORTAL_DATABASE_PASSWORD,
      PORTAL_DATABASE_HOST,
      METRICS_DATABASE_NAME,
      METRICS_DATABASE_USERNAME,
      METRICS_DATABASE_PASSWORD,
      METRICS_DATABASE_HOST,
    } = process.env;

    const portalDBUrl = `mysql://${PORTAL_DATABASE_USERNAME}:${PORTAL_DATABASE_PASSWORD}@${PORTAL_DATABASE_HOST}/${PORTAL_DATABASE_NAME}`;

    try {
      portalConnection = mysql.createConnection(portalDBUrl);
      portalConnection.connect((err) => {
        if (err) {
          throw err;
        }
      });

      metricsClient = new PGClient({
        database: METRICS_DATABASE_NAME,
        user: METRICS_DATABASE_USERNAME,
        password: METRICS_DATABASE_PASSWORD,
        host: METRICS_DATABASE_HOST,
      });
      await metricsClient.connect();

      const queryPortalMetric = queryPortalMetricFn(portalConnection);
      const saveMetric = saveMetricFn(metricsClient);

      let results = await queryPortalMetric('SELECT COUNT(*) AS user_count FROM users');
      await saveMetric('user_count', { user_count: results.user_count });

      results = await queryPortalMetric('SELECT COUNT(*) AS user_count FROM users WHERE current_sign_in_at >= DATE(NOW() - INTERVAL 1 DAY)');
      await saveMetric('signed_in_users_last_day', { signed_in_users_last_day: results.user_count });
    }
    catch (err) {
      console.error(err);
    }

    if (portalConnection) {
      portalConnection?.end();
    }
    if (metricsClient) {
      metricsClient.end();
    }
  });
}
