-- Run once on existing databases after deploying the SubscriptionPlan entity change
-- (displayName column -> description).

-- PostgreSQL (column name may be "displayName" if created with quoted identifier)
ALTER TABLE subscription_plans RENAME COLUMN "displayName" TO description;

-- If the above fails with "column does not exist", try unquoted camelCase as stored by some setups:
-- ALTER TABLE subscription_plans RENAME COLUMN displayname TO description;

-- MySQL
-- ALTER TABLE subscription_plans CHANGE displayName description VARCHAR(255) NOT NULL;
