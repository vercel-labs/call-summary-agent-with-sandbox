# Discovery Call - CompanyName

**Call ID:** demo-call-000
**Date:** 2024-12-15
**Duration:** 35 minutes
**Participants:**
- Person1 (Senior Account Executive) - OurCompany
- Person3 (CTO) - CompanyName

---

## Call Summary

Initial discovery call to understand CompanyName's data infrastructure challenges and evaluate fit.

## Key Discussion Points

### Current State
- CompanyName is a Series B startup with 85 employees
- Engineering team of 25, growing to 40 by end of year
- Currently processing ~500GB of data daily across 15 sources
- Using a mix of custom Python scripts, Airflow, and legacy Informatica

### Pain Points Identified
1. **Maintenance burden**: 30% of engineering time spent on pipeline maintenance
2. **Reliability issues**: Average of 3 pipeline failures per week
3. **Scaling concerns**: Current setup won't handle 10x data growth planned for next year
4. **Compliance gaps**: No centralized data lineage or audit trail

### Technical Requirements
- Must integrate with Snowflake (primary data warehouse)
- Need connectors for: Salesforce, Stripe, PostgreSQL, MongoDB, S3
- Real-time sync preferred for critical data
- Git-based workflow for transformations
- SOC 2 Type II compliance required

### Budget & Timeline
- Budget range: $30,000 - $60,000 annually
- Decision timeline: Q1 next year
- Implementation: Want to be live within 2 months of signing

## Action Items
- [ ] Person1: Send technical documentation and API reference
- [ ] Person1: Schedule technical deep-dive with Person2 (VP Engineering)
- [ ] Person3: Compile list of current data sources with volumes
- [ ] Person3: Loop in security team for compliance review

## Next Steps
Follow-up product demo scheduled for 2025-01-06 with Person2 and Person3.
