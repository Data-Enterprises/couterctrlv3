# Near-real-time S3 to S3 Tables Iceberg ingestion

This package replaces the short-lived Fargate task with a Lambda container
running DuckDB.

The Lambda:

1. Receives an S3 `Object Created` event through EventBridge.
2. Atomically claims the exact object in DynamoDB.
3. Acquires a short lease for `lake.curated.sales_staging`.
4. Reads the exact landed CSV object.
5. Runs the existing DuckDB transformation and Iceberg `MERGE`.
6. Marks the file `COMPLETED` or `FAILED`.
7. Releases the table lock in a `finally` block.

The existing staging SQL is included without changing its transformation or
natural-key merge logic.

## Architecture

Paste only the contents inside this Mermaid block into a Mermaid-only editor.

```mermaid
flowchart TD
    S3["Amazon S3: Raw CSV file lands"]
    EB["Amazon EventBridge: Object Created rule"]
    LAMBDA["AWS Lambda container: One invocation per file"]

    CLAIM["DynamoDB: Conditionally claim file"]
    CLAIMED{"File claimed?"}
    DUP["Already processing or completed"]

    LOCK["DynamoDB: Acquire Iceberg table lock"]
    LOCKED{"Lock acquired?"}
    WAIT["Lambda waits briefly and retries"]

    DUCK["DuckDB runtime"]
    ATTACH["Attach S3 Tables Iceberg catalog"]
    READ["Read exact S3 object"]
    TRANSFORM["Transform, validate, cast, and deduplicate"]
    MERGE["MERGE INTO lake.curated.sales_staging"]
    COMMIT{"Iceberg commit successful?"}

    COMPLETE["DynamoDB: Mark file COMPLETED"]
    FAILED["DynamoDB: Mark file FAILED"]
    RELEASE_OK["DynamoDB: Release table lock"]
    RELEASE_FAIL["DynamoDB: Release table lock"]

    SUCCESS["Invocation succeeded"]
    ERROR["Invocation fails for EventBridge retry"]

    TABLE["Amazon S3 Tables: Iceberg table"]
    CLEANUP["S3 Tables: Remove unreferenced files"]
    CW["Amazon CloudWatch Logs"]

    S3 --> EB
    EB --> LAMBDA
    LAMBDA --> CLAIM
    CLAIM --> CLAIMED

    CLAIMED -- No --> DUP
    CLAIMED -- Yes --> LOCK

    LOCK --> LOCKED
    LOCKED -- No --> WAIT
    WAIT --> LOCK
    LOCKED -- Yes --> DUCK

    DUCK --> ATTACH
    ATTACH --> READ
    READ --> TRANSFORM
    TRANSFORM --> MERGE
    MERGE --> COMMIT

    COMMIT -- Yes --> TABLE
    COMMIT -- Yes --> COMPLETE
    COMPLETE --> RELEASE_OK
    RELEASE_OK --> SUCCESS

    COMMIT -- No --> FAILED
    FAILED --> RELEASE_FAIL
    RELEASE_FAIL --> ERROR

    LAMBDA -. Logs .-> CW
    TABLE -. Abandoned files from failed commits .-> CLEANUP

    classDef s3 fill:#6DB33F,stroke:#355E1A,color:#ffffff,stroke-width:2px
    classDef eventbridge fill:#E7157B,stroke:#8A0D49,color:#ffffff,stroke-width:2px
    classDef lambda fill:#FF9900,stroke:#995C00,color:#111111,stroke-width:2px
    classDef dynamodb fill:#4053D6,stroke:#1E2A78,color:#ffffff,stroke-width:2px
    classDef duckdb fill:#FFF000,stroke:#9A9000,color:#111111,stroke-width:2px
    classDef iceberg fill:#00A6D6,stroke:#005C78,color:#ffffff,stroke-width:2px
    classDef cloudwatch fill:#9D4EDD,stroke:#582780,color:#ffffff,stroke-width:2px
    classDef decision fill:#F2F2F2,stroke:#555555,color:#111111,stroke-width:2px
    classDef success fill:#2E8B57,stroke:#14532D,color:#ffffff,stroke-width:2px
    classDef failure fill:#C62828,stroke:#7F0000,color:#ffffff,stroke-width:2px
    classDef neutral fill:#E0E0E0,stroke:#666666,color:#111111,stroke-width:2px

    class S3 s3
    class EB eventbridge
    class LAMBDA,WAIT lambda
    class CLAIM,LOCK,COMPLETE,FAILED,RELEASE_OK,RELEASE_FAIL dynamodb
    class DUCK,ATTACH,READ,TRANSFORM,MERGE duckdb
    class TABLE,CLEANUP iceberg
    class CW cloudwatch
    class CLAIMED,LOCKED,COMMIT decision
    class SUCCESS success
    class ERROR failure
    class DUP neutral
```

## Processing sequence

```mermaid
sequenceDiagram
    autonumber

    participant S3 as Amazon S3
    participant EB as EventBridge
    participant Lambda as Lambda
    participant DDB as DynamoDB
    participant DuckDB as DuckDB
    participant Iceberg as S3 Tables Iceberg

    S3->>EB: Object Created event
    EB->>Lambda: Invoke with exact bucket and key
    Lambda->>DDB: Atomically claim file

    alt File is already active or completed
        DDB-->>Lambda: Conditional write rejected
        Lambda-->>Lambda: Exit successfully
    else File is claimed
        DDB-->>Lambda: Status PROCESSING

        loop Until lock acquired or wait limit reached
            Lambda->>DDB: Acquire table lock lease
            alt Lock unavailable
                DDB-->>Lambda: Conditional write rejected
                Lambda-->>Lambda: Wait with jitter
            else Lock acquired
                DDB-->>Lambda: Lock owner and expiry recorded
            end
        end

        Lambda->>DDB: Status LOADING
        Lambda->>DuckDB: Set exact source URI
        DuckDB->>S3: Read one landed CSV object
        DuckDB->>DuckDB: Transform and derive keys
        DuckDB->>Iceberg: MERGE INTO sales_staging
        Iceberg->>Iceberg: Commit new snapshot

        alt Commit succeeded
            Iceberg-->>DuckDB: Commit successful
            DuckDB-->>Lambda: Row count and date range
            Lambda->>DDB: Status COMPLETED
            Lambda->>DDB: Release table lock
        else Load or commit failed
            DuckDB-->>Lambda: Raise error
            Lambda->>DDB: Status FAILED
            Lambda->>DDB: Release table lock
            Lambda-->>EB: Invocation error for retry
        end
    end
```

## DynamoDB records

The same table stores file records and the current table lock.

```text
FILE#bucket#key#version-or-etag
LOCK#lake.curated.sales_staging
```

A completed file cannot be reclaimed. A failed file can be reclaimed by an
EventBridge retry. A stale `PROCESSING` or `LOADING` item can also be reclaimed
after its lease expires.

The table lock is a lease rather than a permanent lock. If an invocation dies,
another invocation can acquire it after `expires_at`.

## Package contents

```text
.
├── README.md
├── template.yaml
├── samconfig.toml.example
├── scripts
│   ├── enable_s3_eventbridge.sh
│   └── test_event.json
└── src
    ├── Dockerfile
    ├── app.py
    ├── ledger.py
    ├── loader.py
    ├── requirements.txt
    ├── table_lock.py
    └── sql
        ├── 01_attach_lambda.sql
        └── 03_load_staging.sql
```

## Important assumptions

### Input format

Your current `03_load_staging.sql` reads:

```sql
read_csv(getvariable('slice'), union_by_name = true)
```

Therefore, the event prefix in this starter must contain CSV objects. If
your actual landed incremental files are CSV, change the source read in
`03_load_staging.sql` and deploy with:

```text
ExpectedSuffix=.csv
```

### Lambda duration

Set the Lambda timeout to 15 minutes. The lock lease defaults to 14 minutes.
The lock wait limit defaults to four minutes, leaving the remaining invocation
time for DuckDB.

If a single file begins approaching Lambda's memory, `/tmp`, or runtime limits,
move the same modules back into a short-lived Fargate task without changing the
DynamoDB record design.

## Deploy

### 1. Configure SAM

```bash
cp samconfig.toml.example samconfig.toml
```

Review:

- raw bucket and prefix;
- S3 Tables table-bucket ARN;
- Lambda memory and timeout;
- target namespace and table.

### 2. Build

Docker must be running:

```bash
sam build --use-container
```

The image build installs the DuckDB `aws`, `httpfs`, and `iceberg` extensions
into the container.

### 3. Deploy

```bash
sam deploy --guided
```

For later deployments:

```bash
sam build --cached --parallel
sam deploy
```

### 4. Upload a test object

Upload a real CSV object under the configured prefix. Then inspect:

```bash
aws logs tail \
  /aws/lambda/goliath-iceberg-ingestion-IngestionFunction \
  --follow \
  --region us-east-1
```

The exact generated Lambda log-group name may include the stack identifier.
It can also be opened from the CloudFormation stack outputs/resources.

## Local invocation

Build first:

```bash
sam build --use-container
```

Update `scripts/test_event.json` to point at a real object and ETag, then run:

```bash
sam local invoke IngestionFunction \
  --event scripts/test_event.json \
  --env-vars local-env.json
```

Example `local-env.json`:

```json
{
  "IngestionFunction": {
    "AWS_PROFILE": "dcr",
    "AWS_REGION": "us-east-1",
    "LEDGER_TABLE": "goliath-iceberg-ingestion",
    "TABLE_BUCKET_ARN": "arn:aws:s3tables:us-east-1:747273370721:bucket/goliath-curated",
    "TABLE_LOCK_ID": "LOCK#lake.curated.sales_staging",
    "EXPECTED_SUFFIX": ".CSV",
    "CATALOG_ALIAS": "lake",
    "ICEBERG_NAMESPACE": "curated",
    "TARGET_TABLE": "sales_staging"
  }
}
```

For SAM local, mount or expose the local AWS profile to the container as needed.
The deployed Lambda uses its execution role and does not use a named profile.

## Operational behavior

### Duplicate event

The file claim fails conditionally and the invocation exits successfully.

### Import failure

The ledger item becomes `FAILED`, the lock is released, and the handler raises.
An EventBridge retry can claim the `FAILED` item and try again.

### Lambda terminates unexpectedly

The file and lock leases eventually expire. A repeated S3 event or manually
replayed EventBridge event can reclaim the file.

### Successful import

The item becomes `COMPLETED`. Future duplicate events are ignored.

## Notes on the existing MERGE

The included SQL currently contains:

```sql
WHEN NOT MATCHED THEN INSERT *;
```

It is insert-only for an existing natural key. Reprocessing is safe, but a
corrected source row with the same key will not update the existing row. Add a
`WHEN MATCHED THEN UPDATE` clause later if corrected exports must overwrite
existing values.
