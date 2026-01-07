/**
 * Mock Gong Data for Demo Mode
 *
 * This file contains realistic mock data for demonstrating the call summary agent
 * without requiring actual Gong API credentials.
 *
 * The mock data represents a 20-minute product demo call with:
 * - Sales rep (internal) + 2 prospects (external)
 * - Feature walkthrough, pricing discussion, objections, and action items
 */

import type { GongApiResponse, GongWebhookData } from './types';

/**
 * Mock call ID used in demo mode
 */
export const MOCK_CALL_ID = 'demo-call-001';

/**
 * Mock webhook data representing the call metadata
 */
export const MOCK_WEBHOOK_DATA: GongWebhookData = {
  callData: {
    metaData: {
      id: MOCK_CALL_ID,
      url: 'https://app.gong.io/call?id=demo-call-001',
      title: 'CompanyName - Product Demo',
      scheduled: '2025-01-06T14:00:00Z',
      started: '2025-01-06T14:02:00Z',
      duration: 1200, // 20 minutes in seconds
      system: 'Zoom',
      meetingUrl: 'https://zoom.us/j/123456789',
    },
    parties: [
      {
        id: 'party-1',
        emailAddress: 'person1@ourcompany.com',
        name: 'Person1',
        title: 'Senior Account Executive',
        userId: 'user-1',
        speakerId: 'speaker-1',
        affiliation: 'Internal',
      },
      {
        id: 'party-2',
        emailAddress: 'person2@companyname.com',
        name: 'Person2',
        title: 'VP of Engineering',
        userId: null,
        speakerId: 'speaker-2',
        affiliation: 'External',
      },
      {
        id: 'party-3',
        emailAddress: 'person3@companyname.com',
        name: 'Person3',
        title: 'CTO',
        userId: null,
        speakerId: 'speaker-3',
        affiliation: 'External',
      },
    ],
    context: [
      {
        system: 'Salesforce',
        objects: [
          {
            objectType: 'Account',
            objectId: '001xx000003DEMO',
            fields: [
              { name: 'Name', value: 'CompanyName' },
              { name: 'Industry', value: 'Technology' },
            ],
          },
        ],
      },
    ],
  },
};

/**
 * Mock transcript response with realistic product demo conversation
 */
export const MOCK_TRANSCRIPT_RESPONSE: GongApiResponse = {
  callTranscripts: [
    {
      callId: MOCK_CALL_ID,
      transcript: [
        // Introduction (0:00-2:00)
        {
          speakerId: 'speaker-1',
          topic: 'Introduction',
          sentences: [
            {
              start: 5000,
              end: 12000,
              text: "Hi Person2, Person3, thank you so much for taking the time to meet with us today.",
            },
            {
              start: 12500,
              end: 22000,
              text: "I know you've been evaluating several solutions for your data pipeline needs, and I'm excited to show you how our platform can help streamline your operations.",
            },
            {
              start: 23000,
              end: 32000,
              text: "Before we dive in, I'd love to hear a bit more about what you're currently working with and what challenges you're facing.",
            },
          ],
        },
        {
          speakerId: 'speaker-3',
          topic: 'Introduction',
          sentences: [
            {
              start: 35000,
              end: 48000,
              text: "Thanks Person1. We're currently using a combination of custom scripts and legacy ETL tools that have become quite difficult to maintain.",
            },
            {
              start: 49000,
              end: 62000,
              text: "Our engineering team spends about 30% of their time just keeping the data pipelines running instead of building new features.",
            },
            {
              start: 63000,
              end: 75000,
              text: "We need something more reliable and easier to manage, especially as we scale to handle more data sources.",
            },
          ],
        },
        {
          speakerId: 'speaker-2',
          topic: 'Introduction',
          sentences: [
            {
              start: 78000,
              end: 92000,
              text: "Yeah, and we're also dealing with compliance requirements. We need better visibility into our data lineage and the ability to audit transformations.",
            },
          ],
        },
        // Platform Overview (2:00-6:00)
        {
          speakerId: 'speaker-1',
          topic: 'Platform Overview',
          sentences: [
            {
              start: 120000,
              end: 135000,
              text: "That's exactly what we've built our platform to solve. Let me share my screen and walk you through the main components.",
            },
            {
              start: 140000,
              end: 158000,
              text: "As you can see here, this is our main dashboard. You get a real-time view of all your data pipelines, their health status, and any issues that need attention.",
            },
            {
              start: 160000,
              end: 178000,
              text: "The platform uses intelligent monitoring to detect anomalies before they become problems. We've reduced pipeline failures by 85% for our customers on average.",
            },
            {
              start: 180000,
              end: 198000,
              text: "One thing that sets us apart is our no-code transformation builder. Your team can create complex data transformations without writing any Python or SQL.",
            },
          ],
        },
        {
          speakerId: 'speaker-2',
          topic: 'Platform Overview',
          sentences: [
            {
              start: 205000,
              end: 220000,
              text: "That's interesting. But our team is pretty technical. We actually prefer having full control over the transformations with code.",
            },
          ],
        },
        {
          speakerId: 'speaker-1',
          topic: 'Platform Overview',
          sentences: [
            {
              start: 225000,
              end: 245000,
              text: "Absolutely, and that's the beauty of our approach. You can use the visual builder for quick wins, or drop down into our SQL or Python IDE for full control.",
            },
            {
              start: 248000,
              end: 268000,
              text: "We also have Git integration built in, so all your transformations can be version controlled and go through your normal code review process.",
            },
          ],
        },
        {
          speakerId: 'speaker-3',
          topic: 'Platform Overview',
          sentences: [
            {
              start: 275000,
              end: 290000,
              text: "Oh nice, that's important for us. We use GitHub Enterprise for everything.",
            },
          ],
        },
        // Integration Demo (6:00-10:00)
        {
          speakerId: 'speaker-1',
          topic: 'Integration Demo',
          sentences: [
            {
              start: 360000,
              end: 380000,
              text: "Perfect. Let me show you how the integration works. We have native connectors for over 200 data sources, including all the major cloud data warehouses.",
            },
            {
              start: 385000,
              end: 405000,
              text: "I see from our earlier conversation that you're using Snowflake and have data coming from Salesforce, Stripe, and your internal PostgreSQL databases.",
            },
            {
              start: 410000,
              end: 430000,
              text: "Here's how easy it is to set up a new source. I'll connect to a demo Salesforce instance. You just authenticate with OAuth, select the objects you want to sync, and we handle the rest.",
            },
          ],
        },
        {
          speakerId: 'speaker-2',
          topic: 'Integration Demo',
          sentences: [
            {
              start: 440000,
              end: 465000,
              text: "How does this integrate with our existing Salesforce setup? We have a lot of custom objects and fields that we've built over the years.",
            },
          ],
        },
        {
          speakerId: 'speaker-1',
          topic: 'Integration Demo',
          sentences: [
            {
              start: 470000,
              end: 495000,
              text: "Great question. Our Salesforce connector automatically discovers all your custom objects and fields. It maintains the relationships between objects and handles schema changes automatically.",
            },
            {
              start: 500000,
              end: 520000,
              text: "We also support Salesforce's Change Data Capture, so you get near real-time sync for critical data without impacting your API limits.",
            },
            {
              start: 525000,
              end: 545000,
              text: "Let me pull up an example. Here's a customer who has over 50 custom objects in Salesforce, and we're syncing all of them with sub-minute latency.",
            },
          ],
        },
        {
          speakerId: 'speaker-3',
          topic: 'Integration Demo',
          sentences: [
            {
              start: 555000,
              end: 575000,
              text: "That's impressive. What about data quality? We've had issues with duplicate records and inconsistent formatting in the past.",
            },
          ],
        },
        {
          speakerId: 'speaker-1',
          topic: 'Integration Demo',
          sentences: [
            {
              start: 580000,
              end: 600000,
              text: "We have built-in data quality checks that you can configure for each pipeline. Things like null checks, format validation, and duplicate detection.",
            },
          ],
        },
        // Analytics Dashboard (10:00-14:00)
        {
          speakerId: 'speaker-1',
          topic: 'Analytics Dashboard',
          sentences: [
            {
              start: 600000,
              end: 620000,
              text: "Now let me show you the analytics dashboard that Person2, you mentioned earlier about compliance and data lineage.",
            },
            {
              start: 625000,
              end: 650000,
              text: "This is our data lineage view. You can see exactly where every piece of data comes from, how it's been transformed, and where it ends up.",
            },
            {
              start: 655000,
              end: 680000,
              text: "For compliance purposes, we maintain a complete audit trail. Every change to a pipeline, every data transformation, and every access event is logged and searchable.",
            },
          ],
        },
        {
          speakerId: 'speaker-2',
          topic: 'Analytics Dashboard',
          sentences: [
            {
              start: 690000,
              end: 715000,
              text: "Can we export these audit logs to our SIEM system? We use Splunk for centralized security monitoring.",
            },
          ],
        },
        {
          speakerId: 'speaker-1',
          topic: 'Analytics Dashboard',
          sentences: [
            {
              start: 720000,
              end: 745000,
              text: "Yes, we have a native Splunk integration. You can stream all audit events in real-time, and we support custom event formatting to match your existing schema.",
            },
            {
              start: 750000,
              end: 775000,
              text: "We also support AWS CloudWatch, Datadog, and any system that can receive webhooks.",
            },
          ],
        },
        {
          speakerId: 'speaker-3',
          topic: 'Analytics Dashboard',
          sentences: [
            {
              start: 785000,
              end: 810000,
              text: "This is really comprehensive. I think this could significantly reduce the time our team spends on data infrastructure.",
            },
          ],
        },
        // Pricing Discussion (14:00-17:00) - includes objection
        {
          speakerId: 'speaker-1',
          topic: 'Pricing Discussion',
          sentences: [
            {
              start: 840000,
              end: 865000,
              text: "Thank you, Person3. Should we talk about pricing? I want to make sure we find a package that fits your needs and budget.",
            },
            {
              start: 870000,
              end: 895000,
              text: "Based on what you've shared about your data volume and the number of sources, I'd recommend our Growth tier, which starts at $3,000 per month.",
            },
            {
              start: 900000,
              end: 925000,
              text: "That includes unlimited pipelines, up to 50 data sources, and our standard support package with 4-hour response time.",
            },
          ],
        },
        {
          speakerId: 'speaker-3',
          topic: 'Pricing Discussion',
          sentences: [
            {
              start: 935000,
              end: 965000,
              text: "The enterprise tier seems expensive compared to some of the other solutions we've been looking at. Can you help me understand what justifies the premium?",
            },
          ],
        },
        {
          speakerId: 'speaker-1',
          topic: 'Pricing Discussion',
          sentences: [
            {
              start: 970000,
              end: 1000000,
              text: "That's a fair question. The key difference is total cost of ownership. Our customers typically see a 40% reduction in engineering time spent on data infrastructure.",
            },
            {
              start: 1005000,
              end: 1035000,
              text: "With your team spending 30% of their time on pipeline maintenance, that translates to significant savings. Let me pull up our ROI calculator.",
            },
            {
              start: 1040000,
              end: 1070000,
              text: "Based on your team size, if we can reduce that maintenance time by even half, you're looking at the equivalent of two full-time engineers worth of productivity recovered.",
            },
          ],
        },
        {
          speakerId: 'speaker-2',
          topic: 'Pricing Discussion',
          sentences: [
            {
              start: 1080000,
              end: 1105000,
              text: "That's a compelling way to look at it. We've definitely felt the pain of having senior engineers doing maintenance instead of feature work.",
            },
          ],
        },
        // Q&A and Next Steps (17:00-20:00) - includes action items
        {
          speakerId: 'speaker-3',
          topic: 'Next Steps',
          sentences: [
            {
              start: 1020000,
              end: 1045000,
              text: "This has been really helpful. I think we need to loop in our security team before making a decision. They'll want to review the compliance certifications.",
            },
          ],
        },
        {
          speakerId: 'speaker-1',
          topic: 'Next Steps',
          sentences: [
            {
              start: 1050000,
              end: 1075000,
              text: "Absolutely, I'll send over our SOC 2 Type II report, GDPR documentation, and our security whitepaper. Would it be helpful to schedule a call with your security team directly?",
            },
          ],
        },
        {
          speakerId: 'speaker-3',
          topic: 'Next Steps',
          sentences: [
            {
              start: 1085000,
              end: 1110000,
              text: "Yes, that would be great. Let's plan for that next week if possible.",
            },
          ],
        },
        {
          speakerId: 'speaker-2',
          topic: 'Next Steps',
          sentences: [
            {
              start: 1115000,
              end: 1145000,
              text: "I'd also like to get the technical documentation for your API. We'll need to evaluate how it fits with our CI/CD pipeline.",
            },
          ],
        },
        {
          speakerId: 'speaker-1',
          topic: 'Next Steps',
          sentences: [
            {
              start: 1150000,
              end: 1180000,
              text: "Of course, Person2. I'll send that over today along with some example integration patterns for GitHub Actions and Jenkins.",
            },
            {
              start: 1185000,
              end: 1210000,
              text: "And I'll also include the ROI calculator I mentioned so you can run the numbers with your actual team costs.",
            },
            {
              start: 1215000,
              end: 1240000,
              text: "Thank you both for your time today. I'm really excited about the possibility of working together. Is there anything else you'd like to discuss before we wrap up?",
            },
          ],
        },
        {
          speakerId: 'speaker-3',
          topic: 'Next Steps',
          sentences: [
            {
              start: 1250000,
              end: 1280000,
              text: "I think we're good for now. We'll review the materials and get back to you after the security review. Thanks for the thorough demo, Person1.",
            },
          ],
        },
      ],
    },
  ],
};

/**
 * Get mock transcript data
 * In demo mode, returns the mock data regardless of callId
 */
export function getMockTranscript(): GongApiResponse {
  return MOCK_TRANSCRIPT_RESPONSE;
}

/**
 * Get mock webhook data
 * In demo mode, returns the mock webhook data
 */
export function getMockWebhookData(): GongWebhookData {
  return MOCK_WEBHOOK_DATA;
}

/**
 * Demo Context Files
 *
 * Additional mock files loaded in demo mode to provide realistic context
 * for the AI agent. These simulate data from various sources like CRM,
 * historical calls, and internal documentation.
 */

const DEMO_PREVIOUS_CALL_1 = `# Discovery Call - CompanyName

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
`;

const DEMO_PREVIOUS_CALL_2 = `# Initial Intro Call - CompanyName

**Call ID:** demo-call-intro
**Date:** 2024-12-01
**Duration:** 15 minutes
**Participants:**
- Person4 (SDR) - OurCompany
- Person3 (CTO) - CompanyName

---

## Call Summary

Brief introductory call after Person3 downloaded our data pipeline whitepaper.

## Notes

Person3 reached out after reading our whitepaper on "Modern Data Stack Best Practices." They're actively evaluating solutions to replace their aging data infrastructure.

### Key Quotes
- "We're drowning in maintenance work. Our engineers should be building features, not babysitting pipelines."
- "I've heard good things about your platform from a friend at TechCompany2."
- "We need something that scales. We're planning aggressive growth next year."

### Company Context
- CompanyName is in the B2B SaaS space
- Recently closed Series B ($25M from VentureCapital1)
- Primary product is an analytics platform for e-commerce
- Customers include several Fortune 500 retailers

### Competitive Landscape
- Currently evaluating: OurCompany, Competitor1, Competitor2
- Previously used Competitor3 but found it too rigid
- Open source (Airbyte) considered but concerned about maintenance

## Outcome
Qualified as a strong opportunity. Scheduled discovery call with Person1 (AE).
`;

const DEMO_SALESFORCE_ACCOUNT = `# Salesforce Account: CompanyName

**Account ID:** 001xx000003DEMO
**Record Type:** Prospect
**Owner:** Person1

---

## Company Information

| Field | Value |
|-------|-------|
| **Company Name** | CompanyName Inc. |
| **Industry** | Technology - B2B SaaS |
| **Website** | https://www.companyname.example |
| **Phone** | (555) 123-4567 |
| **Employees** | 85 |
| **Annual Revenue** | $12,000,000 |
| **Founded** | 2019 |

## Address
123 Tech Street, Suite 400
San Francisco, CA 94105
United States

## Company Description
CompanyName is a B2B SaaS company providing analytics solutions for e-commerce businesses. Their platform helps online retailers optimize pricing, inventory, and customer engagement through data-driven insights.

## Account Details

| Field | Value |
|-------|-------|
| **Account Source** | Content Download |
| **Lead Source Detail** | Data Pipeline Whitepaper |
| **Account Tier** | Mid-Market |
| **Territory** | US West |
| **Segment** | Technology |

## Key Metrics

| Metric | Value |
|--------|-------|
| **Estimated Deal Size** | $45,000 ARR |
| **Probability** | 40% |
| **Expected Close** | 2025-03-31 |
| **Sales Cycle (est.)** | 90 days |

## Notes
- Strong technical buyer (CTO actively involved)
- Budget approved for Q1
- Security review required before purchase
- Competitor1 is main alternative being evaluated
`;

const DEMO_SALESFORCE_OPPORTUNITY = `# Salesforce Opportunity: CompanyName - Data Platform

**Opportunity ID:** 006xx000004DEMO
**Account:** CompanyName Inc.
**Owner:** Person1

---

## Opportunity Details

| Field | Value |
|-------|-------|
| **Opportunity Name** | CompanyName - Data Platform Implementation |
| **Stage** | Demo/Evaluation |
| **Amount** | $45,000 |
| **Close Date** | 2025-03-31 |
| **Probability** | 40% |
| **Type** | New Business |
| **Lead Source** | Content Download |

## Products of Interest

| Product | Quantity | Unit Price | Total |
|---------|----------|------------|-------|
| Growth Tier License | 1 | $36,000/yr | $36,000 |
| Premium Support | 1 | $9,000/yr | $9,000 |
| **Total ARR** | | | **$45,000** |

## Buying Committee

| Role | Name | Title | Influence |
|------|------|-------|-----------|
| Economic Buyer | Person5 | CEO | High |
| Technical Buyer | Person3 | CTO | High |
| Champion | Person2 | VP of Engineering | High |
| Influencer | Person6 | Security Lead | Medium |

## Competition

| Competitor | Status | Strengths | Weaknesses |
|------------|--------|-----------|------------|
| Competitor1 | Active | Lower price point | Limited scalability |
| Competitor2 | Evaluating | Enterprise features | Complex implementation |
| Open Source | Dismissed | Free | Maintenance burden |

## Stage History

| Stage | Date | Days in Stage |
|-------|------|---------------|
| Qualification | 2024-12-01 | 7 |
| Discovery | 2024-12-08 | 7 |
| Demo/Evaluation | 2024-12-15 | Current |

## Next Steps
1. Complete product demo (scheduled 2025-01-06)
2. Technical deep-dive with engineering team
3. Security review with Person6
4. Proposal and negotiation
5. Legal/procurement

## Notes
- Strong use case fit - they have exact pain points our platform solves
- CTO is technical champion, well-respected internally
- Main risk: Budget timing if decision slips past Q1
- Competitor1 is 30% cheaper but lacks enterprise features they need
`;

const DEMO_SALESFORCE_CONTACTS = `# Salesforce Contacts: CompanyName

---

## Person2 - VP of Engineering

**Contact ID:** 003xx000001DEMO
**Title:** VP of Engineering
**Email:** person2@companyname.example
**Phone:** (555) 123-4568

### Details
| Field | Value |
|-------|-------|
| **Department** | Engineering |
| **Reports To** | Person3 (CTO) |
| **LinkedIn** | linkedin.com/in/person2-example |
| **Lead Source** | Referral |

### Notes
- 8 years at CompanyName, promoted to VP 2 years ago
- Manages team of 20 engineers
- Previously at TechCompany3 (used our competitor)
- Technical decision maker for infrastructure tools
- Prefers hands-on evaluation before committing

---

## Person3 - CTO

**Contact ID:** 003xx000002DEMO
**Title:** Chief Technology Officer
**Email:** person3@companyname.example
**Phone:** (555) 123-4569

### Details
| Field | Value |
|-------|-------|
| **Department** | Executive |
| **Reports To** | Person5 (CEO) |
| **LinkedIn** | linkedin.com/in/person3-example |
| **Lead Source** | Content Download |

### Notes
- Co-founder, with company since inception
- PhD in Computer Science from University1
- Previously VP Engineering at TechCompany4 (acquired)
- Strong advocate for modern data practices
- Initial contact - downloaded whitepaper

---

## Person5 - CEO

**Contact ID:** 003xx000003DEMO
**Title:** Chief Executive Officer
**Email:** person5@companyname.example
**Phone:** (555) 123-4570

### Details
| Field | Value |
|-------|-------|
| **Department** | Executive |
| **LinkedIn** | linkedin.com/in/person5-example |
| **Lead Source** | N/A |

### Notes
- Co-founder, serial entrepreneur
- Previous company acquired by BigTechCo
- Final sign-off on purchases over $30k
- Not involved in technical evaluation
- Will engage at negotiation stage

---

## Person6 - Security Lead

**Contact ID:** 003xx000004DEMO
**Title:** Head of Security & Compliance
**Email:** person6@companyname.example
**Phone:** (555) 123-4571

### Details
| Field | Value |
|-------|-------|
| **Department** | Security |
| **Reports To** | Person3 (CTO) |
| **LinkedIn** | linkedin.com/in/person6-example |

### Notes
- Joined 6 months ago to lead SOC 2 certification
- Background in enterprise security (BigBank, FinanceCo)
- Will need to review our compliance documentation
- Key stakeholder for security-related questions
`;

const DEMO_COMPANY_RESEARCH = `# Company Research: CompanyName Inc.

*Last Updated: 2025-01-05*

---

## Company Overview

**CompanyName** is a venture-backed B2B SaaS company headquartered in San Francisco. Founded in 2019, they provide an analytics platform that helps e-commerce businesses optimize their operations through data-driven insights.

## Funding History

| Round | Date | Amount | Lead Investor |
|-------|------|--------|---------------|
| Seed | 2019-06 | $2.5M | SeedFund1 |
| Series A | 2021-03 | $10M | VentureCapital2 |
| Series B | 2024-01 | $25M | VentureCapital1 |
| **Total Raised** | | **$37.5M** | |

## Key Metrics (Estimated)

| Metric | Value |
|--------|-------|
| ARR | $8-12M |
| Customers | 150+ |
| Employees | 85 |
| Growth Rate | ~80% YoY |
| Net Revenue Retention | 115% |

## Product & Market

### Product
E-commerce analytics platform with modules for:
- Pricing optimization
- Inventory forecasting
- Customer segmentation
- Marketing attribution
- Demand planning

### Target Market
- Mid-market to enterprise e-commerce companies
- $10M - $500M GMV
- Primary verticals: Retail, Consumer Goods, Fashion

### Key Customers (Public)
- RetailBrand1
- FashionCompany2
- ConsumerGoods3

## Technology Stack (Inferred)

Based on job postings and engineering blog:
- **Cloud:** AWS (primary)
- **Data Warehouse:** Snowflake
- **Backend:** Python, Node.js
- **Frontend:** React, TypeScript
- **Data Processing:** Apache Spark, Airflow
- **Databases:** PostgreSQL, MongoDB, Redis

## Recent News

**December 2024** - Announced partnership with ShopifyPartner for native integration

**October 2024** - Launched new AI-powered demand forecasting module

**June 2024** - Opened second office in New York

**January 2024** - Closed $25M Series B led by VentureCapital1

## Competitive Positioning

CompanyName differentiates through:
1. Deep e-commerce vertical expertise
2. Faster time-to-value (avg 2 weeks to first insights)
3. Strong customer success (NPS of 65+)
4. Modern, user-friendly interface

## Growth Plans

From recent interviews and press releases:
- Planning to double engineering team in 2025
- Expanding into European market Q2 2025
- Building more real-time capabilities
- Increasing data volume 10x as customer base grows
`;

const DEMO_COMPETITIVE_INTEL = `# Competitive Intelligence Brief

*For: CompanyName Opportunity*
*Competitors: Competitor1, Competitor2*

---

## Competitor1

### Overview
| Attribute | Details |
|-----------|---------|
| **Founded** | 2017 |
| **Funding** | $45M (Series B) |
| **Employees** | ~120 |
| **Pricing** | $2,000 - $4,000/month |

### Strengths
- Lower price point (30% less than us)
- Good SMB market presence
- Quick setup for simple use cases
- Strong marketing/brand awareness

### Weaknesses
- Limited scalability (struggles above 1TB/day)
- Basic transformation capabilities
- No real-time sync options
- Limited enterprise features (SSO, RBAC)
- Weaker compliance certifications

### Win Strategy Against Competitor1
1. **Lead with scale**: Emphasize our ability to handle 10x growth
2. **Highlight TCO**: Their maintenance costs are higher long-term
3. **Enterprise features**: SSO, audit logs, advanced RBAC
4. **Transformation power**: Our SQL/Python IDE vs their limited UI
5. **Compliance**: Our SOC 2 Type II vs their Type I

### Common Objections
- *"Competitor1 is cheaper"* → Focus on TCO and engineering time saved
- *"We know Competitor1's team"* → Offer references from similar companies

---

## Competitor2

### Overview
| Attribute | Details |
|-----------|---------|
| **Founded** | 2015 |
| **Funding** | $150M (Series D) |
| **Employees** | ~400 |
| **Pricing** | $5,000 - $15,000/month |

### Strengths
- Enterprise-grade features
- Large customer base
- Extensive connector library
- Strong brand in enterprise market

### Weaknesses
- Complex and slow implementation (avg 3-6 months)
- Expensive professional services required
- Rigid, not developer-friendly
- Heavy, outdated UI
- Overkill for mid-market

### Win Strategy Against Competitor2
1. **Speed to value**: 2 weeks vs 3-6 months implementation
2. **Developer experience**: Git integration, code-first approach
3. **Price/value**: Better fit for mid-market budget
4. **Modern architecture**: Cloud-native vs legacy platform
5. **Agility**: Easier to modify and iterate

### Common Objections
- *"Competitor2 is the safe choice"* → Reference similar-sized wins
- *"They have more connectors"* → We have 200+, custom connector support

---

## Battlecard Summary

### Why Customers Choose Us

| Buyer Priority | Our Advantage |
|----------------|---------------|
| Fast implementation | 2 weeks avg vs months |
| Developer experience | Git-native, code-first |
| Scalability | Handle 10x growth easily |
| Modern stack | Cloud-native architecture |
| Support quality | 4-hour response, dedicated CSM |

### Key Differentiators for CompanyName

Given their specific needs:
1. ✅ **Git integration** - They use GitHub Enterprise
2. ✅ **Snowflake native** - Their primary warehouse
3. ✅ **Compliance** - SOC 2 Type II for their audit needs
4. ✅ **Scale ready** - Handles their 10x growth plan
5. ✅ **Developer-friendly** - Technical team wants code control
`;

const DEMO_SALES_PLAYBOOK = `# Sales Playbook: Data Platform - Mid-Market Tech

*Internal Use Only*

---

## Ideal Customer Profile

### Company Characteristics
- **Size:** 50-500 employees
- **Revenue:** $5M - $100M ARR
- **Industry:** Technology, SaaS, E-commerce
- **Data Volume:** 100GB - 5TB daily
- **Tech Maturity:** Modern stack, cloud-native

### Common Triggers
1. Scaling beyond current ETL solution
2. Engineering team spending >20% time on data maintenance
3. Preparing for compliance audit (SOC 2, GDPR)
4. Moving to cloud data warehouse
5. Post-funding growth initiative

### Key Personas

| Persona | Goals | Pain Points |
|---------|-------|-------------|
| **CTO** | Reduce tech debt, scale efficiently | Engineering bandwidth, reliability |
| **VP Engineering** | Team productivity, modern tools | Maintenance burden, developer experience |
| **Data Lead** | Data quality, faster insights | Pipeline reliability, lineage gaps |
| **Security Lead** | Compliance, audit trails | Vendor security, certifications |

---

## Discovery Questions

### Opening
- "Tell me about your current data infrastructure setup."
- "How much time does your team spend maintaining data pipelines?"
- "What's driving the evaluation of new solutions right now?"

### Pain Points
- "What happens when a pipeline fails? How do you find out?"
- "How do you handle schema changes from source systems?"
- "What compliance requirements do you need to meet?"

### Technical Requirements
- "What's your primary data warehouse?"
- "How important is real-time vs batch processing?"
- "Does your team prefer UI-based or code-based development?"

### Business Impact
- "How does data infrastructure affect your product roadmap?"
- "What would you do with the engineering time you'd get back?"
- "What's the cost of a day of pipeline downtime?"

---

## Value Proposition

### Primary Message
*"We help scaling tech companies reclaim engineering time by providing a reliable, developer-friendly data platform that grows with you."*

### Three Pillars
1. **Reliability**: 99.9% uptime, intelligent monitoring, self-healing pipelines
2. **Developer Experience**: Git-native, code-first, modern interface
3. **Scale Ready**: Handle 10x growth without re-architecting

### ROI Framework
| Metric | Typical Impact |
|--------|----------------|
| Engineering time saved | 40-60% reduction in data maintenance |
| Pipeline failures | 85% reduction in incidents |
| Time to new connector | Hours vs weeks |
| Implementation time | 2 weeks vs months |

---

## Objection Handling

### Price Objection
*"Your solution is more expensive than Competitor1."*

**Response:** "I understand cost is important. Let me share how to think about total cost of ownership. Competitor1's headline price is lower, but customers who've switched to us report spending 40% less engineering time on maintenance. With an engineering cost of $150k+/year, even saving one engineer 10 hours/month pays for the difference. Would it be helpful to walk through the ROI calculator with your actual numbers?"

### Timing Objection
*"We're not ready to make a decision right now."*

**Response:** "That's completely fair. What would need to happen for you to be ready? Often we find starting a technical evaluation now means you're ready to move quickly when budget timing aligns. Would it make sense to do the security review and technical deep-dive now so those aren't blockers later?"

### Feature Objection
*"You don't have [specific feature]."*

**Response:** "Tell me more about how you'd use that feature. Sometimes there's an alternative approach in our platform, and sometimes it's genuinely a gap. We have a transparent roadmap process - if it's a common request, I can share where it falls in our priorities."

---

## Demo Best Practices

### Before the Demo
- [ ] Review account history and previous call notes
- [ ] Customize demo data to match their use case
- [ ] Prepare relevant customer references
- [ ] Test all integrations you plan to show

### During the Demo
- [ ] Start with their stated pain points, not features
- [ ] Show the dashboard health view first (reliability)
- [ ] Demonstrate Git workflow if technical audience
- [ ] Include compliance/lineage for security stakeholders
- [ ] Leave 10+ minutes for Q&A

### After the Demo
- [ ] Send follow-up email within 2 hours
- [ ] Include relevant documentation requested
- [ ] Propose concrete next steps with dates
- [ ] Update Salesforce with notes and next actions
`;

export interface DemoContextFile {
  path: string;
  content: string;
  description: string;
}

/**
 * Get all demo context files for the sandbox
 * These files provide additional context for the AI agent in demo mode
 */
export function getDemoContextFiles(): DemoContextFile[] {
  return [
    {
      path: 'gong-calls/previous/demo-call-000-discovery-call.md',
      content: DEMO_PREVIOUS_CALL_1,
      description: 'Previous discovery call transcript',
    },
    {
      path: 'gong-calls/previous/demo-call-intro-initial-call.md',
      content: DEMO_PREVIOUS_CALL_2,
      description: 'Initial intro call transcript',
    },
    {
      path: 'salesforce/account.md',
      content: DEMO_SALESFORCE_ACCOUNT,
      description: 'Salesforce account record',
    },
    {
      path: 'salesforce/opportunity.md',
      content: DEMO_SALESFORCE_OPPORTUNITY,
      description: 'Salesforce opportunity record',
    },
    {
      path: 'salesforce/contacts.md',
      content: DEMO_SALESFORCE_CONTACTS,
      description: 'Salesforce contact records',
    },
    {
      path: 'research/company-research.md',
      content: DEMO_COMPANY_RESEARCH,
      description: 'Company background research',
    },
    {
      path: 'research/competitive-intel.md',
      content: DEMO_COMPETITIVE_INTEL,
      description: 'Competitive intelligence brief',
    },
    {
      path: 'playbooks/sales-playbook.md',
      content: DEMO_SALES_PLAYBOOK,
      description: 'Sales playbook and battle card',
    },
  ];
}
